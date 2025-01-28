import os
import csv
import re
import logging
from typing import Dict, List, Set, Tuple, Optional
import googlemaps
from flask import Flask, jsonify, render_template, current_app
from dotenv import load_dotenv
from dataclasses import dataclass
from route_safety_calculator import RouteSafetyCalculator

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Incident:
    area: str
    severity: int
    lat: float = 0.0
    lng: float = 0.0

class SafetyAnalyzer:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.severity_mapping = {"low": 1, "medium": 2, "high": 3}
        self.locations: Dict[str, Dict[str, float]] = {}
        self.a_factor = 1.0  # Factor for danger index calculation
        self.b_factor = 2.0  # Factor for distance adjustment

    def parse_csv(self) -> Tuple[List[Incident], Set[str]]:
        """Parse CSV file and extract incident information."""
        extracted_data = []
        areas = set()

        try:
            with open(self.csv_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    incident = self._parse_incident(row['Extracted_Info'])
                    if incident:
                        extracted_data.append(incident)
                        areas.add(incident.area)
        except FileNotFoundError:
            logger.error(f"CSV file not found: {self.csv_path}")
            raise
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise

        return extracted_data, areas

    def _parse_incident(self, extracted_info: str) -> Optional[Incident]:
        """Parse incident information from extracted info string."""
        area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
        severity_match = re.search(r"Severity: (\w+)", extracted_info)

        if not area_match:
            return None

        area = area_match.group(1)
        severity = severity_match.group(1).lower() if severity_match else "low"
        severity_value = self.severity_mapping.get(severity, 1)

        return Incident(area=area, severity=severity_value)

    def initialize_locations(self, areas: Set[str]) -> None:
        """Initialize location dictionary with safety metrics."""
        self.locations = {
            area: {'danger_index': 0, 'safety_index': 0}
            for area in areas
        }

    def update_danger_index(self, incident: Incident) -> None:
        """Update danger index for locations based on incident."""
        if incident.area not in self.locations:
            self.locations[incident.area] = {'danger_index': 0, 'safety_index': 0}

        for loc in self.locations:
            if loc == incident.area:
                new_danger = incident.severity * self.a_factor
            else:
                distance = 1  # TODO: Implement actual distance calculation
                new_danger = (incident.severity * self.a_factor) / (distance * self.b_factor)
            self.locations[loc]['danger_index'] += new_danger

    def normalize_safety_indexes(self, max_danger_score: float) -> None:
        """Normalize and invert safety indexes to 0-100% scale."""
        if max_danger_score == 0:
            return

        for loc in self.locations:
            normalized_danger = (self.locations[loc]['danger_index'] / max_danger_score) * 100
            self.locations[loc]['safety_index'] = 100 - min(normalized_danger, 100)

class SafeRouteApp:
    def __init__(self):
        load_dotenv()
        self.app = Flask(__name__)
        self.setup_app()

    def setup_app(self):
        """Initialize Flask application and configurations."""
        self.gmaps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.gmaps_api_key:
            raise ValueError("Google Maps API key not found in environment variables")

        self.gmaps = googlemaps.Client(key=self.gmaps_api_key)
        self.safety_calculator = RouteSafetyCalculator(
            self.gmaps, 
            "1improved_processed_road_safety_tweets.csv"
        )
        self.setup_routes()

    def setup_routes(self):
        """Set up Flask route handlers."""
        self.app.route('/get_route_data')(self.get_route_data)
        self.app.route('/get_locations')(self.get_locations)
        self.app.route('/')(self.index)

    def geocode_location(self, location_name: str) -> Tuple[Optional[float], Optional[float]]:
        """Geocode location name to coordinates."""
        try:
            geocode_result = self.gmaps.geocode(location_name)
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                return location['lat'], location['lng']
        except Exception as e:
            logger.error(f"Geocoding error for {location_name}: {str(e)}")
        return None, None

    def get_route_data(self):
        """Handle route data request."""
        try:
            origin = "Rawalpindi"
            destination = "Islamabad"
            logger.info(f"Fetching directions from {origin} to {destination}")

            # Fetch directions from Google Maps API
            directions_result = self.gmaps.directions(
                origin, 
                destination, 
                mode="driving", 
                alternatives=True
            )
            logger.debug(f"Directions result: {directions_result}")

            if not directions_result:
                logger.warning("No routes found")
                return jsonify({'error': 'No routes found'}), 404

            routes = []
            danger_points = []

            for route in directions_result:
                logger.debug(f"Processing route: {route}")
                route_data = self._process_route(route)
                routes.append(route_data)
                danger_points.extend(route_data['danger_points'])

            # logger.info("Route data fetched successfully")
            return jsonify({
                'routes': routes,
                'danger_points': danger_points
            })

        except Exception as e:
            logger.error(f"Error processing route data: {str(e)}", exc_info=True)
            return jsonify({'error': 'Internal server error'}), 500

    def _process_route(self, route):
        """Process individual route data."""
        route_coordinates = [
            (step['end_location']['lat'], step['end_location']['lng'])
            for leg in route['legs']
            for step in leg['steps']
        ]

        safety_index = self.safety_calculator.calculate_route_safety(route_coordinates) or 0
        route_danger_points = self._get_route_danger_points(route_coordinates)

        return {
            'legs': route['legs'],
            'safety_index': safety_index,
            'danger_points': route_danger_points
        }

    def _get_route_danger_points(self, route_coordinates):
        """Get danger points along a route."""
        route_danger_points = []
        for incident in self.safety_calculator.incident_locations:
            for route_point in route_coordinates:
                distance = self.safety_calculator._calculate_distance(
                    route_point[0], route_point[1],
                    incident['lat'], incident['lng']
                )
                if distance < 2:  # Within 2 km of route
                    route_danger_points.append({
                        'lat': incident['lat'],
                        'lng': incident['lng'],
                        'name': incident.get('name', 'Unknown Location'),
                        'danger_index': incident['severity']
                    })
        return route_danger_points

    def get_locations(self):
        """Handle locations data request."""
        analyzer = SafetyAnalyzer("1improved_processed_road_safety_tweets.csv")
        incidents, areas = analyzer.parse_csv()
        analyzer.initialize_locations(areas)

        locations_data = []
        for area, data in analyzer.locations.items():
            lat, lng = self.geocode_location(area)
            locations_data.append({
                "area": area,
                "safety_index": data['safety_index'],
                "lat": lat or 0,
                "lng": lng or 0
            })

        return jsonify(locations_data)

    def index(self):
        """Handle index page request."""
        return render_template("index1.html", api_key=self.gmaps_api_key)

if __name__ == "__main__":
    safe_route_app = SafeRouteApp()
    safe_route_app.app.run(debug=True)