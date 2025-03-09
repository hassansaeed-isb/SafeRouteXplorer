/**
 * Notification system for SafeRouteXplorer
 */

// Set to track already notified danger points
let notifiedCrimes = new Set();

// Display notification with message
function showNotification(message) {
    const alertSound = document.getElementById("alertSound");
    if (alertSound) {
        alertSound.currentTime = 0; // Reset playback
        alertSound.play().catch(err => console.log("Sound playback error:", err));
    }
    
    const notif = document.getElementById("notification");
    notif.innerHTML = message;
    notif.style.display = "block";
    
    setTimeout(() => {
        notif.style.display = "none";
    }, 5000);
}

// Check for nearby danger points and trigger notifications
function checkNearbyCrimes(currentPos) {
    if (!dangerPointsData || dangerPointsData.length === 0) return;
    
    dangerPointsData.forEach(dp => {
        // Ensure coordinates are numbers
        const dpLat = parseFloat(dp.lat);
        const dpLng = parseFloat(dp.lng);
        const distance = haversine(currentPos.lat(), currentPos.lng(), dpLat, dpLng);
        const dpKey = `${dpLat}_${dpLng}`;
        
        console.log(`Distance to ${dp.name}: ${distance.toFixed(2)} km`);
        
        // Only trigger if distance is within 2 km and not nearly zero (to avoid false alerts at start)
        if (distance <= 2 && distance > 0.1) {
            if (!notifiedCrimes.has(dpKey)) {
                notifiedCrimes.add(dpKey);
                showNotification(`Safety Alert: ${dp.name} reported near ${dp.area}. Distance: ${distance.toFixed(2)} km.`);
                console.log(`Alert triggered for ${dp.name}`);
            }
        } else {
            // If outside range, remove from alerted set
            if (notifiedCrimes.has(dpKey)) {
                notifiedCrimes.delete(dpKey);
                console.log(`Removed ${dp.name} from notified list (distance: ${distance.toFixed(2)} km)`);
            }
        }
    });
}

// Reset notifications system
function resetNotifications() {
    notifiedCrimes.clear();
}