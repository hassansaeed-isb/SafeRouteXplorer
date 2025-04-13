/**
 * Google Maps Places Autocomplete integration for SafeRouteXplorer
 * Adds location search suggestions to origin and destination inputs
 */

// Initialize Google Places Autocomplete for location inputs
function initPlacesAutocomplete() {
    // Check if Google Maps API and Places library are available
    if (typeof google === 'undefined' || typeof google.maps === 'undefined' || 
        typeof google.maps.places === 'undefined') {
        console.error('Google Maps Places API not loaded. Cannot initialize autocomplete.');
        return;
    }

    // Get input elements
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');
    
    if (!startLocationInput || !endLocationInput) {
        console.warn('Location input fields not found in the DOM.');
        return;
    }

    // Create autocomplete objects with options
    const autocompleteOptions = {
        types: ['geocode', 'establishment'], // Return both addresses and places
        fields: ['place_id', 'geometry', 'formatted_address', 'name']
    };

    const startAutocomplete = new google.maps.places.Autocomplete(startLocationInput, autocompleteOptions);
    const endAutocomplete = new google.maps.places.Autocomplete(endLocationInput, autocompleteOptions);

    // Prevent form submission when pressing Enter in the inputs
    startLocationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !startAutocomplete.getPlace()) {
            e.preventDefault();
        }
    });

    endLocationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !endAutocomplete.getPlace()) {
            e.preventDefault();
        }
    });

    // Optional: Bias the results toward the current map viewport
    if (window.map) {
        startAutocomplete.bindTo('bounds', window.map);
        endAutocomplete.bindTo('bounds', window.map);
    }

    // Handle place selection
    startAutocomplete.addListener('place_changed', function() {
        const place = startAutocomplete.getPlace();
        if (!place.geometry) {
            // User entered a name that was not selected from the dropdown
            return;
        }
        
        // If there's a map, you can center it on the selected location
        if (window.map && place.geometry.location) {
            window.map.setCenter(place.geometry.location);
            window.map.setZoom(13);
        }
        
        // Update the input with the formatted address
        startLocationInput.value = place.formatted_address || place.name;
    });

    endAutocomplete.addListener('place_changed', function() {
        const place = endAutocomplete.getPlace();
        if (!place.geometry) {
            // User entered a name that was not selected from the dropdown
            return;
        }
        
        // Update the input with the formatted address
        endLocationInput.value = place.formatted_address || place.name;
    });
    
    console.log('Places Autocomplete initialized successfully');
}

// Add CSS for autocomplete dropdown styling
function addAutocompleteStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Google Places Autocomplete dropdown styling */
        .pac-container {
            border-radius: 8px;
            margin-top: 5px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border: 1px solid #eaeaea;
            font-family: inherit;
            z-index: 10000 !important;
        }
        
        .pac-item {
            padding: 8px 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .pac-item:hover {
            background-color: #f5f5f5;
        }
        
        .pac-item-selected {
            background-color: #f0f8ff;
        }
        
        .pac-icon {
            margin-right: 10px;
        }
        
        .pac-item-query {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        
        .pac-matched {
            font-weight: 700;
        }
        
        .pac-secondary-text {
            font-size: 12px;
            color: #777;
        }
        
        /* Make sure autocomplete appears above modal */
        .modal {
            z-index: 9999 !important;
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize autocomplete when the app loads
function initAutocompleteFeature() {
    // Add the CSS styles first
    addAutocompleteStyles();
    
    // If Google Maps is already loaded, initialize autocomplete
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
        typeof google.maps.places !== 'undefined') {
        initPlacesAutocomplete();
    } else {
        // Wait for Google Maps to load
        const checkGoogleMapsLoaded = setInterval(function() {
            if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
                typeof google.maps.places !== 'undefined') {
                clearInterval(checkGoogleMapsLoaded);
                initPlacesAutocomplete();
            }
        }, 100);
        
        // Set a timeout to stop checking after 10 seconds
        setTimeout(function() {
            clearInterval(checkGoogleMapsLoaded);
            console.warn('Google Maps Places API did not load within the timeout period.');
        }, 10000);
    }
}

// Call the initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure other scripts have initialized
    setTimeout(initAutocompleteFeature, 1000);
});

// Also initialize when app.js runs initApp()
if (typeof window.initApp === 'function') {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        originalInitApp();
        initAutocompleteFeature();
    };
} else {
    console.warn('window.initApp function not found for hooking.');
}