import os
import csv
import re
from flask import Flask, jsonify, request, render_template
import googlemaps
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
app = Flask(__name__)

# Initialize Google Maps Client
gmaps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps = googlemaps.Client(key=gmaps_api_key)

# Parse safety data from CSV file
def parse_safety_data(csv_file_path):
    routes = {}
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                extracted_info = row['Extracted_Info']
                area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
                severity_match = re.search(r"Severity: (\w+)", extracted_info)

                area = area_match.group(1) if area_match else "Unknown"
                severity = severity_match.group(1).lower() if severity_match else "low"
                severity_mapping = {"low": 1, "medium": 2, "high": 3}
                safety_index = severity_mapping.get(severity, 1)

                route = f"{area} - Route"
                if route not in routes:
                    routes[route] = {'safety_index': 0, 'waypoints': []}
                routes[route]['safety_index'] += safety_index
                routes[route]['waypoints'].append({'location': area, 'safety_index': safety_index})
    except FileNotFoundError:
        raise FileNotFoundError(f"The CSV file at {csv_file_path} was not found.")
    return routes

# Load safety data
csv_file_path = '1improved_processed_road_safety_tweets.csv'
route_safety_data = parse_safety_data(csv_file_path)

@app.route('/safest_route')
def get_safest_route():
    start = request.args.get('start', 'Rawalpindi')
    end = request.args.get('end', 'Lahore')
    now = datetime.now()

    # Get the directions from Google Maps with alternatives
    directions_result = gmaps.directions(
        origin=start,
        destination=end,
        mode="driving",
        departure_time=now,
        alternatives=True  # Request alternative routes
    )
    
    if not directions_result:
        return jsonify({"error": "No route found"}), 404

    # Process each route
    routes_data = []
    for route in directions_result:
        route_legs = route['legs'][0]
        waypoints = route_legs['steps']
        
        # Process waypoints for this route
        waypoints_info = []
        for waypoint in waypoints:
            location = waypoint['end_location']
            waypoint_location = {
                'lat': location['lat'],
                'lng': location['lng']
            }
            
            # Get safety index for this location
            safety_index = 1  # Default safety index
            for route_name, route_data in route_safety_data.items():
                if route_name in waypoint.get('html_instructions', ''):
                    safety_index = route_data['safety_index']
                    break

            waypoints_info.append({
                "location": waypoint_location,
                "safety_index": safety_index,
                "instructions": waypoint.get('html_instructions', '')
            })

        # Calculate average safety index for this route
        avg_safety_index = (
            sum(waypoint['safety_index'] for waypoint in waypoints_info) / 
            len(waypoints_info) if waypoints_info else 1
        )

        routes_data.append({
            "waypoints": waypoints_info,
            "safety_index": avg_safety_index,
            "distance": route_legs['distance']['text'],
            "duration": route_legs['duration']['text']
        })

    return jsonify({
        "routes": routes_data
    })

@app.route('/')
def index():
    return render_template("index.html", api_key=gmaps_api_key)

if __name__ == "__main__":
    app.run(debug=True)
