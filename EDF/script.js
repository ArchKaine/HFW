document.addEventListener('DOMContentLoaded', () => {
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    const detectionLineOffset = headerHeight + 5; // A fixed pixel line where activation happens

    let isScrollingFromClick = false;
    let scrollTimeout;
    const scrollEndDelay = 150; 

    // --- NEW: Track scroll direction ---
    let lastScrollY = window.scrollY;
    let currentActiveId = null; // Store the currently active ID globally

    const setActiveLink = (id) => {
        if (currentActiveId === id) return; // Prevent unnecessary updates

        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        currentActiveId = id; // Update the global active ID
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

                const handleScroll = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        isScrollingFromClick = false;
                        updateActiveState(); // Force update after scroll settles
                        window.removeEventListener('scroll', handleScroll);
                    }, scrollEndDelay);
                };
                window.addEventListener('scroll', handleScroll);
            }
        });
    });

    // --- NEW: Main scroll event handler with debounce and direction awareness ---
    let scrollHandlerTimeout;
    const debounceScrollDelay = 50; // Milliseconds to wait before processing scroll

    const handleWindowScroll = () => {
        clearTimeout(scrollHandlerTimeout);
        scrollHandlerTimeout = setTimeout(() => {
            if (!isScrollingFromClick) {
                updateActiveState();
            }
            lastScrollY = window.scrollY; // Update last scroll position
        }, debounceScrollDelay);
    };

    window.addEventListener('scroll', handleWindowScroll);

    // --- Centralized function to determine and apply active state ---
    const updateActiveState = () => {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';

        let newActiveId = null;

        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5; 
        
        // --- Priority 1: If at the very bottom, always activate the last section ---
        if (isScrolledToBottom && sections.length > 0) {
            newActiveId = sections[sections.length - 1].id;
        } 
        // --- Priority 2: Use scroll direction and element position ---
        else {
            if (scrollDirection === 'down') {
                // When scrolling down, find the first section whose TOP is above or at the detection line
                for (let i = sections.length - 1; i >= 0; i--) { // Iterate backwards to find highest currently visible
                    const rect = sections[i].getBoundingClientRect();
                    // If the section's top has passed the detection line, it should be active
                    if (rect.top <= detectionLineOffset) {
                        newActiveId = sections[i].id;
                        break;
                    }
                }
            } else { // Scrolling up
                // When scrolling up, find the first section whose TOP is above the detection line
                // or the first section whose BOTTOM is still well within view below the detection line
                for (let i = 0; i < sections.length; i++) {
                    const rect = sections[i].getBoundingClientRect();
                    // If the section's top is past the detection line, or it's very close and on screen
                    if (rect.top <= detectionLineOffset + 50 && rect.bottom > 0) { // Add some buffer for "just entering"
                        newActiveId = sections[i].id;
                        break;
                    }
                }
            }

            // Fallback for very top of the page (before first section) if nothing else is active
            if (!newActiveId && currentScrollY < headerHeight + 100 && sections.length > 0) {
                newActiveId = sections[0].id;
            }
        }

        if (newActiveId) {
            setActiveLink(newActiveId);
        } else {
            // If nothing is active, default to first link if available
            if (sections.length > 0) {
                setActiveLink(sections[0].id);
            } else {
                navLinks.forEach(link => link.classList.remove('active')); // Clear all if no sections
            }
        }
    };


    // Handle initial active state on page load and on resize
    const updateActiveLinkOnLoad = () => {
        const currentScrollY = window.scrollY;
        let initialActiveId = null;

        // --- Check for initial scroll position ---
        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5;
        if (isScrolledToBottom && sections.length > 0) {
            initialActiveId = sections[sections.length - 1].id;
        } else {
            // Find the topmost section whose top is past the detection line
            for (let i = 0; i < sections.length; i++) {
                const rect = sections[i].getBoundingClientRect();
                if (rect.top <= detectionLineOffset + 50 && rect.bottom > 0) { 
                    initialActiveId = sections[i].id;
                    break;
                }
            }
            if (!initialActiveId && sections.length > 0 && currentScrollY < headerHeight + 100) {
                initialActiveId = sections[0].id; // Default to first if near top and no other active
            }
        }
        
        if (initialActiveId) {
            setActiveLink(initialActiveId);
        } else if (sections.length > 0) {
            setActiveLink(sections[0].id); // Default if nothing else
        }
    };

    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad); // Re-evaluate on resize
    updateActiveLinkOnLoad(); // Run immediately for initial state
});
