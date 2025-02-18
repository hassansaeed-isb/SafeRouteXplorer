import os
import pandas as pd
from flask import Flask, jsonify, render_template
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
csv_file_path= os.getenv("CSV_FILE_PATH")

try:
    safety_calculator = RouteSafetyCalculator(gmaps, csv_file_path)
    ONLINE_MODE = True
except Exception as e:
    # print(f"API initialization error: {str(e)}")
    incident_loader = OfflineMode(gmaps, csv_file_path)
    ONLINE_MODE = False
    gmaps = None
    safety_calculator = None

# Load incident data
if safety_calculator:
    try:
        incident_data = safety_calculator.incident_locations  # Fetch loaded incidents
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
    return render_template("offline_vector_map.html")
    
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
        
    origin = "Rawalpindi"
    destination = "Islamabad"

    try:
        # Fetch directions using Google Maps Directions API
        directions_result = gmaps.directions(origin, destination, mode="driving", alternatives=True)

        if not directions_result:
            return jsonify({"routes": [], "danger_points": incident_data})

        routes = []
        danger_points = []

        for route in directions_result:
            # Extract route coordinates
            route_coordinates = [
                (step["end_location"]["lat"], step["end_location"]["lng"])
                for leg in route["legs"]
                for step in leg["steps"]
            ]

            # Debug: Print route coordinates
            # print(f"Route coordinates: {route_coordinates}")

            # Use safety calculator to get safety index
            safety_details = safety_calculator.calculate_route_safety(route_coordinates)
            safety_index = safety_details['safety_index']

            # Debug: Print safety index
            # print(f"Safety index for route: {safety_index}")

            # Get danger points along the route using existing logic
            route_danger_points = []
            for incident in incident_data:
                try:
                    lat, lng = incident.lat, incident.lng
                    for route_point in route_coordinates:
                        distance = calculate_distance(route_point[0], route_point[1], lat, lng)
                        if distance < 2:  # Consider incidents within 2 km _-_ only displaying points within 2 km radius
                            route_danger_points.append({
                                "lat": lat,
                                "lng": lng,
                                "name": incident.name,
                                "danger_index": incident.severity.value,  # Convert Enum to int
                            })
                except ValueError:
                    print(f"Invalid incident data skipped: {incident}")

            danger_points.extend(route_danger_points)

            routes.append(
                {
                    "legs": route["legs"],
                    "safety_index": safety_index,
                    "danger_points": route_danger_points,
                }
            )

        # Deduplicate danger points
        unique_danger_points = {f"{dp['lat']},{dp['lng']}": dp for dp in danger_points}.values()

        # Determine the safest route
        safest_route_index = max(range(len(routes)), key=lambda i: routes[i]["safety_index"])

        for i, route in enumerate(routes):
            route["is_safest"] = (i == safest_route_index)

        return jsonify({"routes": routes, "danger_points": list(unique_danger_points)})

    except Exception as e:
        print(f"Error in get_route_data: {str(e)}")
        return jsonify({"routes": [], "danger_points": incident_data})

if __name__ == "__main__":
    app.run(debug=True)