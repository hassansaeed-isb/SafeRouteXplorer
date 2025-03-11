/**
 * Simplified mobile navigation functionality for SafeRouteXplorer
 * Focus on location setting functionality
 */

// Initialize mobile navigation with simplified options
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

    // Simplified mobile bottom navigation - only with location button
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        // Clear existing buttons
        mobileNav.innerHTML = '';
        
        // Create a single centered location button
        const locationBtn = document.createElement('div');
        locationBtn.className = 'mobile-location-btn';
        locationBtn.innerHTML = `
            <div class="location-btn-inner">
                <i class="fas fa-map-marker-alt"></i>
                <span>Set Route</span>
            </div>
        `;
        locationBtn.addEventListener('click', function() {
            document.getElementById('set-location').click();
        });
        
        mobileNav.appendChild(locationBtn);
        
        // Style the button
        const style = document.createElement('style');
        style.textContent = `
            .mobile-nav {
                height: 60px;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            
            .mobile-location-btn {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 80%;
                max-width: 300px;
            }
            
            .location-btn-inner {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #3498db;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                width: 100%;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .location-btn-inner:active {
                transform: scale(0.95);
            }
            
            .location-btn-inner i {
                font-size: 16px;
                margin-right: 10px;
            }
            
            .location-btn-inner span {
                font-weight: 600;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    // Remove the FAB since we've simplified the bottom bar
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.style.display = 'none';
    }
    
    // Update responsive layout on resize
    window.addEventListener('resize', handleResponsiveLayout);
    handleResponsiveLayout();
    
    // Initial check for mobile view
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
}

// Handle responsive layout changes
function handleResponsiveLayout() {
    const isMobile = window.innerWidth <= 768;
    const routesContainer = document.getElementById('routes-container');
    const navInfo = document.getElementById('nav-info');
    
    if (isMobile) {
        routesContainer.style.bottom = '70px'; // Adjusted for simplified mobile nav
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
        // Adjust safest route indicator for visibility
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
    } else {
        // Show all content in route cards for desktop
        routeCards.forEach(card => {
            const paragraphs = card.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.display = 'block';
            });
        });
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
            const emphasis = document.createElement('em');
            emphasis.textContent = 'Safest Route';
            paragraph.appendChild(emphasis);
            card.appendChild(paragraph);
            safetyText = emphasis;
        }
        
        // Ensure it's visible and styled properly
        safetyText.parentElement.style.display = 'block';
    });
}

// Call this function when the app initializes
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the map to initialize
    setTimeout(initMobileNav, 500);
    
    // Call enhanceRouteCards after routes are loaded
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'routes-container') {
                enhanceRouteCards();
            }
        });
    });
    
    const config = { childList: true, subtree: true };
    observer.observe(document.getElementById('routes-container'), config);
});