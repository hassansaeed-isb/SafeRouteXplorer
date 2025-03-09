/**
 * Utility functions for SafeRouteXplorer
 */

// Calculate distance between two points using the Haversine formula
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Convert degrees to radians
function toRad(deg) {
    return deg * (Math.PI/180);
}

// Get appropriate color for danger index
function getDangerColor(severity) {
    if (severity >= 4) return "red";
    if (severity === 3) return "orange";
    if (severity === 2) return "yellow";
    return "green";
}