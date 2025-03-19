/**
 * Enhanced mobile navigation fix for SafeRouteXplorer
 * Fixes issues with mobile "Set Route" button functionality
 */

// Fix for mobile "Set Route" button issue
function fixMobileSetRouteButton() {
    // Get the mobile set location button
    const mobileSetLocationBtn = document.getElementById('mobile-set-location');
    const modal = document.getElementById('location-modal');
    
    if (mobileSetLocationBtn) {
        // Clear any existing event listeners by cloning and replacing the element
        const newBtn = mobileSetLocationBtn.cloneNode(true);
        mobileSetLocationBtn.parentNode.replaceChild(newBtn, mobileSetLocationBtn);
        
        // Add new event listener
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show the modal
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            }
            
            // Log to verify click is working
            console.log('Mobile set route button clicked');
        });
        
        // Add visible active state for touchscreen feedback
        newBtn.addEventListener('touchstart', function() {
            this.classList.add('button-active');
        });
        
        newBtn.addEventListener('touchend', function() {
            this.classList.remove('button-active');
        });
    }
    
    // Fix z-index issues that might be preventing clicks
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        mobileNav.style.zIndex = '1000';
    }
    
    const mobileSetRoute = document.querySelector('.mobile-set-route');
    if (mobileSetRoute) {
        mobileSetRoute.style.zIndex = '1000';
    }
}

// Fix for mobile modal
function fixMobileModal() {
    const modal = document.getElementById('location-modal');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    
    if (modal && closeBtn) {
        // Ensure close button works properly on mobile
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
        
        // Enhanced modal close function
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        // Prevent modal from closing when clicking inside the modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

// Apply mobile-specific CSS fixes
function applyMobileCSSFixes() {
    const style = document.createElement('style');
    style.textContent = `
        /* Mobile button active state for touch feedback */
        .button-active {
            transform: scale(0.95) !important;
            background: #2980b9 !important;
        }
        
        /* Enhanced z-index for mobile buttons */
        .mobile-set-route {
            z-index: 1000 !important;
            bottom: 25px !important;
        }
        
        .mobile-set-route button {
            width: 100% !important;
            padding: 12px 0 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
            position: relative !important;
        }
        
        /* Improved tap target size */
        @media (max-width: 768px) {
            .mobile-set-route button {
                padding: 15px 0 !important;
                min-height: 50px !important;
            }
            
            .modal-content {
                padding-bottom: 30px !important;
            }
            
            .close-btn {
                font-size: 30px !important;
                padding: 10px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize and run all the fixes
function initMobileFixes() {
    console.log('Initializing mobile fixes...');
    
    // Apply all fixes
    fixMobileSetRouteButton();
    fixMobileModal();
    applyMobileCSSFixes();
    
    // Also fix event delegation for the actual modal's Set Location button
    const setLocationBtn = document.getElementById('set-location');
    if (setLocationBtn) {
        setLocationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const modal = document.getElementById('location-modal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            }
        });
    }
    
    console.log('Mobile fixes applied');
}

// Run fixes when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for other scripts to initialize
    setTimeout(initMobileFixes, 1000);
});

// Also run fixes when window is resized to mobile dimensions
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        initMobileFixes();
    }
});

// Run immediately if the page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initMobileFixes, 1000);
}