from flask import Flask, jsonify, render_template
import googlemaps
import math

app = Flask(__name__)

GOOGLE_MAPS_API_KEY = "AIzaSyBheKlOr5vB1LNTyv2MrRsoUDSe7I1LXKA"
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

# Hardcoded locations for ISB and RWP
HARDCODED_INCIDENTS = [
    # {"name": "Car Accident", "area": "F-8, Islamabad", "severity": 3, "lat": 33.6844, "lng": 73.0479},
    # {"name": "Robbery", "area": "G-9, Islamabad", "severity": 2, "lat": 33.6846, "lng": 73.0586},
    # {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": 1, "lat": 33.5968, "lng": 73.0476},
    # {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": 2, "lat": 33.6124, "lng": 73.0728},
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": 4, "lat": 33.6312, "lng": 73.0657},
    {"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456}
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


def calculate_route_safety(route_coordinates):
    """
    Calculate safety index for a specific route

    :param route_coordinates: List of coordinates along the route
    :return: Safety index for the route (0-100, higher is safer)
    """
    total_danger_score = 0

    # Calculate danger based on each incident location
    for incident in HARDCODED_INCIDENTS:
        incident_lat, incident_lng = incident["lat"], incident["lng"]
        danger_index = incident["severity"]

        # Check minimum distance from route to incident
        min_distance = float("inf")
        for route_point in route_coordinates:
            dist = calculate_distance(
                route_point[0], route_point[1], incident_lat, incident_lng
            )
            min_distance = min(min_distance, dist)

        # Calculate danger contribution
        if min_distance > 0:
            danger_contribution = (danger_index / min_distance) * 10
            total_danger_score += danger_contribution

    # Normalize and invert for safety score (0 to 100)
    max_possible_score = 100  # Adjust to normalize better
    normalized_score = min(total_danger_score / len(route_coordinates), max_possible_score)
    safety_index = max(100 - normalized_score, 0)
    safety_index =  100- safety_index 
    return round(safety_index, 2)



@app.route("/get_route_data")
def get_route_data():
    origin = "Rawalpindi"
    destination = "Islamabad"

    try:
        # Fetch directions using Google Maps Directions API
        directions_result = gmaps.directions(origin, destination, mode="driving", alternatives=True)

        if not directions_result:
            return jsonify({"error": "No routes found."})

        routes = []
        danger_points = []

        for route in directions_result:
            # Extract route coordinates
            route_coordinates = [
                (step["end_location"]["lat"], step["end_location"]["lng"])
                for leg in route["legs"]
                for step in leg["steps"]
            ]

            # Calculate safety index for the route
            safety_index = calculate_route_safety(route_coordinates)

            # Get danger points along the route
            route_danger_points = []
            for incident in HARDCODED_INCIDENTS:
                for route_point in route_coordinates:
                    distance = calculate_distance(
                        route_point[0], route_point[1], incident["lat"], incident["lng"]
                    )
                    if distance < 2:  # Only consider incidents within 2 km of the route
                        route_danger_points.append(
                            {
                                "lat": incident["lat"],
                                "lng": incident["lng"],
                                "name": incident.get("name", "Unknown Location"),
                                "danger_index": incident["severity"],
                            }
                        )

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
        return jsonify({"error": str(e)})


@app.route("/")
def index():
    return render_template("index1.html", api_key=GOOGLE_MAPS_API_KEY)


if __name__ == "__main__":
    app.run(debug=True)