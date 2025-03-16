import os
import googlemaps
import math
import re
# import csv
import logging
from enum import Enum
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.CRITICAL)
logger = logging.getLogger(__name__)

class Severity(Enum):
    """Enum for incident severity levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3

class LocationCategory(Enum):
    """Enum for location categories with safety multipliers"""
    RESIDENTIAL = 1.0
    COMMERCIAL = 1.2
    SCHOOL = 2.0
    HOSPITAL = 1.8
    GOVERNMENT = 1.5
    OTHER = 1.0

@dataclass
class Incident:
    """Data class for incident information"""
    name: str
    area: str
    severity: Severity
    lat: float
    lng: float
    category: LocationCategory = LocationCategory.OTHER

class RouteSafetyCalculator:
    """Calculator for determining the safety of routes based on incident"""

    EARTH_RADIUS_KM = 6371  # Earth's radius in kilometers
    MAX_CACHE_SIZE = 1000   # Maximum size for LRU cache
    CATEGORY_RADIUS_KM = 10.0  # Radius for category-based calculations

    def __init__(self, gmaps_client: googlemaps.Client, csv_file_path: str = None):
        """
        Initialize the Route Safety Calculator
        
        Args:
            gmaps_client: Google Maps client for route and geocoding operations
            csv_file_path: Path to CSV file with incident data
        """
        self.gmaps = gmaps_client
        self.csv_file_path = csv_file_path
        
        # Hyperparameters for danger score calculation
        self.impact_factor = 0.5    # Impact factor for danger index
        self.distance_factor = 1.0  # Distance adjustment factor
        
        # Validate CSV file exists
        # if not os.path.exists(csv_file_path):
        #     raise FileNotFoundError(f"CSV file not found: {csv_file_path}")
            
        self.incident_locations = self._load_incident_data()
        # logger.info(f"Loaded {len(self.incident_locations)} incidents from data")

    def _load_incident_data(self) -> List[Incident]:
        """
        Load and parse incident data from CSV file and hardcoded locations
        
        Returns:
            List[Incident]: List of incident objects
        """
        incidents = []
        
        # Add hardcoded known incidents with categories
        hardcoded_incidents = [
            Incident("Car Accident", "F-8, Islamabad", Severity.HIGH, 33.6844, 73.0479, LocationCategory.COMMERCIAL),
            Incident("Robbery", "G-9, Islamabad", Severity.MEDIUM, 33.6846, 73.0586, LocationCategory.RESIDENTIAL),
            Incident("Pedestrian Hit", "I-10, Islamabad", Severity.HIGH, 33.7085, 73.0770, LocationCategory.SCHOOL),
            Incident("Traffic Jam", "Rawalpindi Saddar", Severity.LOW, 33.5968, 73.0476, LocationCategory.GOVERNMENT),
            Incident("Street Fight", "Rawalpindi Committee Chowk", Severity.MEDIUM, 33.6124, 73.0728, LocationCategory.COMMERCIAL),
            Incident("Mugging", "Rawalpindi Banni", Severity.MEDIUM, 33.5970, 73.0417, LocationCategory.RESIDENTIAL),
            Incident("Accident", "F-10, Islamabad", Severity.MEDIUM, 33.7047, 73.0456, LocationCategory.HOSPITAL)
        ]
        incidents.extend(hardcoded_incidents)
        
        # CSV parsing code - commented out
        # try:
        #     with open(self.csv_file_path, mode='r', encoding='utf-8') as file:
        #         reader = csv.DictReader(file)
        #         for row in reader:
        #             incident = self._parse_incident_row(row)
        #             if incident:
        #                 incidents.append(incident)
        #                 
        # except csv.Error as e:
        #     logger.error(f"Error reading CSV file: {str(e)}")
        #     raise ValueError(f"Invalid CSV data: {str(e)}")
            
        if not incidents:
            raise ValueError("No valid incidents found in data")
            
        return incidents

    # CSV-related method - commented out
    # def _parse_incident_row(self, row: Dict) -> Optional[Incident]:
    #     """
    #     Parse a single incident row from CSV data with category detection
    #     
    #     Args:
    #         row: Dictionary containing row data
    #         
    #     Returns:
    #         Optional[Incident]: Parsed incident or None if invalid
    #     """
    #     try:
    #         extracted_info = row.get('Extracted_Info', '')
    #         
    #         # Extract information using regex
    #         area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
    #         severity_match = re.search(r"Severity: (\w+)", extracted_info)
    #         name_match = re.search(r"Name: (.+?)(?:,|$)", extracted_info)
    #         category_match = re.search(r"Category: (\w+)", extracted_info)
    #
    #         if not area_match:
    #             # logger.warning(f"Could not extract area from: {extracted_info}")
    #             return None
    #
    #         area = area_match.group(1)
    #         severity_text = severity_match.group(1).upper() if severity_match else "LOW"
    #         name = name_match.group(1) if name_match else "Unnamed Incident"
    #         
    #         # Determine severity
    #         try:
    #             severity = Severity[severity_text]
    #         except KeyError:
    #             severity = Severity.LOW
    #
    #         # Determine category
    #         category_text = category_match.group(1).upper() if category_match else "OTHER"
    #         try:
    #             category = LocationCategory[category_text]
    #         except KeyError:
    #             category = LocationCategory.OTHER
    #
    #         lat, lng = self._geocode_location(area)
    #         
    #         if lat == 0 and lng == 0:
    #             # logger.warning(f"Could not geocode location: {area}")
    #             return None
    #
    #         return Incident(name, area, severity, lat, lng, category)
    #         
    #     except Exception as e:
    #         logger.error(f"Error parsing incident row: {str(e)}")
    #         return None

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

    def compute_category_multiplier(self, base_incident: Incident, target_incident: Incident, distance: float) -> float:
        """
        Compute category-based danger multiplier
        
        Args:
            base_incident: Incident causing danger
            target_incident: Location being evaluated
            distance: Distance between incidents
        
        Returns:
            float: Category-based multiplier
        """
        if distance > self.CATEGORY_RADIUS_KM:
            return 1.0
        
        # Higher weight for sensitive categories
        category_factor = target_incident.category.value
        
        # Distance-based scaling within category radius
        distance_scale = 1 - (distance / self.CATEGORY_RADIUS_KM)
        return 1.0 + (category_factor - 1.0) * distance_scale

    def calculate_route_safety(self, route_coordinates: List[Tuple[float, float]]) -> Dict:
        """
        Calculate safety index for a route with category-aware calculations
        """
        if not route_coordinates or len(route_coordinates) < 2:
            raise ValueError("Invalid route coordinates provided")

        try:
            total_danger_score = 0
            nearby_incidents = []
            
            # Calculate danger score for each incident
            for base_incident in self.incident_locations:
                # Find minimum distance from route to incident
                min_distance = min(
                    self._calculate_distance(
                        point[0], point[1],
                        base_incident.lat, base_incident.lng
                    )
                    for point in route_coordinates
                )
                
                # Adjust minimum distance to prevent division by very small numbers
                min_distance = max(min_distance, 0.1)  # Minimum distance of 100m
                
                # Calculate base danger with softer falloff
                base_danger = (base_incident.severity.value * self.impact_factor) / \
                            (1 + min_distance * self.distance_factor)
                
                # Apply category multiplier only once per incident
                category_multiplier = self.compute_category_multiplier(
                    base_incident,
                    Incident("Route Point", "Route", Severity.LOW, 
                            route_coordinates[0][0], route_coordinates[0][1]),
                    min_distance
                )
                
                # Add to total danger score
                danger = base_danger * category_multiplier
                total_danger_score += danger
                
                # Track nearby incidents for reporting
                if min_distance < 2.0:  # Within 2km
                    nearby_incidents.append({
                        'name': base_incident.name,
                        'distance': round(min_distance, 2),
                        'severity': base_incident.severity.name,
                        'category': base_incident.category.name
                    })

            # Normalize using a logarithmic scale to prevent extremes
            # Add 1 to avoid log(0)
            normalized_danger = min(math.log(1 + total_danger_score) * 20, 100)
            safety_index = max(100 - normalized_danger, 0)
            
            return {
                'safety_index': round(safety_index, 2),
                'nearby_incidents': nearby_incidents,
                'danger_score': round(total_danger_score, 2)  # Added for debugging
            }
            
        except Exception as e:
            logger.error(f"Error calculating route safety: {str(e)}")
            return {
                'safety_index': 50,  # Default to neutral instead of 0
                'nearby_incidents': [],
                'danger_score': 0
            }
    
    def get_routes_with_safety(self, start_location: str, end_location: str) -> List[Dict]:
        """
        Find routes between two locations with safety analysis
        
        Args:
            start_location: Starting point
            end_location: Destination point
            
        Returns:
            List of routes with safety details
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
                return []
            
            # Calculate safety for each route
            routes_with_safety = []
            for route in directions:
                coordinates = [
                    (step['end_location']['lat'], step['end_location']['lng'])
                    for leg in route['legs']
                    for step in leg['steps']
                ]
                
                safety_details = self.calculate_route_safety(coordinates)
                
                routes_with_safety.append({
                    'route': route,
                    'safety_index': safety_details['safety_index'],
                    'nearby_incidents': safety_details['nearby_incidents']
                })
            
            # Sort routes by safety index (descending)
            routes_with_safety.sort(key=lambda x: x['safety_index'], reverse=True)
            
            return routes_with_safety
            
        except Exception as e:
            logger.error(f"Error finding routes: {str(e)}")
            return []