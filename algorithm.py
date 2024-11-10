import math
import csv
import re
# Initialize locations with safety index set to 0
def initialize_locations(location_list):
    locations = {}
    for loc in location_list:
        locations[loc] = {'danger_index': 0}  # Initially store as danger index
    return locations

# Compute danger index based on the CSV entry (direct severity extraction)
def compute_danger_index(extracted_info):
    severity = extracted_info.get('Severity', 1)  # Default to 1 if severity is missing
    return severity

# Update danger index based on extracted information from CSV
def update_danger_index(area, danger_index, a, b, locations):
    for loc in locations:
        if loc == area:
            # Direct danger impact for the crime location
            new_danger = danger_index * a
        else:
            # Apply distance-based impact for other areas (using a dummy distance)
            distance = 1  # Replace with actual distance if coordinates are available
            new_danger = (danger_index * a) / (distance * b) if distance > 0 else 0
        
        locations[loc]['danger_index'] += new_danger

# Parse CSV and extract relevant data for specific locations
def parse_csv(file_path, target_areas):
    extracted_data = []
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            extracted_info = row['Extracted_Info']
            
            # Use regex to extract 'Area' and 'Severity'
            area_match = re.search(r"Area: (.+?)(?:,|$)", extracted_info)
            severity_match = re.search(r"Severity: (\w+)", extracted_info)

            area = area_match.group(1) if area_match else "Unknown"
            severity = severity_match.group(1).lower() if severity_match else "low"

            # Map severity levels to numerical values
            severity_mapping = {"low": 1, "medium": 2, "high": 3}
            severity_value = severity_mapping.get(severity, 1)

            # Only keep data for the target areas
            if area in target_areas:
                extracted_data.append({
                    "Area": area,
                    "Severity": severity_value
                })

    return extracted_data

# Normalize and invert safety indexes to a 0-100% scale (where 100% is safest)
def normalize_and_invert_safety_indexes(locations, max_danger_score):
    if max_danger_score == 0:
        print("No data found to calculate maximum danger score. Skipping normalization.")
        return
    for loc in locations:
        # Calculate the normalized danger index
        normalized_danger_index = (locations[loc]['danger_index'] / max_danger_score) * 100
        # Invert it to get a safety index (higher means safer)
        locations[loc]['safety_index'] = 100 - min(normalized_danger_index, 100)

# Example usage
if __name__ == "__main__":
    # Define the specific areas we're interested in
    target_areas = ['Firdos Chowk', 'Lower Kurram']
    
    # Parse the CSV to get extracted information specifically for target areas
    csv_file_path = '1improved_processed_road_safety_tweets.csv'  # Update to your CSV path
    extracted_info_list = parse_csv(csv_file_path, target_areas)

    # Initialize locations for the specific areas
    locations = initialize_locations(target_areas)

    # Check if extracted_info_list has data to process
    if not extracted_info_list:
        print("No relevant data found in the CSV for specified target areas.")
    else:
        # Update danger indexes based on each crime report in the CSV
        a = 1.0
        b = 2.0
        max_danger_score = 3 * len(extracted_info_list)  # Assume maximum danger index (severity 3) for each entry

        for info in extracted_info_list:
            area = info.get('Area')
            danger_index = compute_danger_index(info)
            update_danger_index(area, danger_index, a, b, locations)

        # Normalize and invert danger indexes to get safety indexes
        normalize_and_invert_safety_indexes(locations, max_danger_score)

    # Print the updated safety indexes for the specific areas
    print(f"Updated safety indexes for specified areas: {locations}")
