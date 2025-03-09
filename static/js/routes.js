/**
 * Route handling for SafeRouteXplorer
 */

let routePolylines = [];
let chosenRouteIndex = null;
let currentDestination = "Islamabad";

// Display routes on the map and in the UI
function displayRoutes(routes) {
    clearRoutes();
    
    const routesContainer = document.getElementById('routes-container');
    routesContainer.innerHTML = '';

    routes.forEach((route, index) => {
        const isSafest = route.is_safest;
        
        // Create route card
        const card = document.createElement('div');
        card.className = `route-card ${isSafest ? 'safest' : ''}`;
        card.innerHTML = `
            <h4>Route ${index + 1}</h4>
            <p><strong>Distance:</strong> ${route.distance || 'N/A'}</p>
            
            <p><strong>Safety Index:</strong> ${route.safety_index}</p>
            ${isSafest ? '<p><em>Safest Route</em></p>' : ''}
        `;
        card.onclick = () => selectRoute(index);
        routesContainer.appendChild(card);

        // Create route polyline
        if (route.path) {
            const polyline = new google.maps.Polyline({
                path: route.path,
                strokeColor: isSafest ? '#4CAF50' : '#FF0000',
                strokeWeight: isSafest ? 6 : 4,
                strokeOpacity: 0.8,
                map: map
            });
            routePolylines.push(polyline);
        }
    });

    // Set default selected route
    chosenRouteIndex = routes.findIndex(r => r.is_safest);
    if (chosenRouteIndex < 0) chosenRouteIndex = 0;
    
    return chosenRouteIndex;
}

// Clear all route polylines from the map
function clearRoutes() {
    routePolylines.forEach(poly => poly.setMap(null));
    routePolylines = [];
}

// Select a route and update the UI accordingly
function selectRoute(index) {
    chosenRouteIndex = index;
    routePolylines.forEach((poly, i) => {
        poly.setOptions({
            strokeColor: (i === index) ? "#4CAF50" : "#FF0000",
            strokeWeight: (i === index) ? 6 : 4
        });
    });
    return chosenRouteIndex;
}

// Initialize the location setting modal
function initializeModal() {
    const modal = document.getElementById("location-modal");
    const locationBtn = document.getElementById("set-location");
    const closeBtn = document.querySelector(".close-btn");
    const locationForm = document.getElementById("location-form");

    locationBtn.addEventListener("click", () => {
        modal.style.display = "block";
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
        
        document.querySelector(".safest-route-display h3").textContent = 
            `Safest Route from ${startLocation} to ${endLocation}`;
        
        currentDestination = endLocation;
        
        fetchRoutes(startLocation, endLocation)
            .then(routes => displayRoutes(routes))
            .catch(error => console.error("Error fetching routes:", error));
            
        modal.style.display = "none";
    });
}