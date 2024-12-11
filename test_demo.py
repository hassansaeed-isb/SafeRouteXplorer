import pytest
from demo import app  # Import the Flask app instance from demo.py

@pytest.fixture
def client():
    """
    Create a test client for the Flask app.
    """
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_route(client):
    """
    Test the index route to ensure it loads correctly.
    """
    response = client.get('/')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "<title>SafeRouteXplorer</title>" in html
    assert "Safest Route from" in html

def test_get_route_data(client):
    """
    Test the /get_route_data route.
    """
    response = client.get('/get_route_data')
    assert response.status_code == 200
    data = response.get_json()
    assert 'routes' in data, "Expected 'routes' in the JSON response"
    assert 'danger_points' in data, "Expected 'danger_points' in the JSON response"

    # Validate structure of the 'routes' list
    assert isinstance(data['routes'], list), "Expected 'routes' to be a list"
    assert isinstance(data['danger_points'], list), "Expected 'danger_points' to be a list"

    if data['routes']:
        first_route = data['routes'][0]
        assert 'legs' in first_route, "Route data should include 'legs'"
        assert 'safety_index' in first_route, "Route data should include 'safety_index'"
        assert isinstance(first_route['safety_index'], (int, float)), "'safety_index' should be numeric"

def test_safest_route(client):
    """
    Validate that the safest route is correctly identified.
    """
    response = client.get('/get_route_data')
    data = response.get_json()
    if data['routes']:
        safest_routes = [route for route in data['routes'] if route.get('is_safest')]
        assert len(safest_routes) == 1, "There should be exactly one safest route"
        assert safest_routes[0]['safety_index'] >= 0, "Safety index should be non-negative"
