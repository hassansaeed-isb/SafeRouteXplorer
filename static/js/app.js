/**
 * Main application file for SafeRouteXplorer
 * Initializes and coordinates all components
 */

// Initialize the application
function initApp() {
    // Initialize map
    initMap();
    
    // Initialize location modal
    initializeModal();
    
    // Fetch initial routes
    fetchRoutes()
        .then(routes => displayRoutes(routes))
        .catch(error => console.error("Error fetching initial routes:", error));

    // Initialize button listeners
    document.getElementById("start-nav").addEventListener("click", startNavigation);
    document.getElementById("stop-nav").addEventListener("click", stopNavigation);
    document.getElementById("simulate-movement").addEventListener("click", simulateMovement);
    document.getElementById("enable-alerts").addEventListener("click", () => {
        alert("Safety alerts enabled. You will be notified of any danger zones nearby.");
    });
}

// Export global variables and functions to be accessible across modules
window.map = map;
window.directionsService = directionsService;
window.dangerPointsData = dangerPointsData;
window.routePolylines = routePolylines;
window.chosenRouteIndex = chosenRouteIndex;
window.currentDestination = currentDestination;
window.userMarker = userMarker;
window.watchId = watchId;
window.navStartTime = navStartTime;
window.notifiedCrimes = notifiedCrimes;