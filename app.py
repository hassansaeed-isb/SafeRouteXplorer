from flask import Flask, request, jsonify, render_template
import googlemaps
import math
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GMAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps = googlemaps.Client(key=GMAPS_API_KEY)

HARDCODED_INCIDENTS = [
    {"name": "Car Accident", "area": "F-8, Islamabad", "severity": 3, "lat": 33.6844, "lng": 73.0479},
    {"name": "Robbery", "area": "G-9, Islamabad", "severity": 2, "lat": 33.6846, "lng": 73.0586},
    {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": 1, "lat": 33.5968, "lng": 73.0476},
    {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": 2, "lat": 33.6124, "lng": 73.0728},
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": 4, "lat": 33.6312, "lng": 73.0657},
    {"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456}
]

def calculate_distance(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def compute_danger_index(route_coords):
    total_score = 0.0
    for incident in HARDCODED_INCIDENTS:
        inc_lat = incident["lat"]
        inc_lng = incident["lng"]
        severity = incident["severity"]

        min_dist = float("inf")
        for (r_lat, r_lng) in route_coords:
            dist = calculate_distance(r_lat, r_lng, inc_lat, inc_lng)
            if dist < min_dist:
                min_dist = dist

        total_score += (severity / max(min_dist, 0.1)) * 10
    return round(total_score, 2)

@app.route("/")
def index():
    # Renders index.html
    return render_template("index.html", api_key=GMAPS_API_KEY)

@app.route("/get_route_data")
def get_route_data():
    """
    GET /get_route_data?origin_lat=...&origin_lng=...&destination=...
    We'll find routes from user location to 'destination' (default "Islamabad"), compute danger index,
    and return them with path coords + danger_points.
    """
    try:
        origin_lat = float(request.args.get("origin_lat"))
        origin_lng = float(request.args.get("origin_lng"))
    except (TypeError, ValueError):
        return jsonify({"error": "Missing or invalid origin_lat/origin_lng"}), 400

    destination = request.args.get("destination", "Islamabad")

    # Call the Directions API
    directions_result = gmaps.directions(
        (origin_lat, origin_lng),
        destination,
        mode="driving",
        alternatives=True
    )
    if not directions_result:
        return jsonify({"error": f"No routes found from your location to {destination}."}), 404

    routes_data = []
    all_danger_points = []

    for route_idx, route in enumerate(directions_result):
        distance_text = route["legs"][0]["distance"]["text"]
        duration_text = route["legs"][0]["duration"]["text"]

        route_coords = []
        path_coords = []
        for leg in route["legs"]:
            for step in leg["steps"]:
                # decode each step polyline
                step_points = googlemaps.convert.decode_polyline(step["polyline"]["points"])
                path_coords.extend(step_points)
                # use end_location for danger calc
                end_lat = step["end_location"]["lat"]
                end_lng = step["end_location"]["lng"]
                route_coords.append((end_lat, end_lng))

        # compute danger
        danger_index = compute_danger_index(route_coords)

        # find incidents near route
        route_incidents = []
        for incident in HARDCODED_INCIDENTS:
            for (r_lat, r_lng) in route_coords:
                dist = calculate_distance(r_lat, r_lng, incident["lat"], incident["lng"])
                if dist < 2:
                    route_incidents.append({
                        "lat": incident["lat"],
                        "lng": incident["lng"],
                        "name": incident["name"],
                        "danger_index": incident["severity"]
                    })
                    break
        all_danger_points.extend(route_incidents)

        routes_data.append({
            "distance": distance_text,
            "duration": duration_text,
            "danger_index": danger_index,
            "is_safest": False,
            "path": path_coords  # array of {lat:..., lng:...}
        })

    # Safest route is one with the lowest danger_index
    safest_i = min(range(len(routes_data)), key=lambda i: routes_data[i]["danger_index"])
    routes_data[safest_i]["is_safest"] = True

    # deduplicate danger points
    unique_dp = {}
    for dp in all_danger_points:
        key = f"{dp['lat']}_{dp['lng']}"
        unique_dp[key] = dp

    return jsonify({
        "routes": routes_data,
        "danger_points": list(unique_dp.values()),
        "destination": destination  # so the client knows which destination was used
    })

if __name__ == "__main__":
    app.run(debug=True)
