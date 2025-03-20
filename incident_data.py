# incident_data.py

# Define severity levels as simple integers
SEVERITY_LOW = 1
SEVERITY_MEDIUM = 2
SEVERITY_HIGH = 3

# Define category types with their multipliers
CATEGORY_MULTIPLIERS = {
    "RESIDENTIAL": 1.0,
    "COMMERCIAL": 1.2,
    "SCHOOL": 2.0,
    "HOSPITAL": 1.8,
    "GOVERNMENT": 1.5,
    "OTHER": 1.0
}

# Shared hardcoded incidents with serializable values
HARDCODED_INCIDENTS = [
    {"name": "Car Accident", "area": "F-8, Islamabad", "severity": SEVERITY_HIGH, "lat": 33.6844, "lng": 73.0479, "category": "COMMERCIAL"},
    {"name": "Robbery", "area": "G-9, Islamabad", "severity": SEVERITY_MEDIUM, "lat": 33.6846, "lng": 73.0586, "category": "RESIDENTIAL"},
    {"name": "Traffic Jam", "area": "Rawalpindi Saddar", "severity": SEVERITY_LOW, "lat": 33.5968, "lng": 73.0476, "category": "GOVERNMENT"},
    {"name": "Street Fight", "area": "Rawalpindi Committee Chowk", "severity": SEVERITY_MEDIUM, "lat": 33.6124, "lng": 73.0728, "category": "COMMERCIAL"},
    {"name": "Mugging", "area": "Rawalpindi Banni", "severity": SEVERITY_MEDIUM, "lat": 33.5970, "lng": 73.0417, "category": "RESIDENTIAL"},
    {"name": "Flooding", "area": "Murree Road, Rawalpindi", "severity": SEVERITY_HIGH, "lat": 33.6312, "lng": 73.0657, "category": "OTHER"},
    {"name": "Accident", "area": "F-10, Islamabad", "severity": SEVERITY_MEDIUM, "lat": 33.7047, "lng": 73.0456, "category": "HOSPITAL"},
    {"name": "Pedestrian Hit", "area": "I-10, Islamabad", "severity": SEVERITY_HIGH, "lat": 33.7085, "lng": 73.0770, "category": "SCHOOL"},
    {"name": "Mugging", "area": "F-7", "severity": SEVERITY_MEDIUM, "lat": 33.7200, "lng": 73.0600, "category": "RESIDENTIAL"},
    {"name": "Robbery", "area": "F-6/2", "severity": SEVERITY_MEDIUM, "lat": 33.7300, "lng": 73.0650, "category": "RESIDENTIAL"}
]