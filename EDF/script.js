document.addEventListener('DOMContentLoaded', () => {
    // Select dynamic sidebar navigation links using the new generic class
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    // Select the main content area where the scrollable sections reside
    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    // Select all elements with an 'id' that are either a <section> or have the .content-body class
    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    // Get the effective height of your fixed header from CSS variable
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    const detectionBuffer = 10; 

    // Helper function to update active link
    const setActiveLink = (id) => {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // Smooth scrolling for sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                setActiveLink(targetId); // Instantly set active class on click
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
        // This rootMargin creates a detection window that starts just below the header
        // and extends roughly halfway down the screen.
        rootMargin: `-${headerHeight + detectionBuffer}px 0px -50% 0px`, 
        threshold: 0 // Observe as soon as any part of the target enters the rootMargin
    };
    
    // We'll use a single observer and process entries to find the correct active element
    const observer = new IntersectionObserver((entries) => {
        let currentActiveIdFromObserver = null;
        
        // Filter for currently intersecting entries
        const intersecting = entries.filter(entry => entry.isIntersecting);

        if (intersecting.length > 0) {
            // Sort intersecting entries by their position (topmost first)
            intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            currentActiveIdFromObserver = intersecting[0].target.id;
        }

        // --- Master Decision Logic for activeId ---
        let finalActiveId = null;

        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5; 
        
        if (isScrolledToBottom && sections.length > 0) {
            // If at the very bottom, the last section is always the active one.
            finalActiveId = sections[sections.length - 1].id;
        } else if (currentActiveIdFromObserver) {
            // Otherwise, use what the observer determined as the topmost intersecting element.
            finalActiveId = currentActiveIdFromObserver;
        } else if (window.scrollY < headerHeight + 100 && sections.length > 0) {
            // Fallback for very top of the page (before first section)
            finalActiveId = sections[0].id;
        }

        // Apply the final determined active ID
        if (finalActiveId) {
            setActiveLink(finalActiveId);
        } else {
            // If no active section found (e.g., empty page or weird state), deactivate all
            navLinks.forEach(link => link.classList.remove('active'));
        }

    }, observerOptions);

    // Observe each relevant element for changes in visibility
    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial active state on page load and on resize
    const updateActiveLinkOnLoad = () => {
        let initialActiveId = null;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            // Check if element's top is just past the header, and its bottom is still visible
            if (rect.top <= headerHeight + detectionBuffer + 50 && rect.bottom > headerHeight + detectionBuffer + 50) { 
                initialActiveId = sections[i].id;
                break;
            }
        }
        
        // Prioritize last element if page loads at the bottom
        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5;
        if (isScrolledToBottom && sections.length > 0) {
            initialActiveId = sections[sections.length - 1].id;
        }
        
        if (initialActiveId) {
            setActiveLink(initialActiveId);
        } else if (sections.length > 0) {
            // Default to first link if no specific section is in view on load
            setActiveLink(sections[0].id);
        }
    };

    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad);
    updateActiveLinkOnLoad(); // Run immediately for initial state
});
