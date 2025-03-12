/**
 * Enhanced Map functionality for SafeRouteXplorer
 * Includes custom styling for better visibility with map backgrounds
 */

let map, directionsService;
let dangerPointsData = [];

// Custom map style for better visibility
const mapStyle = [
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e9e9e9"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f5"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 18
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f5"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#dedede"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e5e5e5"
            },
            {
                "lightness": 15
            }
        ]
    },
    {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#eeeeee"
            },
            {
                "lightness": 19
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#fefefe"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
        ]
    }
];

// Initialize Google Maps with custom styling
function initMap() {
    const mapOptions = {
        center: { lat: 33.6844, lng: 73.0479 },
        zoom: 12,
        styles: mapStyle,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        streetViewControl: false,
        fullscreenControl: false
    };
    
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    directionsService = new google.maps.DirectionsService();
    
    // Add custom map controls
    addCustomControls();

    // Wait until the map is fully loaded before proceeding
    google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log("Map is fully loaded and idle.");
        // Optionally, trigger a default route fetch here if needed.
    });
    
    return map;
}


// Add custom map controls
function addCustomControls() {
    // Create control container
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'map-controls';
    
    // Add current location button
    const locationBtn = document.createElement('div');
    locationBtn.className = 'map-control-btn my-location';
    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    locationBtn.title = 'My Location';
    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    map.setZoom(15);
                    
                    // Show a temporary marker
                    const myLocMarker = new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 2,
                            scale: 8
                        },
                        animation: google.maps.Animation.DROP
                    });
                    
                    setTimeout(() => {
                        myLocMarker.setMap(null);
                    }, 5000);
                },
                () => {
                    alert("Could not get your location. Please check your browser settings.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });
    controlsDiv.appendChild(locationBtn);
    
    // Add toggle traffic button
    const trafficBtn = document.createElement('div');
    trafficBtn.className = 'map-control-btn traffic';
    trafficBtn.innerHTML = '<i class="fas fa-car"></i>';
    trafficBtn.title = 'Toggle Traffic';
    
    let trafficLayer = null;
    let trafficEnabled = false;
    
    trafficBtn.addEventListener('click', () => {
        if (!trafficEnabled) {
            trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);
            trafficBtn.style.backgroundColor = '#3498db';
            trafficBtn.style.color = 'white';
            trafficEnabled = true;
        } else {
            trafficLayer.setMap(null);
            trafficBtn.style.backgroundColor = '';
            trafficBtn.style.color = '';
            trafficEnabled = false;
        }
    });
    controlsDiv.appendChild(trafficBtn);
    
    // Add the control to the map
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlsDiv);
}

// Display danger points on the map with better styling
function displayDangerPoints() {
    dangerPointsData.forEach(point => {
        // Create custom info window content
        const contentString = `
            <div class="info-window">
                <h3>${point.name}</h3>
                <p><strong>Area:</strong> ${point.area}</p>
                <p><strong>Safety:</strong> 
                    <span class="danger-indicator ${point.danger_index <= 1 ? 'low' : 
                                                   point.danger_index <= 3 ? 'medium' : ''}">
                        ${getDangerText(point.danger_index)}
                    </span>
                </p>
            </div>
        `;
        
        const infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 250
        });
        
        const marker = new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: map,
            title: `${point.name} (Severity: ${point.danger_index})`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getDangerColor(point.danger_index),
                fillOpacity: 0.85,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: point.danger_index + 3 // Size based on danger index
            },
            animation: google.maps.Animation.DROP
        });
        
        marker.addListener("click", () => {
            infowindow.open(map, marker);
        });
    });
}

// Fetch route data from the server with improved error handling
function fetchRouteData(url) {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Loading routes...';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        padding: 15px 25px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    `;
    document.body.appendChild(loadingIndicator);
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.body.removeChild(loadingIndicator);
            
            if (data.error) {
                console.error(data.error);
                showToast("Error loading routes. Please try again.");
                throw new Error(data.error);
            }

            dangerPointsData = data.danger_points;
            displayDangerPoints();
            return data.routes;
        })
        .catch(error => {
            document.body.removeChild(loadingIndicator);
            console.error("Error fetching routes:", error);
            showToast("Could not load routes. Please check your connection.");
            throw error;
        });
}

// Get routes based on origin and destination with improved user experience
function fetchRoutes(startLocation = "Rawalpindi", endLocation = "Islamabad") {
    // If the user manually entered an origin address that is not "My Current Location",
    // use that address directly.
    if (
      startLocation &&
      startLocation.trim() !== "" &&
      startLocation.toLowerCase() !== "my current location"
    ) {
      const url = `/get_route_data?origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(endLocation)}`;
      return fetchRouteData(url);
    }
    
    // Otherwise, if geolocation is available, use it.
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        showToast("Getting your location...");
        navigator.geolocation.getCurrentPosition(
          pos => {
            const url = `/get_route_data?origin_lat=${pos.coords.latitude}&origin_lng=${pos.coords.longitude}&destination=${encodeURIComponent(endLocation)}`;
            fetchRouteData(url)
              .then(resolve)
              .catch(reject);
          },
          () => {
            showToast("Using default location instead.");
            const url = `/get_route_data?origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(endLocation)}`;
            fetchRouteData(url)
              .then(resolve)
              .catch(reject);
          },
          { timeout: 10000 }
        );
      });
    } else {
      showToast("Geolocation not available. Using default routes.");
      const url = `/get_route_data?origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(endLocation)}`;
      return fetchRouteData(url);
    }
  }
  

// Get color based on danger index
function getDangerColor(severity) {
    if (severity >= 4) return "#ff4d4d"; // High danger - red
    if (severity === 3) return "#ff9800"; // Medium danger - orange
    if (severity === 2) return "#ffc107"; // Low-medium danger - amber
    return "#4caf50"; // Low danger - green
}

// Get text description of danger level
function getDangerText(severity) {
    if (severity >= 4) return "High Risk";
    if (severity === 3) return "Medium Risk";
    if (severity === 2) return "Low Risk";
    return "Safe";
}

// Show a toast message
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 0.9em;
        z-index: 1100;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.style.opacity = "1";
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}