import os
import csv
import re
import googlemaps
from flask import Flask, jsonify, render_template
from dotenv import load_dotenv
from route_safety_calculator import RouteSafetyCalculator

load_dotenv()

app = Flask(__name__)

# Initialize Google Maps Client
gmaps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps = googlemaps.Client(key=gmaps_api_key)

# Initialize Route Safety Calculator
route_safety_calculator = RouteSafetyCalculator(gmaps, "1improved_processed_road_safety_tweets.csv")  # Path to your CSV

# Parse CSV to dynamically extract all unique areas and their severity
def parse_csv(file_path):
    extracted_data = []
    areas = set()  # Use a set to store unique areas

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            extracted_info = row['Extracted_Info']
            
            # Use regex to extract 'Area' and 'Severity'
            area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
            severity_match = re.search(r"Severity: (\w+)", extracted_info)

            area = area_match.group(1) if area_match else "Unknown"
            severity = severity_match.group(1).lower() if severity_match else "low"

            # Map severity levels to numerical values
            severity_mapping = {"low": 1, "medium": 2, "high": 3}
            severity_value = severity_mapping.get(severity, 1)

            # Add the area to the set to ensure uniqueness
            areas.add(area)

            # Store the extracted info for each row
            extracted_data.append({
                "Area": area,
                "Severity": severity_value
            })

    return extracted_data, list(areas)

# Geocode locations to get coordinates
def geocode_location(location_name):
    geocode_result = gmaps.geocode(location_name)
    if geocode_result:
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
        return lat, lng
    else:
        return None, None

# Initialize locations with danger_index and safety_index set to 0
def initialize_locations(location_list):
    locations = {}
    for loc in location_list:
        locations[loc] = {'danger_index': 0, 'safety_index': 0}
    return locations

# Update danger index based on extracted information from CSV
def update_danger_index(area, danger_index, a, b, locations):
    if area not in locations:
        locations[area] = {'danger_index': 0, 'safety_index': 0}

    for loc in locations:
        if loc == area:
            new_danger = danger_index * a
        else:
            distance = 1  # Dummy distance for simplicity
            new_danger = (danger_index * a) / (distance * b) if distance > 0 else 0
        locations[loc]['danger_index'] += new_danger

# Normalize and invert safety indexes to a 0-100% scale (where 100% is safest)
def normalize_and_invert_safety_indexes(locations, max_danger_score):
    if max_danger_score == 0:
        return
    for loc in locations:
        normalized_danger_index = (locations[loc]['danger_index'] / max_danger_score) * 100
        locations[loc]['safety_index'] = 100 - min(normalized_danger_index, 100)

# Initialize locations and calculate safety index
csv_file_path = '1improved_processed_road_safety_tweets.csv'  # Path to your CSV
extracted_info_list, target_areas = parse_csv(csv_file_path)
locations = initialize_locations(target_areas)

a = 1.0  # Factor for danger index calculation
b = 2.0  # Factor for distance adjustment
max_danger_score = 3 * len(extracted_info_list)  # Maximum possible danger score

# Update danger indexes based on each incident in the CSV
for info in extracted_info_list:
    area = info.get('Area')
    danger_index = info.get('Severity', 1)
    update_danger_index(area, danger_index, a, b, locations)

# Normalize and invert danger indexes to get safety indexes
normalize_and_invert_safety_indexes(locations, max_danger_score)

@app.route('/get_route_data')
def get_route_data():
    origin = "Rawalpindi"
    destination = "Islamabad"

    # Fetch directions using Google Maps Directions API
    directions_result = gmaps.directions(origin, destination, mode="driving", alternatives=True)

    routes = []
    danger_points = []

    for route in directions_result:
        route_coordinates = [(step['end_location']['lat'], step['end_location']['lng'])
                            for leg in route['legs'] for step in leg['steps']]

        # Calculate safety index for the route
        safety_index = route_safety_calculator.calculate_route_safety(route_coordinates)

        # Ensure that safety_index is being calculated for all routes
        if safety_index is None:
            safety_index = 0  # Or some default value if None

        # Get danger points along the route
        route_danger_points = []
        for incident in route_safety_calculator.incident_locations:
            for route_point in route_coordinates:
                distance = route_safety_calculator._calculate_distance(
                    route_point[0], route_point[1], incident['lat'], incident['lng']
                )
                if distance < 2:  # Only consider incidents within 2 km of the route
                    route_danger_points.append({
                        'lat': incident['lat'],
                        'lng': incident['lng'],
                        'name': incident.get('name', 'Unknown Location'),
                        'danger_index': incident['severity']
                    })

        # Add to the danger points list
        danger_points.extend(route_danger_points)

        routes.append({
            'legs': route['legs'],
            'safety_index': safety_index,
            'danger_points': route_danger_points
        })

    # Deduplicate global danger points
    unique_danger_points = {f"{dp['lat']},{dp['lng']}": dp for dp in danger_points}.values()

    # Log danger points to console
    print("Danger Points:")
    for dp in unique_danger_points:
        print(f"Name: {dp['name']}, Coordinates: ({dp['lat']}, {dp['lng']}), Danger Index: {dp['danger_index']}")

    return jsonify({'routes': routes, 'danger_points': list(unique_danger_points)})


@app.route('/get_locations')
def get_locations():
    locations_data = []
    for area, data in locations.items():
        lat, lng = geocode_location(area)
        if lat and lng:
            locations_data.append({
                "area": area,
                "safety_index": data['safety_index'],
                "lat": lat,
                "lng": lng
            })
        else:
            locations_data.append({
                "area": area,
                "safety_index": data['safety_index'],
                "lat": 0,
                "lng": 0
            })

    return jsonify(locations_data)

@app.route('/')
def index():
    return render_template("index1.html", api_key=gmaps_api_key)

if __name__ == "__main__":
    app.run(debug=True)
