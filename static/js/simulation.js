/**
 * Simulated movement functionality for SafeRouteXplorer
 */

// Simulation variables
const simulatedPath = [
    { lat: 33.6844, lng: 73.0479 }, // Starting point
    { lat: 33.6922, lng: 73.0490 }, // Moving towards Demo Zone 1
    { lat: 33.7000, lng: 73.0500 }, // Demo Incident 1 location
    { lat: 33.7100, lng: 73.0550 }, // Moving between points
    { lat: 33.7200, lng: 73.0600 }  // Demo Incident 2 location
];
let simulationIndex = 0;
let simulationInterval = null;

// Start the movement simulation
function simulateMovement() {
    if (simulationInterval) return;
    
    try {
        simulationIndex = 0;
        
        if (typeof resetNotifications === 'function') {
            resetNotifications();
        }

        simulationInterval = setInterval(() => {
            try {
                if (simulationIndex >= simulatedPath.length) {
                    clearInterval(simulationInterval);
                    simulationInterval = null;
                    return;
                }

                const pos = simulatedPath[simulationIndex];
                const newPos = new google.maps.LatLng(pos.lat, pos.lng);
                
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: newPos,
                        map: map,
                        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                        title: "You (Simulated)"
                    });
                } else {
                    userMarker.setPosition(newPos);
                }
                
                map.setCenter(newPos);
                
                if (typeof updateNavInfo === 'function') {
                    updateNavInfo(newPos);
                }
                
                if (typeof checkNearbyCrimes === 'function') {
                    checkNearbyCrimes(newPos);
                }
                
                simulationIndex++;
            } catch (intervalError) {
                console.error('Simulation error:', intervalError);
                stopSimulation();
            }
        }, 2000);
    } catch (error) {
        console.error('Failed to start simulation:', error);
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
    }
}

// Stop the simulation
function stopSimulation() {
    try {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        
        if (userMarker) {
            userMarker.setMap(null);
            userMarker = null;
        }
    } catch (error) {
        console.error('Error stopping simulation:', error);
        // Force cleanup
        simulationInterval = null;
        if (userMarker) {
            userMarker = null;
        }
    }
}