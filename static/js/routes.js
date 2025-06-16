/**
 * Enhanced route handling for SafeRouteXplorer
 * Improved route cards with better visibility for safest route
 * Updated to fix UI issues - including route title control
 * Added exception handling for better error resilience
 */

let routePolylines = [];
let chosenRouteIndex = null;
let currentDestination = "Islamabad";

// Display routes on the map and in the UI with improved visibility
function displayRoutes(routes) {
    try {
        clearRoutes();
        
        const routesContainer = document.getElementById('routes-container');
        if (!routesContainer) {
            console.error('Routes container not found');
            return -1;
        }
        
        routesContainer.innerHTML = '';

        // Validate routes data
        if (!Array.isArray(routes) || routes.length === 0) {
            console.warn('No valid routes data provided');
            return -1;
        }

        // Find safest route
        const safestIndex = routes.findIndex(r => r.is_safest);
        
        // Sort routes to display safest first
        const sortedRoutes = [...routes].sort((a, b) => {
            if (a.is_safest) return -1;
            if (b.is_safest) return 1;
            return 0;
        });

        sortedRoutes.forEach((route, sortedIndex) => {
            try {
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
                cardContent += `<p><strong>Safety Score:</strong> ${route.safety_index || 'N/A'}</p>`;
                
                // Add safest route badge with high visibility
                if (isSafest) {
                    cardContent += `<p><em>Safest Route</em></p>`;
                }
                
                card.innerHTML = cardContent;
                card.onclick = () => selectRoute(originalIndex);
                routesContainer.appendChild(card);

                // Create route polyline with improved styling
                if (route.path && Array.isArray(route.path) && typeof google !== 'undefined' && google.maps) {
                    try {
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
                    } catch (polylineError) {
                        console.error('Error creating polyline for route:', originalIndex, polylineError);
                    }
                }
            } catch (routeError) {
                console.error('Error processing route:', sortedIndex, routeError);
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
    } catch (error) {
        console.error('Error in displayRoutes:', error);
        // Show user-friendly error message
        const routesContainer = document.getElementById('routes-container');
        if (routesContainer) {
            routesContainer.innerHTML = '<p class="error-message">Unable to display routes. Please try again.</p>';
        }
        return -1;
    }
}

// Clear all route polylines from the map
function clearRoutes() {
    try {
        routePolylines.forEach(poly => {
            try {
                if (poly && poly.setMap) {
                    poly.setMap(null);
                }
            } catch (error) {
                console.error('Error clearing individual polyline:', error);
            }
        });
        routePolylines = [];
    } catch (error) {
        console.error('Error in clearRoutes:', error);
        routePolylines = []; // Reset array even if clearing failed
    }
}

// Select a route and update the UI accordingly
function selectRoute(index) {
    try {
        if (chosenRouteIndex === index) return index; // Already selected
        
        chosenRouteIndex = index;
        highlightSelectedRoute(index);
        
        // Scroll selected route card into view
        const cards = document.querySelectorAll('.route-card');
        const selectedCard = cards[index];
        
        if (selectedCard && selectedCard.scrollIntoView) {
            try {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch (scrollError) {
                // Fallback for browsers that don't support smooth scrolling
                selectedCard.scrollIntoView();
            }
        }
        
        // Show route title when a route is explicitly selected
        const routeTitle = document.querySelector('.safest-route-display');
        if (routeTitle) {
            routeTitle.style.display = 'block';
            routeTitle.classList.add('active');
            
            // Update title text to match current route
            const startLocationInput = document.getElementById("start-location");
            const endLocationInput = document.getElementById("end-location");
            
            const startLocation = startLocationInput ? startLocationInput.value || "Current Location" : "Current Location";
            const endLocation = endLocationInput ? endLocationInput.value || currentDestination : currentDestination;
            const titleText = `Safest Route from ${startLocation} to ${endLocation}`;
            
            const titleHeading = routeTitle.querySelector('h3');
            if (titleHeading) {
                titleHeading.textContent = titleText;
            }
        }
        
        return chosenRouteIndex;
    } catch (error) {
        console.error('Error in selectRoute:', error);
        return chosenRouteIndex; // Return current index if error occurs
    }
}

// Highlight the selected route on the map and in the UI
function highlightSelectedRoute(index) {
    try {
        // Update route lines on map
        routePolylines.forEach((poly, i) => {
            try {
                const isSelected = (i === index);
                const cards = document.querySelectorAll('.route-card');
                const isSafest = cards[i]?.classList.contains('safest');
                
                if (poly && poly.setOptions) {
                    poly.setOptions({
                        strokeColor: isSelected ? '#4CAF50' : (isSafest ? '#3498db' : '#e74c3c'),
                        strokeWeight: isSelected ? 6 : (isSafest ? 5 : 4),
                        strokeOpacity: isSelected ? 1.0 : (isSafest ? 0.9 : 0.7),
                        zIndex: isSelected ? 10 : (isSafest ? 5 : 1)
                    });
                }
            } catch (polyError) {
                console.error('Error updating polyline:', i, polyError);
            }
        });
        
        // Update route cards in UI
        const cards = document.querySelectorAll('.route-card');
        cards.forEach((card, i) => {
            try {
                if (i === index) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            } catch (cardError) {
                console.error('Error updating card:', i, cardError);
            }
        });
    } catch (error) {
        console.error('Error in highlightSelectedRoute:', error);
    }
}

// Initialize the location setting modal with improved UI
function initializeModal() {
    try {
        const modal = document.getElementById("location-modal");
        const locationBtn = document.getElementById("set-location");
        const closeBtn = document.querySelector(".close-btn");
        const locationForm = document.getElementById("location-form");

        if (!modal || !locationBtn || !closeBtn || !locationForm) {
            console.error('Required modal elements not found');
            return;
        }

        // Setup autocomplete for location inputs if Google Places API is available
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            try {
                const startInput = document.getElementById("start-location");
                const endInput = document.getElementById("end-location");
                
                if (startInput && endInput) {
                    const startAutocomplete = new google.maps.places.Autocomplete(startInput, {
                        types: ['geocode'],
                        fields: ['place_id', 'geometry', 'name']
                    });
                    
                    const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
                        types: ['geocode'],
                        fields: ['place_id', 'geometry', 'name']
                    });
                    
                    // Limit autocomplete results to current map bounds
                    if (typeof map !== 'undefined' && map.addListener) {
                        map.addListener('bounds_changed', () => {
                            try {
                                const bounds = map.getBounds();
                                if (bounds) {
                                    startAutocomplete.setBounds(bounds);
                                    endAutocomplete.setBounds(bounds);
                                }
                            } catch (boundsError) {
                                console.error('Error setting autocomplete bounds:', boundsError);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error setting up Places Autocomplete:", e);
            }
        }

        locationBtn.addEventListener("click", () => {
            modal.style.display = "block";
            
            // If geolocation available, offer to use current location
            if (navigator.geolocation) {
                const startInput = document.getElementById("start-location");
                if (startInput && !startInput.value) {
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
                                    try {
                                        // Get address from coordinates (reverse geocoding)
                                        if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
                                            const geocoder = new google.maps.Geocoder();
                                            const latlng = {
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            };
                                            
                                            geocoder.geocode({ location: latlng }, (results, status) => {
                                                try {
                                                    if (status === "OK" && results && results[0]) {
                                                        startInput.value = "My Current Location";
                                                        startInput.dataset.lat = position.coords.latitude;
                                                        startInput.dataset.lng = position.coords.longitude;
                                                    } else {
                                                        startInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                                                    }
                                                } catch (geocodeError) {
                                                    console.error('Geocoding error:', geocodeError);
                                                    startInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                                                }
                                            });
                                        } else {
                                            startInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                                        }
                                    } catch (positionError) {
                                        console.error('Error processing position:', positionError);
                                        alert("Error processing your location. Please enter an address manually.");
                                    }
                                },
                                (error) => {
                                    console.error("Geolocation error:", error);
                                    let errorMessage = "Could not get your location. Please enter an address.";
                                    switch(error.code) {
                                        case error.PERMISSION_DENIED:
                                            errorMessage = "Location access denied. Please enter an address manually.";
                                            break;
                                        case error.POSITION_UNAVAILABLE:
                                            errorMessage = "Location information unavailable. Please enter an address manually.";
                                            break;
                                        case error.TIMEOUT:
                                            errorMessage = "Location request timed out. Please enter an address manually.";
                                            break;
                                    }
                                    alert(errorMessage);
                                }
                            );
                        });
                        
                        if (startInput.parentNode) {
                            startInput.parentNode.appendChild(useLocationBtn);
                        }
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
            try {
                e.preventDefault();
                
                const startLocationInput = document.getElementById("start-location");
                const endLocationInput = document.getElementById("end-location");
                
                const startLocation = startLocationInput ? startLocationInput.value : '';
                const endLocation = endLocationInput ? endLocationInput.value : '';
                
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
                if (startInput && startInput.dataset.lat && startInput.dataset.lng) {
                    const url = `/get_route_data?origin_lat=${startInput.dataset.lat}&origin_lng=${startInput.dataset.lng}&destination=${encodeURIComponent(endLocation)}`;
                    
                    if (typeof fetchRouteData === 'function') {
                        fetchRouteData(url)
                            .then(routes => {
                                try {
                                    if (document.body.contains(loadingText)) {
                                        document.body.removeChild(loadingText);
                                    }
                                    displayRoutes(routes);
                                } catch (displayError) {
                                    console.error('Error displaying routes:', displayError);
                                }
                            })
                            .catch(error => {
                                try {
                                    if (document.body.contains(loadingText)) {
                                        document.body.removeChild(loadingText);
                                    }
                                    console.error("Error fetching routes:", error);
                                    alert("Unable to fetch route data. Please try again.");
                                } catch (cleanupError) {
                                    console.error('Error in cleanup:', cleanupError);
                                }
                            });
                    } else {
                        console.error('fetchRouteData function not available');
                        if (document.body.contains(loadingText)) {
                            document.body.removeChild(loadingText);
                        }
                        alert("Route fetching service unavailable. Please try again later.");
                    }
                } else {
                    if (typeof fetchRoutes === 'function') {
                        fetchRoutes(startLocation, endLocation)
                            .then(routes => {
                                try {
                                    if (document.body.contains(loadingText)) {
                                        document.body.removeChild(loadingText);
                                    }
                                    displayRoutes(routes);
                                } catch (displayError) {
                                    console.error('Error displaying routes:', displayError);
                                }
                            })
                            .catch(error => {
                                try {
                                    if (document.body.contains(loadingText)) {
                                        document.body.removeChild(loadingText);
                                    }
                                    console.error("Error fetching routes:", error);
                                    alert("Unable to fetch route data. Please try again.");
                                } catch (cleanupError) {
                                    console.error('Error in cleanup:', cleanupError);
                                }
                            });
                    } else {
                        console.error('fetchRoutes function not available');
                        if (document.body.contains(loadingText)) {
                            document.body.removeChild(loadingText);
                        }
                        alert("Route fetching service unavailable. Please try again later.");
                    }
                }
                    
                modal.style.display = "none";
            } catch (submitError) {
                console.error('Error in form submission:', submitError);
                alert("An error occurred while processing your request. Please try again.");
            }
        });
    } catch (error) {
        console.error('Error initializing modal:', error);
    }
}

// Enhance the safest route badge visibility (called from mobile.js)
function enhanceSafestRouteBadge() {
    try {
        const safestCards = document.querySelectorAll('.route-card.safest');
        safestCards.forEach(card => {
            try {
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
                    if (safetyBadge.parentElement) {
                        safetyBadge.parentElement.style.display = 'block';
                    }
                }
            } catch (badgeError) {
                console.error('Error enhancing individual safety badge:', badgeError);
            }
        });
    } catch (error) {
        console.error('Error in enhanceSafestRouteBadge:', error);
    }
}