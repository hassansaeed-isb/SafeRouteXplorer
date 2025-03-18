/**
 * Main application file for SafeRouteXplorer
 * Initializes and coordinates all components
 */

// Ensure everything runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    if (typeof google === "undefined") {
        console.error("Google Maps API failed to load.");
        return;
    }
    initApp();
});

// Initialize the application
function initApp() {
    try {
        initMap(); // Ensure map initializes properly
        initializeModal(); // Initialize location modal

        fetchRoutes()
            .then(routes => displayRoutes(routes))
            .catch(error => console.error("Error fetching initial routes:", error));

        // Ensure buttons exist before adding event listeners
        addEventListenerIfExists("start-nav", startNavigation);
        addEventListenerIfExists("stop-nav", stopNavigation);
        addEventListenerIfExists("simulate-movement", simulateMovement);
        addEventListenerIfExists("enable-alerts", () => {
            alert("Safety alerts enabled. You will be notified of any danger zones nearby.");
        });

    } catch (error) {
        console.error("Error initializing app:", error);
    }
}

// Helper function to add event listener only if element exists
function addEventListenerIfExists(id, callback) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener("click", callback);
    } else {
        console.warn(`Element with ID '${id}' not found.`);
    }
}

// Export global variables safely
window.map = window.map || null;
window.directionsService = window.directionsService || null;
window.dangerPointsData = window.dangerPointsData || [];
window.routePolylines = window.routePolylines || [];
window.chosenRouteIndex = window.chosenRouteIndex || null;
window.currentDestination = window.currentDestination || null;
window.userMarker = window.userMarker || null;
window.watchId = window.watchId || null;
window.navStartTime = window.navStartTime || null;
window.notifiedCrimes = window.notifiedCrimes || [];
