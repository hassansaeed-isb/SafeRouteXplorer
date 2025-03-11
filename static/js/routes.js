/**
 * Enhanced route handling for SafeRouteXplorer
 * Improved route cards with better visibility for safest route
 * Updated to fix UI issues - including route title control
 */

let routePolylines = [];
let chosenRouteIndex = null;
let currentDestination = "Islamabad";

// Display routes on the map and in the UI with improved visibility
function displayRoutes(routes) {
    clearRoutes();
    
    const routesContainer = document.getElementById('routes-container');
    routesContainer.innerHTML = '';

    // Find safest route
    const safestIndex = routes.findIndex(r => r.is_safest);
    
    // Sort routes to display safest first
    const sortedRoutes = [...routes].sort((a, b) => {
        if (a.is_safest) return -1;
        if (b.is_safest) return 1;
        return 0;
    });

    sortedRoutes.forEach((route, sortedIndex) => {
        const originalIndex = routes.indexOf(route);
        const isSafest = route.is_safest;
        
        // Create route card with enhanced styling
        const card = document.createElement('div');
        card.className = `route-card ${isSafest ? 'safest' : ''}`;
    
        // Create card content
        let cardContent = `
            <h4>Route ${originalIndex + 1}</h4>
            <p><strong>Distance:</strong> ${route.distance || 'N/A'}</p>
        `;
        
        // Add additional safety info for all routes
        cardContent += `<p><strong>Safety Score:</strong> ${route.safety_index}</p>`;
        
        // Add safest route badge with high visibility
        if (isSafest) {
            cardContent += `<p><em>Safest Route</em></p>`;
        }
        
        card.innerHTML = cardContent;
        card.onclick = () => selectRoute(originalIndex);
        routesContainer.appendChild(card);

        // Create route polyline with improved styling
        if (route.path) {
            // Create a more visually appealing polyline
            const polyline = new google.maps.Polyline({
                path: route.path,
                strokeColor: isSafest ? '#3498db' : '#e74c3c',
                strokeWeight: isSafest ? 6 : 4,
                strokeOpacity: isSafest ? 0.9 : 0.7,
                icons: isSafest ? [{
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 3,
                        fillColor: "#ffffff",
                        fillOpacity: 1,
                        strokeWeight: 0
                    },
                    offset: "0%",
                    repeat: "15%"
                }] : null,
                map: map
            });
            
            // Add hover effect for route lines
            google.maps.event.addListener(polyline, 'mouseover', function() {
                this.setOptions({
                    strokeWeight: isSafest ? 8 : 6,
                    strokeOpacity: 1.0
                });
            });
            
            google.maps.event.addListener(polyline, 'mouseout', function() {
                this.setOptions({
                    strokeWeight: isSafest ? 6 : 4,
                    strokeOpacity: isSafest ? 0.9 : 0.7
                });
            });
            
            // Click on polyline selects the route
            google.maps.event.addListener(polyline, 'click', function() {
                selectRoute(originalIndex);
            });
            
            routePolylines.push(polyline);
        }
    });

    // Set default selected route (the safest one if available)
    chosenRouteIndex = safestIndex >= 0 ? safestIndex : 0;
    highlightSelectedRoute(chosenRouteIndex);
    
    // Apply enhanced styling for mobile view
    if (window.innerWidth <= 768) {
        enhanceSafestRouteBadge();
    }
    
    // Hide route title until user explicitly selects
    const routeTitle = document.querySelector('.safest-route-display');
    if (routeTitle) {
        routeTitle.style.display = 'none';
        routeTitle.classList.remove('active');
    }
    
    return chosenRouteIndex;
}

// Clear all route polylines from the map
function clearRoutes() {
    routePolylines.forEach(poly => poly.setMap(null));
    routePolylines = [];
}

// Select a route and update the UI accordingly
function selectRoute(index) {
    if (chosenRouteIndex === index) return index; // Already selected
    
    chosenRouteIndex = index;
    highlightSelectedRoute(index);
    
    // Scroll selected route card into view
    const cards = document.querySelectorAll('.route-card');
    const selectedCard = cards[index];
    
    if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    // Show route title when a route is explicitly selected
    const routeTitle = document.querySelector('.safest-route-display');
    if (routeTitle) {
        routeTitle.style.display = 'block';
        routeTitle.classList.add('active');
        
        // Update title text to match current route
        const startLocation = document.getElementById("start-location").value || "Current Location";
        const endLocation = document.getElementById("end-location").value || currentDestination;
        const titleText = `Safest Route from ${startLocation} to ${endLocation}`;
        
        const titleHeading = routeTitle.querySelector('h3');
        if (titleHeading) {
            titleHeading.textContent = titleText;
        }
    }
    
    return chosenRouteIndex;
}

