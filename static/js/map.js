/**
 * Map functionality for SafeRouteXplorer
 */

let map, directionsService;
let dangerPointsData = [];

// Initialize Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 33.6844, lng: 73.0479 },
        zoom: 12
    });

    directionsService = new google.maps.DirectionsService();
    return map;
}

// Display danger points on the map
function displayDangerPoints() {
    dangerPointsData.forEach(point => {
        new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: map,
            title: `${point.name} (Severity: ${point.danger_index})`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getDangerColor(point.danger_index),
                fillOpacity: 0.8,
                strokeWeight: 1,
                scale: 6
            }
        });
    });
}

// Fetch route data from the server
function fetchRouteData(url) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                throw new Error(data.error);
            }

            dangerPointsData = data.danger_points;
            displayDangerPoints();
            return data.routes;
        })
        .catch(error => {
            console.error("Error fetching routes:", error);
            throw error;
        });
}

// Get routes based on origin and destination
function fetchRoutes(startLocation = "Rawalpindi", endLocation = "Islamabad") {
    if (navigator.geolocation) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const url = `/get_route_data?origin_lat=${pos.coords.latitude}&origin_lng=${pos.coords.longitude}&destination=${encodeURIComponent(endLocation)}`;
                    fetchRouteData(url)
                        .then(resolve)
                        .catch(reject);
                },
                () => {
                    const url = `/get_route_data`;
                    fetchRouteData(url)
                        .then(resolve)
                        .catch(reject);
                }
            );
        });
    } else {
        const url = `/get_route_data`;
        return fetchRouteData(url);
    }
}