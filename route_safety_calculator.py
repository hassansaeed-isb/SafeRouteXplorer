import os
import googlemaps
import math
import re
import csv
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@dataclass
class Incident:
    """Data class for incident information"""
    name: str
    area: str
    severity: int
    lat: float
    lng: float

class RouteSafetyCalculator:
    """Calculator for determining the safety of routes based on incident data"""

    SEVERITY_MAPPING = {
        "low": 1,
        "medium": 2,
        "high": 3
    }
    EARTH_RADIUS_KM = 6371  # Earth's radius in kilometers
    MAX_CACHE_SIZE = 1000   # Maximum size for LRU cache

    def __init__(self, gmaps_client: googlemaps.Client, csv_file_path: str):
        """
        Initialize the Route Safety Calculator
        
        Args:
            gmaps_client: Google Maps client for route and geocoding operations
            csv_file_path: Path to CSV file with incident data
        
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If CSV file is invalid or empty
        """
        self.gmaps = gmaps_client
        self.csv_file_path = csv_file_path
        
        # Hyperparameters for danger score calculation
        self.impact_factor = 1.0    # Impact factor for danger index
        self.distance_factor = 2.0  # Distance adjustment factor
        
        # Validate CSV file exists
        if not os.path.exists(csv_file_path):
            raise FileNotFoundError(f"CSV file not found: {csv_file_path}")
            
        self.incident_locations = self._load_incident_data()
        # logger.info(f"Loaded {len(self.incident_locations)} incidents from data")

    def _load_incident_data(self) -> List[Incident]:
        """
        Load and parse incident data from CSV file and hardcoded locations
        
        Returns:
            List[Incident]: List of incident objects
        
        Raises:
            ValueError: If CSV data is invalid
        """
        incidents = []
        
        # Add hardcoded known incidents
        hardcoded_incidents = [
            Incident("Car Accident", "F-8, Islamabad", 3, 33.6844, 73.0479),
            Incident("Robbery", "G-9, Islamabad", 2, 33.6846, 73.0586),
            Incident("Pedestrian Hit", "I-10, Islamabad", 3, 33.7085, 73.0770),
            Incident("Traffic Jam", "Rawalpindi Saddar", 1, 33.5968, 73.0476),
            Incident("Street Fight", "Rawalpindi Committee Chowk", 2, 33.6124, 73.0728),
            Incident("Mugging", "Rawalpindi Banni", 2, 33.5970, 73.0417),
            Incident("Accident", "F-10, Islamabad", 2, 33.7047, 73.0456)
        ]
        incidents.extend(hardcoded_incidents)
        
        try:
            with open(self.csv_file_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    incident = self._parse_incident_row(row)
                    if incident:
                        incidents.append(incident)
                        
        except csv.Error as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            raise ValueError(f"Invalid CSV data: {str(e)}")
            
        if not incidents:
            raise ValueError("No valid incidents found in data")
            
        return incidents

    def _parse_incident_row(self, row: Dict) -> Optional[Incident]:
        """
        Parse a single incident row from CSV data
        
        Args:
            row: Dictionary containing row data
            
        Returns:
            Optional[Incident]: Parsed incident or None if invalid
        """
        try:
            extracted_info = row['Extracted_Info']
            
            # Extract information using regex
            area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
            severity_match = re.search(r"Severity: (\w+)", extracted_info)
            name_match = re.search(r"Name: (.+?)(?:,|$)", extracted_info)

            if not area_match:
                # logger.warning(f"Could not extract area from: {extracted_info}")
                return None

            area = area_match.group(1)
            severity = severity_match.group(1).lower() if severity_match else "low"
            name = name_match.group(1) if name_match else "Unnamed Incident"

            severity_value = self.SEVERITY_MAPPING.get(severity, 1)
            lat, lng = self._geocode_location(area)
            
            if lat == 0 and lng == 0:
                # logger.warning(f"Could not geocode location: {area}")
                return None

            return Incident(name, area, severity_value, lat, lng)
            
        except Exception as e:
            logger.error(f"Error parsing incident row: {str(e)}")
            return None

    @lru_cache(maxsize=MAX_CACHE_SIZE)
    def _geocode_location(self, location_name: str) -> Tuple[float, float]:
        """
        Geocode a location name to coordinates with caching
        
        Args:
            location_name: Name of location to geocode
            
        Returns:
            Tuple[float, float]: Latitude and longitude coordinates
        """
        try:
            geocode_result = self.gmaps.geocode(location_name)
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                return location['lat'], location['lng']
                
        except Exception as e:
            logger.error(f"Geocoding error for {location_name}: {str(e)}")
            
        return 0, 0

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        
        Args:
            lat1, lon1: Coordinates of first point
            lat2, lon2: Coordinates of second point
            
        Returns:
            float: Distance in kilometers
        """
        try:
            # Convert coordinates to radians
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula components
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = (math.sin(dlat/2)**2 + 
                 math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            return self.EARTH_RADIUS_KM * c
            
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return float('inf')

    def calculate_route_safety(self, route_coordinates: List[Tuple[float, float]]) -> float:
        """
        Calculate safety index for a route
        
        Args:
            route_coordinates: List of route coordinate tuples
            
        Returns:
            float: Safety index (0-100, higher is safer)
            
        Raises:
            ValueError: If route coordinates are invalid
        """
        if not route_coordinates or len(route_coordinates) < 2:
            raise ValueError("Invalid route coordinates provided")

        try:
            total_danger_score = 0
            
            # Calculate danger score for each incident
            for incident in self.incident_locations:
                # Find minimum distance from route to incident
                min_distance = min(
                    self._calculate_distance(
                        point[0], point[1],
                        incident.lat, incident.lng
                    )
                    for point in route_coordinates
                )
                
                # Calculate danger contribution
                if min_distance > 0:
                    danger = (incident.severity * self.impact_factor) / (min_distance * self.distance_factor)
                else:
                    danger = incident.severity * self.impact_factor
                    
                total_danger_score += danger

            # Normalize to 0-100 scale
            route_length = len(route_coordinates)
            normalized_danger = min(total_danger_score / route_length, 100)
            safety_index = max(100 - normalized_danger, 0)
            
            return round(safety_index, 2)
            
        except Exception as e:
            logger.error(f"Error calculating route safety: {str(e)}")
            return 0

    def get_safest_route(self, start_location: str, end_location: str) -> Optional[Dict]:
        """
        Find the safest route between two locations
        
        Args:
            start_location: Starting point
            end_location: Destination point
            
        Returns:
            Optional[Dict]: Route information and safety index
        """
        try:
            # Get directions from Google Maps
            directions = self.gmaps.directions(
                start_location, 
                end_location,
                mode="driving",
                alternatives=True
            )
            
            if not directions:
                # logger.warning(f"No routes found between {start_location} and {end_location}")
                return None
            
            # Calculate safety for each route
            routes_with_safety = []
            for route in directions:
                coordinates = [
                    (step['end_location']['lat'], step['end_location']['lng'])
                    for leg in route['legs']
                    for step in leg['steps']
                ]
                
                safety_index = self.calculate_route_safety(coordinates)
                routes_with_safety.append({
                    'route': route,
                    'safety_index': safety_index
                })
            
            # Return the safest route
            return max(routes_with_safety, key=lambda x: x['safety_index'])
            
        except Exception as e:
            logger.error(f"Error finding safest route: {str(e)}")
            return None
