from flask import Flask, render_template, jsonify
import googlemaps
from datetime import datetime

app = Flask(__name__)

# Initialize Google Maps API client with your API key
gmaps = googlemaps.Client(key="AIzaSyCoT1wmOma1cU-AC-GI2nOh8CT-bms_IkE")

@app.route('/route')
def get_route():
    # Define start and end points for the route
    start_location = "Islamabad"
    end_location = "Rawalpindi"

    # Get directions from Google Maps API
    now = datetime.now()
    directions_result = gmaps.directions(
        origin=start_location,
        destination=end_location,
        mode="driving",
        departure_time=now
    )

    # Return the first route as JSON
    return jsonify(directions_result[0])  # Ensure it's an object containing 'routes' and other necessary fields

@app.route('/')
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
