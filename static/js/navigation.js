/**
 * Navigation functionality for SafeRouteXplorer
 */

let userMarker = null;
let watchId = null;
let navStartTime = null;

// Start navigation along the selected route
function startNavigation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    try {
        navStartTime = Date.now();
        const navInfo = document.getElementById("nav-info");
        if (navInfo) {
            navInfo.innerText = 
                `Navigation started on Route #${chosenRouteIndex + 1} to ${currentDestination}.`;
        }

        // Hide other routes
        if (routePolylines && Array.isArray(routePolylines)) {
            routePolylines.forEach((poly, i) => {
                try {
                    if (i !== chosenRouteIndex) poly.setMap(null);
                    else {
                        poly.setOptions({
                            strokeColor: "#4CAF50",
                            strokeWeight: 6,
                            strokeOpacity: 1.0
                        });
                    }
                } catch (error) {
                    console.error("Error updating route polyline:", error);
                }
            });
        }

        const startNavBtn = document.getElementById("start-nav");
        const stopNavBtn = document.getElementById("stop-nav");
        
        if (startNavBtn) startNavBtn.style.display = "none";
        if (stopNavBtn) stopNavBtn.style.display = "inline-block";

        watchId = navigator.geolocation.watchPosition(
            pos => {
                try {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const newPos = new google.maps.LatLng(lat, lng);

                    if (!userMarker) {
                        userMarker = new google.maps.Marker({
                            position: newPos,
                            map: map,
                            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            title: "You"
                        });
                    } else {
                        userMarker.setPosition(newPos);
                    }
                    
                    if (map) {
                        map.setCenter(newPos);
                    }
                    
                    updateNavInfo(newPos);
                    
                    if (typeof checkNearbyCrimes === 'function') {
                        checkNearbyCrimes(newPos);
                    }
                } catch (error) {
                    console.error("Error processing position update:", error);
                }
            },
            err => {
                console.error("Navigation error:", err);
                let errorMessage = "Cannot track your position in real-time";
                
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage += ": Location permission denied";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage += ": Location unavailable";
                        break;
                    case err.TIMEOUT:
                        errorMessage += ": Location request timeout";
                        break;
                }
                
                alert(errorMessage);
                stopNavigation(); // Clean up on error
            },
            { enableHighAccuracy: true }
        );
    } catch (error) {
        console.error("Error starting navigation:", error);
        alert("Failed to start navigation. Please try again.");
    }
}

// Stop active navigation
function stopNavigation() {
    try {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        if (userMarker) {
            userMarker.setMap(null);
            userMarker = null;
        }
        navStartTime = null;
        
        const navInfo = document.getElementById("nav-info");
        if (navInfo) {
            navInfo.innerText = "Navigation stopped.";
        }
        
        const startNavBtn = document.getElementById("start-nav");
        const stopNavBtn = document.getElementById("stop-nav");
        
        if (startNavBtn) startNavBtn.style.display = "inline-block";
        if (stopNavBtn) stopNavBtn.style.display = "none";
    } catch (error) {
        console.error("Error stopping navigation:", error);
    }
}

// Update navigation information display
function updateNavInfo(currentPos) {
    if (!navStartTime || !currentDestination) return;
    
    try {
        if (!directionsService) {
            console.error("Directions service not available");
            return;
        }
        
        const request = {
            origin: currentPos,
            destination: currentDestination,
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (response, status) => {
            try {
                if (status === "OK" && response && response.routes && response.routes[0]) {
                    const leg = response.routes[0].legs[0];
                    if (!leg) return;
                    
                    const dist = leg.distance ? leg.distance.text : "Unknown";
                    const dur = leg.duration ? leg.duration.text : "Unknown";

                    const elapsedMs = Date.now() - navStartTime;
                    let sec = Math.floor(elapsedMs / 1000);
                    const hh = Math.floor(sec / 3600);
                    sec %= 3600;
                    const mm = Math.floor(sec / 60);
                    const ss = sec % 60;
                    const elapsedStr = `${hh > 0 ? hh + 'h ' : ''}${mm > 0 ? mm + 'm ' : ''}${ss}s`;

                    const navInfo = document.getElementById("nav-info");
                    if (navInfo) {
                        navInfo.innerHTML = `
                            <strong>Distance to ${currentDestination}:</strong> ${dist}<br>
                            <strong>Estimated Time:</strong> ${dur}<br>
                            <strong>Elapsed Time:</strong> ${elapsedStr}
                        `;
                    }
                } else {
                    console.error("Directions request failed:", status);
                }
            } catch (error) {
                console.error("Error processing navigation update:", error);
            }
        });
    } catch (error) {
        console.error("Error updating navigation info:", error);
    }
}