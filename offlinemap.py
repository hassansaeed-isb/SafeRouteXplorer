from flask import Flask, jsonify, render_template
import math

app = Flask(__name__)

# Hardcoded incident locations in Pakistan
HARDCODED_INCIDENTS = [
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": 4, "lat": 33.6312, "lng": 73.0657},
    {"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456}
]


def calculate_distance(lat1, lon1, lat2, lon2):
    """ Calculate distance using Haversine formula (in km) """
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@app.route("/get_route_data")
def get_route_data():
    """ Simulate route data for Pakistan without Google Maps API """
    routes = [
        {
            "legs": [{"start_location": {"lat": 33.6844, "lng": 73.0479}, "end_location": {"lat": 33.7294, "lng": 73.0931}}],
            "safety_index": 85.2,
            "danger_points": HARDCODED_INCIDENTS,
            "is_safest": True
        }
    ]
    return jsonify({"routes": routes, "danger_points": HARDCODED_INCIDENTS})


@app.route("/")
def index():
    return render_template("offline_vector_map.html")


if __name__ == "__main__":
    app.run(debug=True)

#test comit for abdu