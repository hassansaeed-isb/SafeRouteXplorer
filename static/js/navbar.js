/**
 * Simplified interface functionality for SafeRouteXplorer
 * New design without navigation bar, featuring SRX logo in the top right
 * and a centralized route display system
 */

// Initialize the simplified interface
function initSimplifiedInterface() {
    try {
        // Connect mobile set location button to the modal
        const mobileSetLocationBtn = document.getElementById('mobile-set-location');
        if (mobileSetLocationBtn) {
            mobileSetLocationBtn.addEventListener('click', () => {
                try {
                    const setLocationBtn = document.getElementById('set-location');
                    if (setLocationBtn) {
                        setLocationBtn.click();
                    }
                } catch (error) {
                    console.error('Error clicking set location button:', error);
                }
            });
        }
        
        // Handle responsive layout
        window.addEventListener('resize', handleResponsiveLayout);
        handleResponsiveLayout();
        
        // Add Current Location button to location modal
        addCurrentLocationToModal();
        
        // Initialize route display enhancements
        initRouteDisplay();
        
        // Add ripple effect to buttons
        addRippleEffect();
    } catch (error) {
        console.error('Error initializing simplified interface:', error);
        showToast('Failed to initialize interface. Please refresh the page.', 5000);
    }
}

// Add ripple effect to buttons
function addRippleEffect() {
    try {
        const buttons = document.querySelectorAll('.set-location-btn, .control-btn, .modal .btn, #mobile-set-location');
        
        buttons.forEach(button => {
            try {
                button.classList.add('ripple-effect');
                
                button.addEventListener('mousedown', function(e) {
                    try {
                        const ripple = document.createElement('span');
                        ripple.classList.add('ripple');
                        this.appendChild(ripple);
                        
                        const rect = button.getBoundingClientRect();
                        const size = Math.max(rect.width, rect.height);
                        
                        ripple.style.width = ripple.style.height = `${size}px`;
                        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
                        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
                        
                        ripple.addEventListener('animationend', function() {
                            try {
                                if (ripple.parentNode) {
                                    ripple.remove();
                                }
                            } catch (error) {
                                console.error('Error removing ripple element:', error);
                            }
                        });
                    } catch (error) {
                        console.error('Error creating ripple effect:', error);
                    }
                });
            } catch (error) {
                console.error('Error adding ripple effect to button:', error);
            }
        });
    } catch (error) {
        console.error('Error initializing ripple effects:', error);
    }
}

// Show a toast message
function showToast(message, duration = 3000) {
    try {
        // Remove any existing toasts
        const existingToast = document.querySelector('.toast-message');
        if (existingToast && document.body.contains(existingToast)) {
            document.body.removeChild(existingToast);
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Fade in
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = "1";
            }
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = "0";
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    } catch (error) {
        console.error('Error showing toast message:', error);
        // Fallback to alert if toast fails
        alert(message);
    }
}

// Handle responsive layout adjustments
function handleResponsiveLayout() {
    try {
        const isMobile = window.innerWidth <= 768;
        const routesContainer = document.getElementById('routes-container');
        const navInfo = document.getElementById('nav-info');
        const mapControls = document.querySelector('.map-controls');
        
        if (isMobile) {
            // Adjust for mobile
            if (routesContainer) {
                routesContainer.style.bottom = '80px';
                routesContainer.style.padding = '12px';
            }
            
            if (navInfo && navInfo.style.display !== 'none') {
                navInfo.style.top = '70px';
            }
            
            if (mapControls) {
                mapControls.style.flexDirection = 'row';
                mapControls.style.bottom = '100px';
                mapControls.style.top = 'auto';
                mapControls.style.right = '20px';
                mapControls.style.transform = 'none';
            }
        } else {
            // Adjust for desktop
            if (routesContainer) {
                routesContainer.style.bottom = '25px';
                routesContainer.style.padding = '15px';
            }
            
            if (navInfo) {
                navInfo.style.top = '80px';
            }
            
            if (mapControls) {
                mapControls.style.flexDirection = 'column';
                mapControls.style.top = '50%';
                mapControls.style.right = '20px';
                mapControls.style.bottom = 'auto';
                mapControls.style.transform = 'translateY(-50%)';
            }
        }
    } catch (error) {
        console.error('Error handling responsive layout:', error);
    }
}

