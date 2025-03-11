/**
 * Simplified interface functionality for SafeRouteXplorer
 * New design without navigation bar, featuring SRX logo in the top right
 * and a centralized route display system
 */

// Initialize the simplified interface
function initSimplifiedInterface() {
    // Connect mobile set location button to the modal
    const mobileSetLocationBtn = document.getElementById('mobile-set-location');
    if (mobileSetLocationBtn) {
        mobileSetLocationBtn.addEventListener('click', () => {
            const setLocationBtn = document.getElementById('set-location');
            if (setLocationBtn) {
                setLocationBtn.click();
            }

// Add ripple effect to buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.set-location-btn, .control-btn, .modal .btn, #mobile-set-location');
    
    buttons.forEach(button => {
        button.classList.add('ripple-effect');
        
        button.addEventListener('mousedown', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            ripple.addEventListener('animationend', function() {
                ripple.remove();
            });
        });
    });
}

// Show a toast message
function showToast(message, duration = 3000) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.style.opacity = "1";
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the simplified interface
    setTimeout(initSimplifiedInterface, 500);
});
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
}

// Handle responsive layout adjustments
function handleResponsiveLayout() {
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
}

// Add Current Location button to the location modal
function addCurrentLocationToModal() {
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
            if (navigator.geolocation) {
                useCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                useCurrentLocationBtn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Reverse geocode to get address
                        const geocoder = new google.maps.Geocoder();
                        const latlng = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        geocoder.geocode({ 'location': latlng }, (results, status) => {
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
                        });
                    },
                    (error) => {
                        alert("Could not get your location: " + error.message);
                        useCurrentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                        useCurrentLocationBtn.disabled = false;
                    },
                    { timeout: 10000 }
                );
            } else {
                alert("Geolocation is not supported by your browser.");
                useCurrentLocationBtn.disabled = false;
            }
        });
    }
}

// Initialize route display enhancements
function initRouteDisplay() {
    // Enhance the location modal
    const modal = document.getElementById("location-modal");
    const locationBtns = document.querySelectorAll("#set-location, #mobile-set-location");
    const closeBtn = document.querySelector(".close-btn");
    
    if (!modal || !closeBtn) return;
    
    // Enhanced modal open animation
    locationBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                modal.style.display = "flex";
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            });
        }
    });

    // Modal close functions
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
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
            e.preventDefault();
            const startLocation = document.getElementById("start-location").value;
            const endLocation = document.getElementById("end-location").value;
            
            if (!startLocation || !endLocation) {
                alert("Please enter both start location and destination.");
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
                        if (document.body.contains(loadingIndicator)) {
                            document.body.removeChild(loadingIndicator);
                        }
                        // Call the display routes function (from routes.js)
                        if (typeof displayRoutes === 'function') {
                            displayRoutes(routes);
                        } else {
                            console.error("displayRoutes function not found");
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching routes:", error);
                        if (document.body.contains(loadingIndicator)) {
                            document.body.removeChild(loadingIndicator);
                        }
                        alert("Could not find routes. Please try again with different locations.");
                    });
            } else {
                console.error("fetchRoutes function not found");
                if (document.body.contains(loadingIndicator)) {
                    document.body.removeChild(loadingIndicator);
                }
                alert("Route finding functionality is not available.");
            }
                
            closeModal();
        });
    }
}