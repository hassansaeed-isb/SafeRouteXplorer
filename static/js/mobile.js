/**
 * Enhanced mobile navigation functionality for SafeRouteXplorer
 * With improved location setting and mobile view
 */

// Initialize mobile navigation
function initMobileNav() {
    // Add nav toggle functionality
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('nav');
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: none;
    `;
    document.body.appendChild(backdrop);

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('nav-active');
        nav.classList.toggle('active');
        if (nav.classList.contains('active')) {
            backdrop.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            backdrop.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    backdrop.addEventListener('click', () => {
        navToggle.classList.remove('nav-active');
        nav.classList.remove('active');
        backdrop.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Mobile bottom navigation buttons with improved highlighting
    const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
    mobileNavButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            mobileNavButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Execute the corresponding action
            const action = this.getAttribute('data-action');
            switch(action) {
                case 'location':
                    document.getElementById('set-location').click();
                    break;
                case 'start':
                    document.getElementById('start-nav').click();
                    break;
                case 'stop':
                    document.getElementById('stop-nav').click();
                    break;
                case 'alerts':
                    document.getElementById('enable-alerts').click();
                    break;
                case 'simulate':
                    document.getElementById('simulate-movement').click();
                    break;
            }
        });
    });

    // Highlight appropriate mobile nav button when desktop button is clicked
    document.getElementById('set-location').addEventListener('click', () => {
        highlightMobileButton('location');
    });
    
    document.getElementById('start-nav').addEventListener('click', () => {
        highlightMobileButton('start');
    });
    
    document.getElementById('stop-nav').addEventListener('click', () => {
        highlightMobileButton('stop');
    });
    
    document.getElementById('enable-alerts').addEventListener('click', () => {
        highlightMobileButton('alerts');
    });
    
    document.getElementById('simulate-movement').addEventListener('click', () => {
        highlightMobileButton('simulate');
    });

    // Handle FAB button for mobile
    const fab = document.querySelector('.fab');
    fab.addEventListener('click', () => {
        document.getElementById('set-location').click();
        highlightMobileButton('location');
    });

    // Update responsive layout on resize
    window.addEventListener('resize', handleResponsiveLayout);
    handleResponsiveLayout();
    
    // Initial check for mobile view
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    // Enhance location modal
    enhanceLocationModal();
}

// Helper function to highlight the correct mobile button
function highlightMobileButton(action) {
    const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
    mobileNavButtons.forEach(btn => {
        if (btn.getAttribute('data-action') === action) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Handle responsive layout changes
function handleResponsiveLayout() {
    const isMobile = window.innerWidth <= 768;
    const routesContainer = document.getElementById('routes-container');
    const navInfo = document.getElementById('nav-info');
    
    if (isMobile) {
        routesContainer.style.bottom = '75px'; // Increased to avoid overlap with mobile nav
        if (navInfo.style.display !== 'none') {
            navInfo.style.top = '80px';
        }
    } else {
        routesContainer.style.bottom = '30px';
        navInfo.style.top = '30px';
    }
}

// Check if in mobile view and apply specific adjustments
function checkMobileView() {
    const isMobile = window.innerWidth <= 768;
    const routeCards = document.querySelectorAll('.route-card');
    
    if (isMobile) {
        // Adjust mobile navigation spacing
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileNavBtns.forEach(btn => {
            btn.style.padding = '8px 0';
        });
        
        // Make location option more prominent
        const locationBtn = document.querySelector('.mobile-nav-btn[data-action="location"]');
        if (locationBtn) {
            locationBtn.style.color = '#3498db';
        }
        
        // Enhance safest route indicator for visibility
        const safestRoutes = document.querySelectorAll('.route-card.safest p em');
        safestRoutes.forEach(badge => {
            badge.style.display = 'inline-block';
            badge.style.background = '#3498db';
            badge.style.color = 'white';
            badge.style.padding = '3px 8px';
            badge.style.borderRadius = '20px';
            badge.style.marginTop = '2px';
        });
        
        // Limit content in route cards for mobile while ensuring key info is visible
        routeCards.forEach(card => {
            const paragraphs = card.querySelectorAll('p');
            
            // Always show first 3 paragraphs
            for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
                paragraphs[i].style.display = 'block';
            }
            
            // Hide remaining paragraphs
            if (paragraphs.length > 3) {
                for (let i = 3; i < paragraphs.length; i++) {
                    // Check if it contains "safest" text and keep it visible
                    if (paragraphs[i].innerHTML.toLowerCase().includes('safest')) {
                        paragraphs[i].style.display = 'block';
                    } else {
                        paragraphs[i].style.display = 'none';
                    }
                }
            }
        });
        
        // Adjust modal for better mobile experience
        const modal = document.getElementById('location-modal');
        if (modal) {
            modal.classList.add('mobile-view');
        }
    } else {
        // Show all content in route cards for desktop
        routeCards.forEach(card => {
            const paragraphs = card.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.display = 'block';
            });
        });
        
        // Remove mobile specific classes
        const modal = document.getElementById('location-modal');
        if (modal) {
            modal.classList.remove('mobile-view');
        }
    }
}

// Apply updates to route cards after they are created
function enhanceRouteCards() {
    const safestCards = document.querySelectorAll('.route-card.safest');
    safestCards.forEach(card => {
        // Find or create the safest route indicator
        let safetyText = card.querySelector('p em');
        if (!safetyText) {
            const paragraph = document.createElement('p');
            paragraph.style.display = 'block';
            paragraph.style.marginTop = '5px';
            
            const emphasis = document.createElement('em');
            emphasis.className = 'safest-badge';
            emphasis.textContent = 'Safest Route';
            
            // Apply direct styles to ensure visibility
            emphasis.style.color = 'white';
            emphasis.style.fontWeight = 'bold';
            emphasis.style.display = 'inline-block';
            emphasis.style.padding = '3px 8px';
            emphasis.style.background = '#3498db';
            emphasis.style.borderRadius = '20px';
            emphasis.style.fontSize = '0.8em';
            emphasis.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            
            paragraph.appendChild(emphasis);
            card.appendChild(paragraph);
            safetyText = emphasis;
        } else {
            // Add safest-badge class to existing element
            safetyText.classList.add('safest-badge');
            
            // Ensure it's visible with direct styles
            safetyText.style.color = 'white';
            safetyText.style.fontWeight = 'bold';
            safetyText.style.display = 'inline-block';
            safetyText.style.padding = '3px 8px';
            safetyText.style.background = '#3498db';
            safetyText.style.borderRadius = '20px';
            safetyText.style.fontSize = '0.8em';
            safetyText.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        }
        
        // Ensure it's visible and styled properly
        if (safetyText.parentElement) {
            safetyText.parentElement.style.display = 'block';
            safetyText.parentElement.style.marginTop = '5px';
        }
    });
}

// Enhance the location modal for better mobile experience
function enhanceLocationModal() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;
    
    // Add animation class
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Improve "Set Location" form appearance
    const form = document.getElementById('location-form');
    if (form) {
        // Add "Use Current Location" button if it doesn't exist yet
        if (!document.getElementById('use-current-location') && navigator.geolocation) {
            const startInputGroup = document.querySelector('.input-group');
            const useLocationBtn = document.createElement('button');
            useLocationBtn.id = 'use-current-location';
            useLocationBtn.type = 'button';
            useLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use my current location';
            
            useLocationBtn.addEventListener('click', function() {
                // Show loading indicator
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
                this.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const startInput = document.getElementById('start-location');
                        startInput.value = 'My Current Location';
                        startInput.dataset.lat = position.coords.latitude;
                        startInput.dataset.lng = position.coords.longitude;
                        
                        // Reset button
                        useLocationBtn.innerHTML = '<i class="fas fa-check"></i> Current location set';
                        useLocationBtn.style.backgroundColor = '#e8f5e9';
                        useLocationBtn.style.color = '#4CAF50';
                        useLocationBtn.style.borderColor = '#4CAF50';
                        
                        // Focus on destination input
                        document.getElementById('end-location').focus();
                        
                        setTimeout(() => {
                            useLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use my current location';
                            useLocationBtn.style.backgroundColor = '';
                            useLocationBtn.style.color = '';
                            useLocationBtn.style.borderColor = '';
                            useLocationBtn.disabled = false;
                        }, 3000);
                    },
                    (error) => {
                        // Handle error
                        useLocationBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Location error';
                        useLocationBtn.style.backgroundColor = '#ffebee';
                        useLocationBtn.style.color = '#f44336';
                        useLocationBtn.style.borderColor = '#f44336';
                        
                        setTimeout(() => {
                            useLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use my current location';
                            useLocationBtn.style.backgroundColor = '';
                            useLocationBtn.style.color = '';
                            useLocationBtn.style.borderColor = '';
                            useLocationBtn.disabled = false;
                        }, 3000);
                        
                        console.error('Geolocation error:', error);
                    }
                );
            });
            
            startInputGroup.appendChild(useLocationBtn);
        }
        
        // Add recent locations if supported
        if (window.localStorage) {
            try {
                // Autocomplete for recent destinations
                const endInput = document.getElementById('end-location');
                endInput.addEventListener('focus', function() {
                    const recentDestinations = JSON.parse(localStorage.getItem('recentDestinations') || '[]');
                    if (recentDestinations.length > 0) {
                        // Create datalist if it doesn't exist
                        let datalist = document.getElementById('recent-destinations');
                        if (!datalist) {
                            datalist = document.createElement('datalist');
                            datalist.id = 'recent-destinations';
                            document.body.appendChild(datalist);
                            endInput.setAttribute('list', 'recent-destinations');
                        }
                        
                        // Clear and repopulate datalist
                        datalist.innerHTML = '';
                        recentDestinations.forEach(dest => {
                            const option = document.createElement('option');
                            option.value = dest;
                            datalist.appendChild(option);
                        });
                    }
                });
                
                // Save destination to recent list on form submit
                form.addEventListener('submit', function() {
                    const destination = document.getElementById('end-location').value;
                    if (destination) {
                        try {
                            let recentDestinations = JSON.parse(localStorage.getItem('recentDestinations') || '[]');
                            // Add to beginning, remove duplicates, limit to 5
                            recentDestinations = [destination, ...recentDestinations.filter(d => d !== destination)].slice(0, 5);
                            localStorage.setItem('recentDestinations', JSON.stringify(recentDestinations));
                        } catch (e) {
                            console.error('Error saving recent destination:', e);
                        }
                    }
                });
            } catch (e) {
                console.error('Error with localStorage:', e);
            }
        }
    }
    
    // Make buttons more touch-friendly on mobile
    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.padding = '12px 20px';
        submitBtn.style.fontSize = '1em';
    }
}

// Call this function when the app initializes
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the map to initialize
    setTimeout(initMobileNav, 500);
    
    // Call enhanceRouteCards after routes are loaded
    // This should be called after routes are displayed
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'routes-container') {
                enhanceRouteCards();
            }
        });
    });
    
    const config = { childList: true, subtree: true };
    const routesContainer = document.getElementById('routes-container');
    if (routesContainer) {
        observer.observe(routesContainer, config);
    }
});