/**
 * Notification system for SafeRouteXplorer
 */

// Set to track already notified danger points
let notifiedCrimes = new Set();

// Display notification with message
function showNotification(message) {
    try {
        const alertSound = document.getElementById("alertSound");
        if (alertSound) {
            alertSound.currentTime = 0; // Reset playback
            alertSound.play().catch(err => console.log("Sound playback error:", err));
        }
        
        const notif = document.getElementById("notification");
        if (notif) {
            notif.innerHTML = message;
            notif.style.display = "block";
            
            setTimeout(() => {
                if (notif) {
                    notif.style.display = "none";
                }
            }, 5000);
        } else {
            console.warn("Notification element not found");
        }
    } catch (error) {
        console.error("Error showing notification:", error);
        // Fallback to alert if notification system fails
        alert(message);
    }
}

// Check for nearby danger points and trigger notifications
function checkNearbyCrimes(currentPos) {
    try {
        if (!dangerPointsData || dangerPointsData.length === 0) return;
        
        if (!currentPos || typeof currentPos.lat !== 'function' || typeof currentPos.lng !== 'function') {
            console.error("Invalid current position object");
            return;
        }
        
        dangerPointsData.forEach(dp => {
            try {
                // Validate danger point data
                if (!dp || dp.lat == null || dp.lng == null) {
                    console.warn("Invalid danger point data:", dp);
                    return;
                }
                
                // Ensure coordinates are numbers
                const dpLat = parseFloat(dp.lat);
                const dpLng = parseFloat(dp.lng);
                
                if (isNaN(dpLat) || isNaN(dpLng)) {
                    console.warn("Invalid coordinates for danger point:", dp);
                    return;
                }
                
                if (typeof haversine !== 'function') {
                    console.error("Haversine function not available");
                    return;
                }
                
                const distance = haversine(currentPos.lat(), currentPos.lng(), dpLat, dpLng);
                const dpKey = `${dpLat}_${dpLng}`;
                
                console.log(`Distance to ${dp.name || 'Unknown'}: ${distance.toFixed(2)} km`);
                
                // Only trigger if distance is within 2 km and not nearly zero (to avoid false alerts at start)
                if (distance <= 2 && distance > 0.1) {
                    if (!notifiedCrimes.has(dpKey)) {
                        notifiedCrimes.add(dpKey);
                        const alertMessage = `Safety Alert: ${dp.name || 'Incident'} reported near ${dp.area || 'your location'}. Distance: ${distance.toFixed(2)} km.`;
                        showNotification(alertMessage);
                        console.log(`Alert triggered for ${dp.name || 'Unknown incident'}`);
                    }
                } else {
                    // If outside range, remove from alerted set
                    if (notifiedCrimes.has(dpKey)) {
                        notifiedCrimes.delete(dpKey);
                        console.log(`Removed ${dp.name || 'Unknown'} from notified list (distance: ${distance.toFixed(2)} km)`);
                    }
                }
            } catch (error) {
                console.error("Error processing danger point:", error, dp);
            }
        });
    } catch (error) {
        console.error("Error checking nearby crimes:", error);
    }
}

// Reset notifications system
function resetNotifications() {
    try {
        notifiedCrimes.clear();
    } catch (error) {
        console.error("Error resetting notifications:", error);
        // Recreate set if clearing fails
        notifiedCrimes = new Set();
    }
}