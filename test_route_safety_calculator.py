from route_safety_calculator import RouteSafetyCalculator
import googlemaps

def test_load_incident_data():
    """
    Test the loading of incident data from the CSV and hardcoded incidents.
    """
    gmaps = googlemaps.Client(key="AIzaSyCoT1wmOma1cU-AC-GI2nOh8CT-bms_IkE")
    calculator = RouteSafetyCalculator(gmaps, "1improved_processed_road_safety_tweets.csv")

    incidents = calculator._load_incident_data()
    assert isinstance(incidents, list), "Incidents should be a list"
    assert len(incidents) > 0, "Incidents should not be empty"
    assert 'lat' in incidents[0], "Each incident should have 'lat'"
    assert 'lng' in incidents[0], "Each incident should have 'lng'"
    assert 'severity' in incidents[0], "Each incident should have 'severity'"

def test_calculate_distance():
    """
    Test the Haversine distance calculation.
    """
    gmaps = googlemaps.Client(key="AIzaSyCoT1wmOma1cU-AC-GI2nOh8CT-bms_IkE")
    calculator = RouteSafetyCalculator(gmaps, "1improved_processed_road_safety_tweets.csv")
    
    lat1, lon1 = 33.6844, 73.0479  # Rawalpindi
    lat2, lon2 = 33.6846, 73.0586  # Islamabad
    distance = calculator._calculate_distance(lat1, lon1, lat2, lon2)
    assert isinstance(distance, float), "Distance should be a float"
    assert distance > 0, "Distance should be greater than zero"

def test_calculate_route_safety():
    """
    Test the route safety calculation.
    """
    gmaps = googlemaps.Client(key="AIzaSyCoT1wmOma1cU-AC-GI2nOh8CT-bms_IkE")
    calculator = RouteSafetyCalculator(gmaps, "1improved_processed_road_safety_tweets.csv")

    route_coordinates = [(33.6844, 73.0479), (33.6846, 73.0586)]
    safety_index = calculator.calculate_route_safety(route_coordinates)
    assert isinstance(safety_index, float), "Safety index should be a float"
    assert 0 <= safety_index <= 100, "Safety index should be between 0 and 100"
