document.addEventListener('DOMContentLoaded', () => {
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    // --- NEW: Get reference to the header element ---
    const headerElement = document.querySelector('header.hero-section'); 
    if (!headerElement) {
        console.error("Scrollspy: Header element with class 'hero-section' not found. Cannot determine dynamic offset.");
        return;
    }

    const baseHeaderHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    const headerBottomBuffer = 5; // A small buffer below the header when it's visible

    let isScrollingFromClick = false;
    let scrollTimeout;
    const scrollEndDelay = 150; 

    let lastScrollY = window.scrollY;
    let currentActiveId = null; 

    const setActiveLink = (id) => {
        if (currentActiveId === id) return; 

        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        currentActiveId = id; 
    };

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                isScrollingFromClick = true; 
                setActiveLink(targetId); 

                // --- NEW: Dynamic scroll offset for click ---
                const headerRect = headerElement.getBoundingClientRect();
                let scrollOffset = 0; // Default to top of viewport
                if (headerRect.bottom > 0) { // If header is still visible on screen
                    scrollOffset = headerRect.height; // Scroll below the header's current height
                }
                // Add an extra small buffer if the header is visible
                const adjustedOffsetTop = targetElement.getBoundingClientRect().top + window.scrollY - scrollOffset - (scrollOffset > 0 ? headerBottomBuffer : 0);
                
                window.scrollTo({
                    top: adjustedOffsetTop,
                    behavior: 'smooth'
                });

                const handleScroll = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        isScrollingFromClick = false;
                        updateActiveState(); 
                        window.removeEventListener('scroll', handleScroll);
                    }, scrollEndDelay);
                };
                window.addEventListener('scroll', handleScroll);
            }
        });
    });

    let scrollHandlerTimeout;
    const debounceScrollDelay = 50; 

    const handleWindowScroll = () => {
        clearTimeout(scrollHandlerTimeout);
        scrollHandlerTimeout = setTimeout(() => {
            if (!isScrollingFromClick) {
                updateActiveState();
            }
            lastScrollY = window.scrollY; 
        }, debounceScrollDelay);
    };

    window.addEventListener('scroll', handleWindowScroll);

    // --- Centralized function to determine and apply active state ---
    const updateActiveState = () => {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';

        // --- NEW: Determine effective detection line ---
        const headerRect = headerElement.getBoundingClientRect();
        let effectiveDetectionLine = headerBottomBuffer; // Default detection line: small buffer from viewport top
        if (headerRect.bottom > 0) { // If header is visible on screen, adjust detection line to below it
            effectiveDetectionLine = headerRect.height + headerBottomBuffer;
        }

        let newActiveId = null;
        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5; 
        
        // --- Priority 1: If at the very bottom, always activate the last section ---
        if (isScrolledToBottom && sections.length > 0) {
            newActiveId = sections[sections.length - 1].id;
        } 
        // --- Priority 2: Use scroll direction and element position relative to effectiveDetectionLine ---
        else {
            if (scrollDirection === 'down') {
                for (let i = sections.length - 1; i >= 0; i--) { 
                    const rect = sections[i].getBoundingClientRect();
                    if (rect.top <= effectiveDetectionLine) {
                        newActiveId = sections[i].id;
                        break;
                    }
                }
            } else { // Scrolling up
                for (let i = 0; i < sections.length; i++) {
                    const rect = sections[i].getBoundingClientRect();
                    // If the section's top has passed the detection line, or it's very close and on screen
                    if (rect.top <= effectiveDetectionLine + 50 && rect.bottom > 0) { 
                        newActiveId = sections[i].id;
                        break;
                    }
                }
            }

            // Fallback for very top of the page (before first section) if nothing else is active
            if (!newActiveId && currentScrollY < (headerRect.height || baseHeaderHeight) + 100 && sections.length > 0) {
                newActiveId = sections[0].id;
            }
        }

        if (newActiveId) {
            setActiveLink(newActiveId);
        } else {
            if (sections.length > 0) {
                setActiveLink(sections[0].id);
            } else {
                navLinks.forEach(link => link.classList.remove('active')); 
            }
        }
    };

    const updateActiveLinkOnLoad = () => {
        const currentScrollY = window.scrollY;
        let initialActiveId = null;

        // --- NEW: Determine effective detection line for initial load ---
        const headerRect = headerElement.getBoundingClientRect();
        let effectiveDetectionLine = headerBottomBuffer; 
        if (headerRect.bottom > 0) { 
            effectiveDetectionLine = headerRect.height + headerBottomBuffer;
        }

        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5;
        if (isScrolledToBottom && sections.length > 0) {
            initialActiveId = sections[sections.length - 1].id;
        } else {
            for (let i = 0; i < sections.length; i++) {
                const rect = sections[i].getBoundingClientRect();
                if (rect.top <= effectiveDetectionLine + 50 && rect.bottom > 0) { 
                    initialActiveId = sections[i].id;
                    break;
                }
            }
            // Fallback for very top of the page
            if (!initialActiveId && sections.length > 0 && currentScrollY < (headerRect.height || baseHeaderHeight) + 100) {
                initialActiveId = sections[0].id; 
            }
        }
        
        if (initialActiveId) {
            setActiveLink(initialActiveId);
        } else if (sections.length > 0) {
            setActiveLink(sections[0].id); 
        }
    };

    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad); 
    updateActiveLinkOnLoad();
});
