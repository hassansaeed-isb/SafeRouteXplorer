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

# HARDCODED_INCIDENTS includes demo incidents
HARDCODED_INCIDENTS = [
    {"name": "Car Accident", "area": "F-8, Islamabad", "severity": 3, "lat": 33.6844, "lng": 73.0479},
    {"name": "Robbery", "area": "G-9, Islamabad", "severity": 2, "lat": 33.6846, "lng": 73.0586},
    {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": 1, "lat": 33.5968, "lng": 73.0476},
    {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": 2, "lat": 33.6124, "lng": 73.0728},
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": 4, "lat": 33.6312, "lng": 73.0657},
    #{"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456},
   # {"name": "Demo Incident 2", "area": "Demo Zone 1", "severity": 3, "lat": 33.7000, "lng": 73.0500},
    {"name": "Mugging", "area": "F-7", "severity": 2, "lat": 33.7200, "lng": 73.0600},
   {"name": "Robbery", "area": "F-6/2", "severity": 2, "lat": 33.7300, "lng": 73.0650}, 
    

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
    return render_template("offline_vector_map.html", incident_data=HARDCODED_INCIDENTS)

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

@app.route("/get_route_data")
def get_route_data():
    if not ONLINE_MODE:
        return jsonify(get_offline_route_data())

  # 1. Get possible textual origin or lat/lng
    origin_str = request.args.get("origin", None)
    origin_lat_str = request.args.get("origin_lat", None)
    origin_lng_str = request.args.get("origin_lng", None)

    # 2. Decide which origin to use
    if origin_str:
        # If user provided a string like "Lahore", use that directly
        origin = origin_str
    else:
        # Otherwise, try to parse lat/lng. If invalid, default to "Rawalpindi"
        try:
            origin_lat = float(origin_lat_str)
            origin_lng = float(origin_lng_str)
            origin = (origin_lat, origin_lng)
        except (TypeError, ValueError):
            origin = "Rawalpindi"

    # 3. Destination is either user-provided or defaults to "Islamabad"
    destination = request.args.get("destination", "Islamabad")

    try:
        # Fetch directions using Google Maps Directions API
        directions_result = gmaps.directions(origin, destination, mode="driving", alternatives=True)

        if not directions_result:
            return jsonify({"routes": [], "danger_points": incident_data})

        routes = []
        danger_points = []

        for route in directions_result:
            distance_text = route["legs"][0]["distance"]["text"]
            duration_text = route["legs"][0]["duration"]["text"]

            # Extract route coordinates and path
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

            # Use safety calculator to get safety index
            if safety_calculator:
                safety_details = safety_calculator.calculate_route_safety(route_coordinates)
                safety_index = safety_details['safety_index']
            else:
                safety_index = 0

            # Get danger points along the route
            route_danger_points = []
            for incident in HARDCODED_INCIDENTS:
                for route_point in route_coordinates:
                    distance = calculate_distance(
                        route_point[0], route_point[1],
                        incident["lat"], incident["lng"]
                    )
                    if distance < 2:  # Within 2 km radius
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
                "path": path_coords,
                "is_safest": False
            })

        # Deduplicate danger points
        unique_danger_points = {}
        for dp in danger_points:
            key = f"{dp['lat']}_{dp['lng']}"
            unique_danger_points[key] = dp
        for incident in HARDCODED_INCIDENTS:
            key = f"{incident['lat']}_{incident['lng']}"
            if "danger_index" not in incident:
                incident["danger_index"] = incident["severity"]
            unique_danger_points[key] = incident

        # Determine the safest route
        safest_route_index = max(range(len(routes)), key=lambda i: routes[i]["safety_index"])
        routes[safest_route_index]["is_safest"] = True

        return jsonify({
            "routes": routes,
            "danger_points": list(unique_danger_points.values()),
            "destination": destination
        })

    except Exception as e:
        print(f"Error in get_route_data: {str(e)}")
        return jsonify({"routes": [], "danger_points": incident_data})

if __name__ == "__main__":
    app.run(debug=True)
