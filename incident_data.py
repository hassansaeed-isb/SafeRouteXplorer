# incident_data.py

# Define severity levels as simple integers
SEVERITY_LOW = 1
SEVERITY_MEDIUM = 3
SEVERITY_HIGH = 5

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
    {"name": "Traffic Jam", "area": "Commercial Market", "severity": SEVERITY_LOW, "lat": 33.5968, "lng": 73.0476, "category": "GOVERNMENT"},
    {"name": "Street Fight", "area": "Chaklala Road", "severity": SEVERITY_MEDIUM, "lat": 33.6124, "lng": 73.0728, "category": "COMMERCIAL"},
    {"name": "Mugging", "area": "Abdul Majeed Road", "severity": SEVERITY_MEDIUM, "lat": 33.5970, "lng": 73.0417, "category": "RESIDENTIAL"},
    {"name": "Security Threat", "area": "Muslim School Road", "severity": SEVERITY_HIGH, "lat": 33.6312, "lng": 73.0657, "category": "OTHER"},
    {"name": "Accident", "area": "Jinnah Aveneue", "severity": SEVERITY_MEDIUM, "lat": 33.7047, "lng": 73.0456, "category": "HOSPITAL"},
    {"name": "Mugged", "area": "F-7", "severity": SEVERITY_MEDIUM, "lat": 33.7200, "lng": 73.0600, "category": "RESIDENTIAL"},
    {"name": "Robbery", "area": "F-6/2", "severity": SEVERITY_MEDIUM, "lat": 33.7300, "lng": 73.0650, "category": "RESIDENTIAL"},
    {"name": "Robbery/ (2 killed)", "area": "I-10/2", "severity": SEVERITY_HIGH, "lat": 33.65032492180146, "lng": 73.03389245251276, "category": "RESIDENTIAL"},
    {"name": "Theft", "area": "Qasim Market", "severity": SEVERITY_MEDIUM, "lat": 33.60054489248755,  "lng": 73.03350467492095, "category": "RESIDENTIAL"},
    {"name": "Blockade", "area": "Jinnah Market", "severity": SEVERITY_MEDIUM, "lat": 33.590350151543284, "lng": 73.06984298188172 ,"category": "RESIDENTIAL"},
]