// Highlight the selected route on the map and in the UI
function highlightSelectedRoute(index) {
    // Update route lines on map
    routePolylines.forEach((poly, i) => {
        const isSelected = (i === index);
        const isSafest = document.querySelectorAll('.route-card')[i]?.classList.contains('safest');
        
        poly.setOptions({
            strokeColor: isSelected ? '#4CAF50' : (isSafest ? '#3498db' : '#e74c3c'),
            strokeWeight: isSelected ? 6 : (isSafest ? 5 : 4),
            strokeOpacity: isSelected ? 1.0 : (isSafest ? 0.9 : 0.7),
            zIndex: isSelected ? 10 : (isSafest ? 5 : 1)
        });
    });
    
    // Update route cards in UI
    const cards = document.querySelectorAll('.route-card');
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// Initialize the location setting modal with improved UI
function initializeModal() {
    const modal = document.getElementById("location-modal");
    const locationBtn = document.getElementById("set-location");
    const closeBtn = document.querySelector(".close-btn");
    const locationForm = document.getElementById("location-form");

    // Setup autocomplete for location inputs if Google Places API is available
    if (google.maps.places) {
        try {
            const startInput = document.getElementById("start-location");
            const endInput = document.getElementById("end-location");
            
            const startAutocomplete = new google.maps.places.Autocomplete(startInput, {
                types: ['geocode'],
                fields: ['place_id', 'geometry', 'name']
            });
            
            const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
                types: ['geocode'],
                fields: ['place_id', 'geometry', 'name']
            });
            
            // Limit autocomplete results to current map bounds
            map.addListener('bounds_changed', () => {
                startAutocomplete.setBounds(map.getBounds());
                endAutocomplete.setBounds(map.getBounds());
            });
        } catch (e) {
            console.error("Error setting up Places Autocomplete:", e);
        }
    }

    locationBtn.addEventListener("click", () => {
        modal.style.display = "block";
        
        // If geolocation available, offer to use current location
        if (navigator.geolocation) {
            const startInput = document.getElementById("start-location");
            if (!startInput.value) {
                startInput.placeholder = "Use current location or enter address";
                
                // Add "Use current location" button
                let useLocationBtn = document.getElementById("use-current-location");
                if (!useLocationBtn) {
                    useLocationBtn = document.createElement("button");
                    useLocationBtn.id = "use-current-location";
                    useLocationBtn.type = "button";
                    useLocationBtn.className = "secondary-btn";
                    useLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use my location';
                    useLocationBtn.style.cssText = `
                        background: #f8f9fa;
                        color: #3498db;
                        border: 1px solid #3498db;
                        border-radius: 20px;
                        padding: 8px 12px;
                        margin-top: 8px;
                        cursor: pointer;
                        font-size: 0.9em;
                        transition: all 0.3s ease;
                    `;
                    
                    useLocationBtn.addEventListener("mouseover", () => {
                        useLocationBtn.style.background = "#eef5fc";
                    });
                    
                    useLocationBtn.addEventListener("mouseout", () => {
                        useLocationBtn.style.background = "#f8f9fa";
                    });
                    
                    useLocationBtn.addEventListener("click", () => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                // Get address from coordinates (reverse geocoding)
                                const geocoder = new google.maps.Geocoder();
                                const latlng = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                
                                geocoder.geocode({ location: latlng }, (results, status) => {
                                    if (status === "OK" && results[0]) {
                                        startInput.value = "My Current Location";
                                        startInput.dataset.lat = position.coords.latitude;
                                        startInput.dataset.lng = position.coords.longitude;
                                    } else {
                                        startInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                                    }
                                });
                            },
                            (error) => {
                                console.error("Geolocation error:", error);
                                alert("Could not get your location. Please enter an address.");
                            }
                        );
                    });
                    
                    startInput.parentNode.appendChild(useLocationBtn);
                }
            }
        }
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    locationForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const startLocation = document.getElementById("start-location").value;
        const endLocation = document.getElementById("end-location").value;
        
        if (!startLocation || !endLocation) {
            alert("Please enter both start and end locations.");
            return;
        }
        
        // Update route title text but keep it hidden until selection
        const routeTitle = document.querySelector(".safest-route-display");
        if (routeTitle) {
            const routeTitleH3 = routeTitle.querySelector('h3');
            if (routeTitleH3) {
                routeTitleH3.textContent = `Safest Route from ${startLocation} to ${endLocation}`;
            }
            routeTitle.style.display = 'none';
            routeTitle.classList.remove('active');
        }
        
        currentDestination = endLocation;
        
        // Show loading indicator
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Finding the safest routes for you...';
        loadingText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-weight: bold;
        `;
        document.body.appendChild(loadingText);
        
        // If we have stored coordinates from "Use my location"
        const startInput = document.getElementById("start-location");
        if (startInput.dataset.lat && startInput.dataset.lng) {
            const url = `/get_route_data?origin_lat=${startInput.dataset.lat}&origin_lng=${startInput.dataset.lng}&destination=${encodeURIComponent(endLocation)}`;
            fetchRouteData(url)
                .then(routes => {
                    document.body.removeChild(loadingText);
                    displayRoutes(routes);
                })
                .catch(error => {
                    document.body.removeChild(loadingText);
                    console.error("Error fetching routes:", error);
                });
        } else {
            fetchRoutes(startLocation, endLocation)
                .then(routes => {
                    document.body.removeChild(loadingText);
                    displayRoutes(routes);
                })
                .catch(error => {
                    document.body.removeChild(loadingText);
                    console.error("Error fetching routes:", error);
                });
        }
            
        modal.style.display = "none";
    });
}

// Enhance the safest route badge visibility (called from mobile.js)
function enhanceSafestRouteBadge() {
    const safestCards = document.querySelectorAll('.route-card.safest');
    safestCards.forEach(card => {
        let safetyBadge = card.querySelector('p em');
        if (safetyBadge) {
            safetyBadge.style.background = '#3498db';
            safetyBadge.style.color = 'white';
            safetyBadge.style.padding = '3px 8px';
            safetyBadge.style.borderRadius = '12px';
            safetyBadge.style.fontWeight = 'bold';
            safetyBadge.style.fontSize = '0.75em';
            safetyBadge.style.display = 'inline-block';
            safetyBadge.style.marginTop = '2px';
            safetyBadge.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            
            // Make sure parent paragraph is always visible
            safetyBadge.parentElement.style.display = 'block';
        }
    });
}