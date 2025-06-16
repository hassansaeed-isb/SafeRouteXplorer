/**
 * Google Maps Places Autocomplete integration for SafeRouteXplorer
 * Adds location search suggestions to origin and destination inputs
 */

// Initialize Google Places Autocomplete for location inputs
function initPlacesAutocomplete() {
    try {
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
            try {
                if (e.key === 'Enter' && !e.shiftKey && !startAutocomplete.getPlace()) {
                    e.preventDefault();
                }
            } catch (error) {
                console.warn('Error in start location keydown handler:', error);
                e.preventDefault(); // Prevent form submission as fallback
            }
        });

        endLocationInput.addEventListener('keydown', function(e) {
            try {
                if (e.key === 'Enter' && !e.shiftKey && !endAutocomplete.getPlace()) {
                    e.preventDefault();
                }
            } catch (error) {
                console.warn('Error in end location keydown handler:', error);
                e.preventDefault(); // Prevent form submission as fallback
            }
        });

        // Optional: Bias the results toward the current map viewport
        try {
            if (window.map) {
                startAutocomplete.bindTo('bounds', window.map);
                endAutocomplete.bindTo('bounds', window.map);
            }
        } catch (error) {
            console.warn('Error binding autocomplete to map bounds:', error);
            // Continue without bounds binding - not critical for functionality
        }

        // Handle place selection
        startAutocomplete.addListener('place_changed', function() {
            try {
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
            } catch (error) {
                console.error('Error handling start location place selection:', error);
                // Keep the user's input as fallback
            }
        });

        endAutocomplete.addListener('place_changed', function() {
            try {
                const place = endAutocomplete.getPlace();
                if (!place.geometry) {
                    // User entered a name that was not selected from the dropdown
                    return;
                }
                
                // Update the input with the formatted address
                endLocationInput.value = place.formatted_address || place.name;
            } catch (error) {
                console.error('Error handling end location place selection:', error);
                // Keep the user's input as fallback
            }
        });
        
        console.log('Places Autocomplete initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Places Autocomplete:', error);
        // Graceful degradation - app continues to work without autocomplete
    }
}

// Add CSS for autocomplete dropdown styling
function addAutocompleteStyles() {
    try {
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
    } catch (error) {
        console.warn('Failed to add autocomplete styles:', error);
        // Continue without custom styles - functionality still works
    }
}

// Initialize autocomplete when the app loads
function initAutocompleteFeature() {
    try {
        // Add the CSS styles first
        addAutocompleteStyles();
        
        // If Google Maps is already loaded, initialize autocomplete
        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
            typeof google.maps.places !== 'undefined') {
            initPlacesAutocomplete();
        } else {
            // Wait for Google Maps to load
            const checkGoogleMapsLoaded = setInterval(function() {
                try {
                    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
                        typeof google.maps.places !== 'undefined') {
                        clearInterval(checkGoogleMapsLoaded);
                        initPlacesAutocomplete();
                    }
                } catch (error) {
                    console.error('Error checking Google Maps availability:', error);
                    clearInterval(checkGoogleMapsLoaded);
                }
            }, 100);
            
            // Set a timeout to stop checking after 10 seconds
            setTimeout(function() {
                clearInterval(checkGoogleMapsLoaded);
                console.warn('Google Maps Places API did not load within the timeout period.');
            }, 10000);
        }
    } catch (error) {
        console.error('Failed to initialize autocomplete feature:', error);
        // App continues to work without autocomplete functionality
    }
}

// Call the initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Wait a short time to ensure other scripts have initialized
        setTimeout(initAutocompleteFeature, 1000);
    } catch (error) {
        console.error('Error setting up autocomplete initialization:', error);
    }
});

// Also initialize when app.js runs initApp()
try {
    if (typeof window.initApp === 'function') {
        const originalInitApp = window.initApp;
        window.initApp = function() {
            try {
                originalInitApp();
                initAutocompleteFeature();
            } catch (error) {
                console.error('Error in enhanced initApp function:', error);
                // Try to run original initApp even if autocomplete fails
                try {
                    originalInitApp();
                } catch (originalError) {
                    console.error('Error in original initApp function:', originalError);
                }
            }
        };
    } else {
        console.warn('window.initApp function not found for hooking.');
    }
} catch (error) {
    console.error('Error setting up initApp hook:', error);
}