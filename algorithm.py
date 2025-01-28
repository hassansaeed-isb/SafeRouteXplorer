import math
import csv
import re
from typing import Dict, List, TypedDict
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

@dataclass
class LocationStats:
    danger_index: float = 0.0
    safety_index: float = 100.0

class SafetyCalculator:
    def __init__(self, impact_factor: float = 1.0, distance_decay: float = 2.0):
        self.impact_factor = impact_factor
        self.distance_decay = distance_decay
        self.locations: Dict[str, LocationStats] = {}

    def initialize_locations(self, location_list: List[str]) -> None:
        """Initialize locations with default safety stats."""
        self.locations = {loc: LocationStats() for loc in location_list}

    def compute_danger_index(self, severity: Severity) -> float:
        """Compute danger index based on severity."""
        return severity.value

    def update_danger_index(self, area: str, danger_index: float) -> None:
        """Update danger indices for all locations based on new incident."""
        if area not in self.locations:
            return

        for loc in self.locations:
            if loc == area:
                # Direct impact for incident location
                new_danger = danger_index * self.impact_factor
            else:
                # TODO: Implement actual distance calculation
                distance = 1.0  # Placeholder for geometric distance
                new_danger = (danger_index * self.impact_factor) / (distance * self.distance_decay)
            
            current_stats = self.locations[loc]
            current_stats.danger_index += new_danger

    def parse_csv(self, file_path: str, target_areas: List[str]) -> List[Dict]:
        """Parse CSV file and extract relevant safety data."""
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

    def normalize_safety_indexes(self, max_danger_score: float) -> None:
        """Normalize and invert danger indexes to safety indexes (0-100%)."""
        if max_danger_score <= 0:
            print("Warning: Invalid maximum danger score. Skipping normalization.")
            return

        for loc, stats in self.locations.items():
            normalized_danger = (stats.danger_index / max_danger_score) * 100
            stats.safety_index = 100 - min(normalized_danger, 100)

    def calculate_safety_indices(self, csv_path: str, target_areas: List[str]) -> Dict[str, float]:
        """Main method to calculate safety indices for target areas."""
        self.initialize_locations(target_areas)
        extracted_data = self.parse_csv(csv_path, target_areas)

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

def main():
    # Example usage
    target_areas = ['Firdos Chowk', 'Lower Kurram']
    calculator = SafetyCalculator(impact_factor=1.0, distance_decay=2.0)
    
    safety_indices = calculator.calculate_safety_indices(
        '1improved_processed_road_safety_tweets.csv',
        target_areas
    )
    
    # print("\nSafety Indices for Target Areas:")
    # for area, safety_index in safety_indices.items():
    #     print(f"{area}: {safety_index:.2f}%")

if __name__ == "__main__":
    main()