import os
import pandas as pd
from flask import Flask, request, jsonify, render_template
import googlemaps
import math
from dotenv import load_dotenv
from route_safety_calculator import RouteSafetyCalculator
from offline_mode import OfflineMode

app = Flask(__name__)

load_dotenv()

# Initialize Google Maps client
gmaps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps = googlemaps.Client(key=gmaps_api_key)
csv_file_path = os.getenv("CSV_FILE_PATH")

# HARDCODED_INCIDENTS for demo purposes
HARDCODED_INCIDENTS = [
    {"name": "Car Accident", "area": "F-8, Islamabad", "severity": 3, "lat": 33.6844, "lng": 73.0479},
    {"name": "Robbery", "area": "G-9, Islamabad", "severity": 2, "lat": 33.6846, "lng": 73.0586},
    {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": 1, "lat": 33.5968, "lng": 73.0476},
    {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": 2, "lat": 33.6124, "lng": 73.0728},
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": 4, "lat": 33.6312, "lng": 73.0657},
    {"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456}
]

try:
    safety_calculator = RouteSafetyCalculator(gmaps, csv_file_path)
    ONLINE_MODE = True
except Exception as e:
    incident_loader = OfflineMode(gmaps, csv_file_path)
    ONLINE_MODE = False
    gmaps = None
    safety_calculator = None

# Load incident data
if safety_calculator:
    try:
        incident_data = safety_calculator.incident_locations
        print(f"Loaded {len(incident_data)} incidents.")
    except Exception as e:
        print(f"Error loading incident data: {str(e)}")
        incident_data = []
else:
    incident_data = [
        {"name": inc.name, "lat": inc.lat, "lng": inc.lng, "severity": inc.severity.name}
        for inc in incident_loader.incident_locations
    ]

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using the Haversine formula
    :return: Distance in kilometers
    """
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
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
    if ONLINE_MODE:
        try:
            # Test the API key validity
            test_result = gmaps.geocode("Islamabad")
            if test_result:
                return render_template("index.html", api_key=gmaps_api_key)
        except Exception as e:
            print(f"API key validation error: {str(e)}")
    return render_template("offline_vector_map.html")

@app.route("/get_route_data")
def get_route_data():
    if not ONLINE_MODE:
        return jsonify(get_offline_route_data())

    try:
        origin_lat = float(request.args.get("origin_lat"))
        origin_lng = float(request.args.get("origin_lng"))
    except (TypeError, ValueError):
        origin = "Rawalpindi"
        destination = "Islamabad"
    else:
        destination = request.args.get("destination", "Islamabad")
        origin = (origin_lat, origin_lng)

    try:
        directions_result = gmaps.directions(
            origin,
            destination,
            mode="driving",
            alternatives=True
        )

        if not directions_result:
            return jsonify({"routes": [], "danger_points": incident_data})

        routes = []
        danger_points = []

        for route in directions_result:
            distance_text = route["legs"][0]["distance"]["text"]
            duration_text = route["legs"][0]["duration"]["text"]
            
            # Extract route coordinates
            route_coordinates = []
            path_coords = []
            for leg in route["legs"]:
                for step in leg["steps"]:
                    step_points = googlemaps.convert.decode_polyline(step["polyline"]["points"])
                    path_coords.extend(step_points)
                    route_coordinates.append((
                        step["end_location"]["lat"],
                        step["end_location"]["lng"]
                    ))

            # Calculate safety details
            if safety_calculator:
                safety_details = safety_calculator.calculate_route_safety(route_coordinates)
                safety_index = safety_details['safety_index']
            else:
                safety_index = compute_danger_index(route_coordinates)

            # Get danger points along the route
            route_danger_points = []
            for incident in HARDCODED_INCIDENTS:
                for (r_lat, r_lng) in route_coordinates:
                    dist = calculate_distance(r_lat, r_lng, incident["lat"], incident["lng"])
                    if dist < 2:  # Within 2 km radius
                        route_danger_points.append({
                            "lat": incident["lat"],
                            "lng": incident["lng"],
                            "name": incident["name"],
                            "area": incident["area"],
                            "danger_index": incident["severity"]
                        })
                        break

            danger_points.extend(route_danger_points)

            routes.append({
                "legs": route["legs"],
                "distance": distance_text,
                "duration": duration_text,
                "safety_index": safety_index,
                "danger_points": route_danger_points,
                "path": path_coords
            })

        # Deduplicate danger points
        unique_danger_points = {
            f"{dp['lat']},{dp['lng']}": dp 
            for dp in danger_points
        }.values()

        # Determine the safest route
        safest_route_index = max(range(len(routes)), key=lambda i: routes[i]["safety_index"])

        for i, route in enumerate(routes):
            route["is_safest"] = (i == safest_route_index)

        return jsonify({
            "routes": routes,
            "danger_points": list(unique_danger_points),
            "destination": destination
        })

    except Exception as e:
        print(f"Error in get_route_data: {str(e)}")
        return jsonify({"routes": [], "danger_points": incident_data})

def get_offline_route_data():
    return {
        "routes": [{
            "legs": [{
                "start_location": {"lat": 33.6844, "lng": 73.0479},
                "end_location": {"lat": 33.7294, "lng": 73.0931}
            }],
            "safety_index": 85.2,
            "danger_points": incident_data,
            "is_safest": True
        }],
        "danger_points": incident_data
    }

if __name__ == "__main__":
    app.run(debug=True)