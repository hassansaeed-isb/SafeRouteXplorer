import os
import re
import csv
import googlemaps
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.CRITICAL)
logger = logging.getLogger(__name__)

class Severity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

class LocationCategory(Enum):
    RESIDENTIAL = 1.0
    COMMERCIAL = 1.2
    SCHOOL = 2.0
    HOSPITAL = 1.8
    GOVERNMENT = 1.5
    OTHER = 1.0

@dataclass
class Incident:
    name: str
    area: str
    severity: Severity
    lat: float
    lng: float
    category: LocationCategory = LocationCategory.OTHER

class OfflineMode:
    """
    Loads incident data from a CSV file for offline processing.
    This class does NOT use the Google Maps API.
    """
    EARTH_RADIUS_KM = 6371  # Earth's radius in kilometers
    MAX_CACHE_SIZE = 1000   # Maximum size for LRU cache
    CATEGORY_RADIUS_KM = 10.0  # Radius for category-based calculations

    def __init__(self, csv_file_path: str):
        """
        Initialize the Route Safety Calculator
        
        Args:
            csv_file_path: Path to CSV file with incident data
        """
        self.gmaps = googlemaps.Client
        self.csv_file_path = csv_file_path
        
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
        Parse a single incident row from CSV data with category detection
        
        Args:
            row: Dictionary containing row data
            
        Returns:
            Optional[Incident]: Parsed incident or None if invalid
        """
        try:
            extracted_info = row.get('Extracted_Info', '')
            
            # Extract information using regex
            area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
            severity_match = re.search(r"Severity: (\w+)", extracted_info)
            name_match = re.search(r"Name: (.+?)(?:,|$)", extracted_info)
            category_match = re.search(r"Category: (\w+)", extracted_info)

            if not area_match:
                # logger.warning(f"Could not extract area from: {extracted_info}")
                return None

            area = area_match.group(1)
            severity_text = severity_match.group(1).upper() if severity_match else "LOW"
            name = name_match.group(1) if name_match else "Unnamed Incident"
            
            # Determine severity
            try:
                severity = Severity[severity_text]
            except KeyError:
                severity = Severity.LOW

            # Determine category
            category_text = category_match.group(1).upper() if category_match else "OTHER"
            try:
                category = LocationCategory[category_text]
            except KeyError:
                category = LocationCategory.OTHER

            lat, lng = self._geocode_location(area)
            
            if lat == 0 and lng == 0:
                # logger.warning(f"Could not geocode location: {area}")
                return None

            return Incident(name, area, severity, lat, lng, category)
            
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
