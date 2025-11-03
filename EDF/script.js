document.addEventListener('DOMContentLoaded', () => {
    // Select dynamic sidebar navigation links using the new generic class
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) {
        // console.warn("Scrollspy: No .sidebar-nav ul found. Script will not run.");
        return;
    }
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    // Select the main content area where the scrollable sections reside
    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) {
        // console.warn("Scrollspy: No .main-content-area found. Script will not run.");
        return;
    }

    // Select all elements with an 'id' that are either a <section> or have the .content-body class
    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) {
        // console.warn("Scrollspy: No scrollable sections/content-body divs with ID found. Script will not observe.");
        return;
    }

    // Get the effective height of your fixed header from CSS variable
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    
    // Define a buffer for the detection zone to give it a little more room
    const detectionBuffer = 10; // Pixels below the header for the detection line

    // Smooth scrolling for sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Instantly set active class on click for immediate feedback
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Scroll with offset for fixed header
                const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for active link highlighting
    const observerOptions = {
        root: null, // viewport
        rootMargin: `-${headerHeight + detectionBuffer}px 0px -50% 0px`, // More forgiving bottom margin
        threshold: [0, 0.5, 1] // Observe when 0%, 50%, or 100% of target is visible
    };
    
    const intersectionMap = new Map();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            intersectionMap.set(entry.target.id, entry.isIntersecting);
            // console.log(`${entry.target.id} intersecting: ${entry.isIntersecting}`);
        });

        let activeId = null;
        // Iterate through sections from top to bottom to find the topmost intersecting one
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (intersectionMap.get(section.id)) {
                const rect = section.getBoundingClientRect();
                // Ensure the section's top is actually within a reasonable range below the header
                // and it's not just barely peeking into the viewport from the bottom
                if (rect.top <= headerHeight + detectionBuffer + 50 && rect.bottom > 0) { 
                    activeId = section.id;
                    break; 
                }
            }
        }
        
        // --- NEW LOGIC: Check if scrolled to the very bottom ---
        // This is a common fallback for the last element
        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5; // -5px buffer
        if (isScrolledToBottom && sections.length > 0) {
            const lastSectionId = sections[sections.length - 1].id;
            // Only activate if the current active is not already the last, or if there's no active
            if (activeId !== lastSectionId) {
                activeId = lastSectionId;
                // console.log("Scrollspy: Forced last section active due to scroll to bottom.");
            }
        }


        // Fallback for very top of the page (before first section)
        if (!activeId && window.scrollY < headerHeight + 100 && sections.length > 0) {
            activeId = sections[0].id; // Activate the first link if near the top
            // console.log("Scrollspy: Forced first section active due to scroll to top.");
        }

        // Update active class if ID has changed or if it's currently null
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

    }, observerOptions);

    // Observe each relevant element for changes in visibility
    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial active state on page load and on resize
    const updateActiveLinkOnLoad = () => {
        let currentActiveElementId = null;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            // Check if element's top is just past the header, and its bottom is still visible
            if (rect.top <= headerHeight + detectionBuffer + 50 && rect.bottom > headerHeight + detectionBuffer + 50) { 
                currentActiveElementId = sections[i].id;
                break;
            }
        }

        navLinks.forEach(link => link.classList.remove('active'));
        if (currentActiveElementId) {
            const initialActiveLink = sidebarNavUl.querySelector(`a[href="#${currentActiveElementId}"]`);
            if (initialActiveLink) {
                initialActiveLink.classList.add('active');
            }
        } else if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
        }
    };

    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad);
    updateActiveLinkOnLoad(); // Run immediately for initial state
});
