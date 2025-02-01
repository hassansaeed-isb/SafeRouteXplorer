import math
import csv
import re
from typing import Dict, List, TypedDict, Optional
from dataclasses import dataclass
from enum import Enum

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
class LocationStats:
    danger_index: float = 0.0
    safety_index: float = 100.0
    category: LocationCategory = LocationCategory.OTHER
    latitude: float = 0.0
    longitude: float = 0.0

class SafetyCalculator:
    def __init__(self, impact_factor: float = 1.0, distance_decay: float = 2.0, category_radius: float = 10.0):
        self.impact_factor = impact_factor
        self.distance_decay = distance_decay
        self.category_radius = category_radius  # radius in kilometers
        self.locations: Dict[str, LocationStats] = {}

    def initialize_locations(self, location_data: List[Dict]) -> None:
        """Initialize locations with category and coordinate information."""
        self.locations = {}
        for loc in location_data:
            self.locations[loc['name']] = LocationStats(
                category=loc.get('category', LocationCategory.OTHER),
                latitude=loc.get('latitude', 0.0),
                longitude=loc.get('longitude', 0.0)
            )

    def compute_danger_index(self, severity: Severity) -> float:
        """Compute danger index based on severity."""
        return severity.value

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula."""
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = math.sin(delta_lat/2) * math.sin(delta_lat/2) + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * \
            math.sin(delta_lon/2) * math.sin(delta_lon/2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c

        return distance

    def compute_category_multiplier(self, base_location: LocationStats, target_location: LocationStats, distance: float) -> float:
        """Compute category-based danger multiplier."""
        if distance > self.category_radius:
            return 1.0
        
        # Higher weight for sensitive categories (schools, hospitals)
        category_factor = target_location.category.value
        
        # Distance-based scaling within category radius
        distance_scale = 1 - (distance / self.category_radius)
        return 1.0 + (category_factor - 1.0) * distance_scale

    def update_danger_index(self, area: str, danger_index: float) -> None:
        """Update danger indices for all locations based on new incident and categories."""
        if area not in self.locations:
            return

        incident_location = self.locations[area]

        for loc_name, target_location in self.locations.items():
            if loc_name == area:
                # Direct impact for incident location
                new_danger = danger_index * self.impact_factor * target_location.category.value
            else:
                # Calculate actual distance between locations
                distance = self.calculate_distance(
                    incident_location.latitude,
                    incident_location.longitude,
                    target_location.latitude,
                    target_location.longitude
                )
                
                # Calculate category multiplier
                category_multiplier = self.compute_category_multiplier(
                    incident_location,
                    target_location,
                    distance
                )
                
                # Calculate final danger value
                new_danger = (danger_index * self.impact_factor * category_multiplier) / \
                            (distance * self.distance_decay)
            
            target_location.danger_index += new_danger

    def normalize_safety_indexes(self, max_danger_score: float) -> None:
        """Normalize and invert danger indexes to safety indexes (0-100%)."""
        if max_danger_score <= 0:
            print("Warning: Invalid maximum danger score. Skipping normalization.")
            return

        for loc, stats in self.locations.items():
            normalized_danger = (stats.danger_index / max_danger_score) * 100
            stats.safety_index = 100 - min(normalized_danger, 100)

    def calculate_safety_indices(self, csv_path: str, target_areas: List[Dict]) -> Dict[str, float]:
        """Main method to calculate safety indices for target areas."""
        self.initialize_locations(target_areas)
        extracted_data = self.parse_csv(csv_path, [loc['name'] for loc in target_areas])

        if not extracted_data:
            print("No relevant data found in CSV for specified target areas.")
            return {loc: stats.safety_index for loc, stats in self.locations.items()}

        max_danger_score = Severity.HIGH.value * len(extracted_data)

        for entry in extracted_data:
            area = entry["Area"]
            danger_index = self.compute_danger_index(entry["Severity"])
            self.update_danger_index(area, danger_index)

        self.normalize_safety_indexes(max_danger_score)
        return {loc: stats.safety_index for loc, stats in self.locations.items()}

    def parse_csv(self, file_path: str, target_areas: List[str]) -> List[Dict]:
        """Parse CSV file and extract relevant safety data."""
        # Existing parse_csv implementation remains the same
        extracted_data = []
        
        try:
            with open(file_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    extracted_info = row.get('Extracted_Info', '')
                    
                    area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
                    severity_match = re.search(r"Severity: (\w+)", extracted_info)

                    if not area_match:
                        continue

                    area = area_match.group(1).strip()
                    if area not in target_areas:
                        continue

                    severity_text = severity_match.group(1).upper() if severity_match else "LOW"
                    try:
                        severity = Severity[severity_text]
                    except KeyError:
                        severity = Severity.LOW

                    extracted_data.append({
                        "Area": area,
                        "Severity": severity
                    })
                    
        except FileNotFoundError:
            print(f"Error: File '{file_path}' not found.")
        except Exception as e:
            print(f"Error processing CSV file: {str(e)}")
            
        return extracted_data

def main():
    # Example usage with categories
    target_areas = [
        {
            'name': 'Firdos Chowk',
            'category': LocationCategory.COMMERCIAL,
            'latitude': 34.0151,
            'longitude': 71.5249
        },
        {
            'name': 'City School',
            'category': LocationCategory.SCHOOL,
            'latitude': 34.0200,
            'longitude': 71.5300
        },
        {
            'name': 'Central Hospital',
            'category': LocationCategory.HOSPITAL,
            'latitude': 34.0180,
            'longitude': 71.5270
        }
    ]
    
    calculator = SafetyCalculator(
        impact_factor=1.0,
        distance_decay=2.0,
        category_radius=10.0  # 10km radius for category effects
    )
    
    safety_indices = calculator.calculate_safety_indices(
        '1improved_processed_road_safety_tweets.csv',
        target_areas
    )
    
    print("\nSafety Indices for Target Areas:")
    for area, safety_index in safety_indices.items():
        print(f"{area}: {safety_index:.2f}%")

if __name__ == "__main__":
    main()