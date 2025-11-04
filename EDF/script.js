document.addEventListener('DOMContentLoaded', () => {
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    
    // --- NEW: Detection line exact position ---
    // This defines the exact pixel line where an element should become active.
    // It's headerHeight + a small buffer (e.g., 5px)
    const detectionLineOffset = headerHeight + 5; 

    let isScrollingFromClick = false;
    let scrollTimeout; // Defined outside for global access within handler
    const scrollEndDelay = 150; // Reduced delay for faster reset

    const setActiveLink = (id) => {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                if (!link.classList.contains('active')) { // Only update if not already active
                    link.classList.add('active');
                }
            } else {
                if (link.classList.contains('active')) { // Only update if currently active
                    link.classList.remove('active');
                }
            }
        });
    };

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                isScrollingFromClick = true; 
                setActiveLink(targetId); // Instantly set active class on click

                const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // --- Refined scroll end detection ---
                const handleScroll = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        isScrollingFromClick = false;
                        // Force an immediate re-evaluation by the observer after scroll ends
                        observer.takeRecords(); 
                        // Since `takeRecords` doesn't *always* trigger the callback if no change,
                        // we can manually call the logic to ensure a refresh.
                        updateActiveState(); 
                        window.removeEventListener('scroll', handleScroll);
                    }, scrollEndDelay);
                };
                window.addEventListener('scroll', handleScroll);
            }
        });
    });

    // --- NEW: Intersection Observer for a very narrow detection line ---
    const observerOptions = {
        root: null, // viewport
        // This creates a 1px high horizontal line for detection.
        // The top of the rootMargin is 'detectionLineOffset' pixels down from the viewport top.
        // The bottom of the rootMargin is 'viewportHeight - detectionLineOffset - 1px' up from viewport bottom.
        // Effectively, the intersection detection area is a 1px high line.
        rootMargin: `-${detectionLineOffset}px 0px ${-(window.innerHeight - detectionLineOffset - 1)}px 0px`, 
        threshold: 0 // Observe as soon as any part of the target enters this 1px line
    };
    
    let activeObserverSectionId = null; // Store the ID that the observer *wants* to be active

    const observer = new IntersectionObserver((entries) => {
        // Collect all currently intersecting entries. With a 1px rootMargin, there should ideally only be one or zero.
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
            // Sort to ensure we get the topmost one if by chance multiple intersect the 1px line
            intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            activeObserverSectionId = intersectingEntries[0].target.id;
        } else {
            activeObserverSectionId = null; // No section is currently crossing the detection line
        }

        // Only update the active state if not scrolling from a click
        if (!isScrollingFromClick) {
            updateActiveState();
        }

    }, observerOptions);

    // --- NEW: Centralized function to determine and apply active state ---
    const updateActiveState = () => {
        let finalActiveId = null;
        const currentScrollY = window.scrollY;

        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5; 
        
        if (isScrolledToBottom && sections.length > 0) {
            finalActiveId = sections[sections.length - 1].id;
        } else if (activeObserverSectionId) {
            // Use the ID determined by the IntersectionObserver
            finalActiveId = activeObserverSectionId;
        } else if (currentScrollY < headerHeight + 100 && sections.length > 0) {
            // Fallback for very top of the page (before first section)
            finalActiveId = sections[0].id;
        }

        if (finalActiveId) {
            setActiveLink(finalActiveId);
        } else {
            navLinks.forEach(link => link.classList.remove('active'));
        }
    };


    // Observe each relevant element for changes in visibility
    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial active state on page load and on resize
    const updateActiveLinkOnLoad = () => {
        let initialActiveId = null;
        const currentScrollY = window.scrollY;

        // Check for intersection based on the detection line
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            // If the section's top is past the detection line and still visible
            if (rect.top <= detectionLineOffset && rect.bottom > 0) { 
                initialActiveId = sections[i].id;
                break;
            }
        }
        
        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5;
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
    window.addEventListener('resize', () => {
        // Recalculate rootMargin on resize to adjust the detection line
        observer.disconnect();
        observerOptions.rootMargin = `-${detectionLineOffset}px 0px ${-(window.innerHeight - detectionLineOffset - 1)}px 0px`;
        sections.forEach(section => observer.observe(section));
        updateActiveLinkOnLoad(); // Also re-evaluate active link on resize
    });
    updateActiveLinkOnLoad(); // Run immediately for initial state
});