// Add Current Location button to the location modal
function addCurrentLocationToModal() {
    try {
        const startLocationInput = document.getElementById("start-location");
        if (!startLocationInput) return;
        
        // Create button if it doesn't exist
        if (!document.getElementById('use-current-location')) {
            const useCurrentLocationBtn = document.createElement('button');
            useCurrentLocationBtn.id = 'use-current-location';
            useCurrentLocationBtn.type = 'button';
            useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
            
            // Insert after start location input
            startLocationInput.parentNode.insertBefore(useCurrentLocationBtn, startLocationInput.nextSibling);
            
            // Functionality for current location button
            useCurrentLocationBtn.addEventListener('click', () => {
                try {
                    if (navigator.geolocation) {
                        useCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                        useCurrentLocationBtn.disabled = true;
                        
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                try {
                                    // Check if Google Maps is available
                                    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
                                        // Fallback to coordinates if geocoding not available
                                        startLocationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                                        useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                        useCurrentLocationBtn.disabled = false;
                                        return;
                                    }
                                    
                                    // Reverse geocode to get address
                                    const geocoder = new google.maps.Geocoder();
                                    const latlng = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    };
                                    
                                    geocoder.geocode({ 'location': latlng }, (results, status) => {
                                        try {
                                            if (status === 'OK') {
                                                if (results[0]) {
                                                    startLocationInput.value = results[0].formatted_address;
                                                } else {
                                                    startLocationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                                                }
                                            } else {
                                                startLocationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                                            }
                                            
                                            useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                            useCurrentLocationBtn.disabled = false;
                                        } catch (error) {
                                            console.error('Error in geocoding callback:', error);
                                            startLocationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                                            useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                            useCurrentLocationBtn.disabled = false;
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error processing location:', error);
                                    startLocationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                                    useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                    useCurrentLocationBtn.disabled = false;
                                }
                            },
                            (error) => {
                                console.error('Geolocation error:', error);
                                let errorMessage = "Could not get your location";
                                switch(error.code) {
                                    case error.PERMISSION_DENIED:
                                        errorMessage += ": Permission denied";
                                        break;
                                    case error.POSITION_UNAVAILABLE:
                                        errorMessage += ": Position unavailable";
                                        break;
                                    case error.TIMEOUT:
                                        errorMessage += ": Request timeout";
                                        break;
                                    default:
                                        errorMessage += ": " + error.message;
                                        break;
                                }
                                showToast(errorMessage, 4000);
                                useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                useCurrentLocationBtn.disabled = false;
                            },
                            { timeout: 10000 }
                        );
                    } else {
                        showToast("Geolocation is not supported by your browser", 4000);
                        useCurrentLocationBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('Error in current location handler:', error);
                    showToast("Error accessing location services", 4000);
                    useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                    useCurrentLocationBtn.disabled = false;
                }
            });
        }
    } catch (error) {
        console.error('Error adding current location to modal:', error);
    }
}

// Initialize route display enhancements
function initRouteDisplay() {
    try {
        // Enhance the location modal
        const modal = document.getElementById("location-modal");
        const locationBtns = document.querySelectorAll("#set-location, #mobile-set-location");
        const closeBtn = document.querySelector(".close-btn");
        
        if (!modal || !closeBtn) {
            console.warn('Modal or close button not found');
            return;
        }
        
        // Enhanced modal open animation
        locationBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener("click", () => {
                    try {
                        modal.style.display = "flex";
                        setTimeout(() => {
                            modal.classList.add('active');
                        }, 10);
                    } catch (error) {
                        console.error('Error opening modal:', error);
                    }
                });
            }
        });

        // Modal close functions
        function closeModal() {
            try {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = "none";
                }, 300);
            } catch (error) {
                console.error('Error closing modal:', error);
                // Force close as fallback
                modal.style.display = "none";
            }
        }

        closeBtn.addEventListener("click", closeModal);

        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Override the form submission to use our enhanced version
        const locationForm = document.getElementById("location-form");
        if (locationForm) {
            locationForm.addEventListener("submit", (e) => {
                try {
                    e.preventDefault();
                    const startLocationInput = document.getElementById("start-location");
                    const endLocationInput = document.getElementById("end-location");
                    
                    if (!startLocationInput || !endLocationInput) {
                        showToast("Location input fields not found", 4000);
                        return;
                    }
                    
                    const startLocation = startLocationInput.value.trim();
                    const endLocation = endLocationInput.value.trim();
                    
                    if (!startLocation || !endLocation) {
                        showToast("Please enter both start location and destination", 4000);
                        return;
                    }
                    
                    const routeDisplay = document.querySelector(".safest-route-display h3");
                    if (routeDisplay) {
                        routeDisplay.textContent = `Safest Route from ${startLocation} to ${endLocation}`;
                    }
                    
                    // Update the global currentDestination variable
                    if (window.currentDestination !== undefined) {
                        window.currentDestination = endLocation;
                    }
                    
                    // Show loading indicator
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'loading-indicator';
                    loadingIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Finding safe routes...';
                    document.body.appendChild(loadingIndicator);
                    
                    // Use the global fetchRoutes function 
                    if (typeof fetchRoutes === 'function') {
                        fetchRoutes(startLocation, endLocation)
                            .then(routes => {
                                try {
                                    if (document.body.contains(loadingIndicator)) {
                                        document.body.removeChild(loadingIndicator);
                                    }
                                    // Call the display routes function (from routes.js)
                                    if (typeof displayRoutes === 'function') {
                                        displayRoutes(routes);
                                    } else {
                                        console.error("displayRoutes function not found");
                                        showToast("Could not display routes. Please refresh the page.", 5000);
                                    }
                                } catch (error) {
                                    console.error("Error processing routes:", error);
                                    if (document.body.contains(loadingIndicator)) {
                                        document.body.removeChild(loadingIndicator);
                                    }
                                    showToast("Error processing routes. Please try again.", 5000);
                                }
                            })
                            .catch(error => {
                                console.error("Error fetching routes:", error);
                                if (document.body.contains(loadingIndicator)) {
                                    document.body.removeChild(loadingIndicator);
                                }
                                showToast("Could not find routes. Please try again with different locations.", 5000);
                            });
                    } else {
                        console.error("fetchRoutes function not found");
                        if (document.body.contains(loadingIndicator)) {
                            document.body.removeChild(loadingIndicator);
                        }
                        showToast("Route finding functionality is not available. Please refresh the page.", 5000);
                    }
                        
                    closeModal();
                } catch (error) {
                    console.error('Error in form submission:', error);
                    showToast("Error submitting form. Please try again.", 5000);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing route display:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize the simplified interface
        setTimeout(initSimplifiedInterface, 500);
    } catch (error) {
        console.error('Error during DOM initialization:', error);
        // Fallback initialization without delay
        try {
            initSimplifiedInterface();
        } catch (fallbackError) {
            console.error('Fallback initialization also failed:', fallbackError);
        }
    }
});