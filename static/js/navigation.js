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

    navStartTime = Date.now();
    document.getElementById("nav-info").innerText = 
        `Navigation started on Route #${chosenRouteIndex + 1} to ${currentDestination}.`;

    // Hide other routes
    routePolylines.forEach((poly, i) => {
        if (i !== chosenRouteIndex) poly.setMap(null);
        else {
            poly.setOptions({
                strokeColor: "#4CAF50",
                strokeWeight: 6,
                strokeOpacity: 1.0
            });
        }
    });

    document.getElementById("start-nav").style.display = "none";
    document.getElementById("stop-nav").style.display = "inline-block";

    watchId = navigator.geolocation.watchPosition(
        pos => {
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
            map.setCenter(newPos);
            updateNavInfo(newPos);
            checkNearbyCrimes(newPos);
        },
        err => {
            console.error("Navigation error:", err);
            alert("Cannot track your position in real-time.");
        },
        { enableHighAccuracy: true }
    );
}

// Stop active navigation
function stopNavigation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (userMarker) {
        userMarker.setMap(null);
        userMarker = null;
    }
    navStartTime = null;
    document.getElementById("nav-info").innerText = "Navigation stopped.";
    document.getElementById("start-nav").style.display = "inline-block";
    document.getElementById("stop-nav").style.display = "none";
}

// Update navigation information display
function updateNavInfo(currentPos) {
    if (!navStartTime) return;
    
    const request = {
        origin: currentPos,
        destination: currentDestination,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (response, status) => {
        if (status === "OK") {
            const leg = response.routes[0].legs[0];
            const dist = leg.distance.text;
            const dur = leg.duration.text;

            const elapsedMs = Date.now() - navStartTime;
            let sec = Math.floor(elapsedMs / 1000);
            const hh = Math.floor(sec / 3600);
            sec %= 3600;
            const mm = Math.floor(sec / 60);
            const ss = sec % 60;
            const elapsedStr = `${hh > 0 ? hh + 'h ' : ''}${mm > 0 ? mm + 'm ' : ''}${ss}s`;

            document.getElementById("nav-info").innerHTML = `
                <strong>Distance to ${currentDestination}:</strong> ${dist}<br>
                <strong>Estimated Time:</strong> ${dur}<br>
                <strong>Elapsed Time:</strong> ${elapsedStr}
            `;
        }
    });
}