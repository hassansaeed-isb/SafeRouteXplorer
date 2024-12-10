import os
import googlemaps
import math
import re
import csv
from typing import List, Dict, Tuple

class RouteSafetyCalculator:
    def __init__(self, gmaps_client, csv_file_path):
        """
        Initialize the Route Safety Calculator
        
        :param gmaps_client: Google Maps client for route and geocoding operations
        :param csv_file_path: Path to CSV file with incident data
        """
        self.gmaps = gmaps_client
        self.csv_file_path = csv_file_path
        self.incident_locations = self._load_incident_data()
        
        # Hyperparameters for danger score calculation
        self.a = 1.0  # Impact factor for danger index
        self.b = 2.0  # Distance adjustment factor

    def _load_incident_data(self) -> List[Dict]:
        """
        Load incident data from CSV file
        
        :return: List of incident dictionaries
        """
        incidents = []
        
        # Hardcoded locations for ISB and RWP
        additional_incidents = [
            {"name": "Car Accident", "area": "F-8, Islamabad", "severity": 3, "lat": 33.6844, "lng": 73.0479},
            {"name": "Robbery", "area": "G-9, Islamabad", "severity": 2, "lat": 33.6846, "lng": 73.0586},
            {"name": "Pedestrian Hit", "area": "I-10, Islamabad", "severity": 3, "lat": 33.7085, "lng": 73.0770},
            {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": 1, "lat": 33.5968, "lng": 73.0476},
            {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": 2, "lat": 33.6124, "lng": 73.0728},
            {"name": "Mugging", "area": "Rawalpindi Banni", "severity": 2, "lat": 33.5970, "lng": 73.0417},
            {"name": "Accident", "area": "F-10, Islamabad", "severity": 2, "lat": 33.7047, "lng": 73.0456}
        ]
        
        incidents.extend(additional_incidents)
        
        with open(self.csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                extracted_info = row['Extracted_Info']
                
                # Extract area, severity, and name using regex
                area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
                severity_match = re.search(r"Severity: (\w+)", extracted_info)
                name_match = re.search(r"Name: (.+?)(?:,|$)", extracted_info)  # Assuming "Name" is part of extracted_info

                area = area_match.group(1) if area_match else "Unknown"
                severity = severity_match.group(1).lower() if severity_match else "low"
                name = name_match.group(1) if name_match else "Unnamed Incident"

                # Map severity to numerical values
                severity_mapping = {"low": 1, "medium": 2, "high": 3}
                severity_value = severity_mapping.get(severity, 1)

                # Geocode the area to get coordinates
                lat, lng = self._geocode_location(area)
                
                incidents.append({
                    "name": name,
                    "area": area,
                    "severity": severity_value,
                    "lat": lat,
                    "lng": lng
                })
        
        return incidents

    def _geocode_location(self, location_name: str) -> Tuple[float, float]:
        """
        Geocode a location to get its latitude and longitude
        
        :param location_name: Name of the location to geocode
        :return: Tuple of (latitude, longitude)
        """
        try:
            geocode_result = self.gmaps.geocode(location_name)
            if geocode_result:
                lat = geocode_result[0]['geometry']['location']['lat']
                lng = geocode_result[0]['geometry']['location']['lng']
                return lat, lng
        except Exception as e:
            print(f"Geocoding error for {location_name}: {e}")
        
        return 0, 0

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        
        :return: Distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        # Convert degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    def calculate_route_safety(self, route_coordinates: List[Tuple[float, float]]) -> float:
        """
        Calculate safety index for a specific route
        
        :param route_coordinates: List of coordinates along the route
        :return: Safety index for the route (0-100, higher is safer)
        """

        if len(route_coordinates) < 2:
            print("Not enough route coordinates to calculate safety index.")

        total_danger_score = 0
        
        # Calculate danger based on each incident location
        for incident in self.incident_locations:
            incident_lat, incident_lng = incident['lat'], incident['lng']
            danger_index = incident['severity']
            
            # Check minimum distance from route to incident
            min_distance = float('inf')
            for route_point in route_coordinates:
                dist = self._calculate_distance(
                    route_point[0], route_point[1], 
                    incident_lat, incident_lng
                )
                min_distance = min(min_distance, dist)
            
            # Calculate danger contribution using the provided formula
            if min_distance > 0:
                danger_contribution = (danger_index * self.a) / min_distance
                total_danger_score += danger_contribution
            else:
                # Handle the case where the route point is exactly on the incident
                danger_contribution = danger_index * self.a
                total_danger_score += danger_contribution

        # Normalize and invert for safety score (0 to 100)
        total_danger_score = min(total_danger_score, 100)
        safety_index = max(100 - (total_danger_score / len(route_coordinates)), 0)
        return safety_index

    def get_safest_route(self, start_location: str, end_location: str) -> Dict:
        """
        Get the safest route between start and end locations
        
        :param start_location: Starting location for the route
        :param end_location: Ending location for the route
        :return: Dictionary with the safest route and its safety index
        """
        try:
            # Directions API call for the route
            directions = self.gmaps.directions(start_location, end_location, mode="driving")
            
            if not directions:
                return None
            
            # Extract coordinates of the route
            route_coordinates = [(step['end_location']['lat'], step['end_location']['lng'])
                                 for leg in directions[0]['legs'] for step in leg['steps']]
            
            # Calculate the safety index for the route
            safety_index = self.calculate_route_safety(route_coordinates)
            
            return {'route': directions[0], 'safety_index': safety_index}
        
        except Exception as e:
            print(f"Error finding safest route: {e}")
            return None
