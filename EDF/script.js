document.addEventListener('DOMContentLoaded', () => {
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    const headerElement = document.querySelector('header.hero-section'); 
    if (!headerElement) {
        console.error("Scrollspy: Header element with class 'hero-section' not found. Cannot determine dynamic offset.");
        return;
    }

    const baseHeaderHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    const headerBottomBuffer = 5; 

    let isScrollingFromClick = false;
    let scrollTimeout;
    const scrollEndDelay = 150; 

    let lastScrollY = window.scrollY;
    let currentActiveId = null; 

    const setActiveLink = (id) => {
        if (currentActiveId === id) return; // Prevent unnecessary DOM updates if already active

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

                const headerRect = headerElement.getBoundingClientRect();
                let scrollOffset = 0; 
                if (headerRect.bottom > 0) { 
                    scrollOffset = headerRect.height; 
                }
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
    const debounceScrollDelay = 80; // Slightly increased debounce delay

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

    // --- Centralized function to determine and apply active state (Unified Logic) ---
    const updateActiveState = () => {
        const currentScrollY = window.scrollY;

        // Determine effective detection line based on header visibility
        const headerRect = headerElement.getBoundingClientRect();
        let effectiveDetectionLine = headerBottomBuffer; 
        if (headerRect.bottom > 0) { 
            effectiveDetectionLine = headerRect.height + headerBottomBuffer;
        }

        let newActiveId = null;
        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5; 
        
        // --- Priority 1: If at the very bottom, always activate the last section ---
        if (isScrolledToBottom && sections.length > 0) {
            newActiveId = sections[sections.length - 1].id;
        } 
        // --- Priority 2: Find the topmost section that has crossed the detection line ---
        else {
            // Iterate through sections from bottom to top (reversed order)
            // This ensures we pick the highest section whose top is AT OR ABOVE the detection line.
            for (let i = sections.length - 1; i >= 0; i--) {
                const rect = sections[i].getBoundingClientRect();
                if (rect.top <= effectiveDetectionLine) {
                    newActiveId = sections[i].id;
                    break; 
                }
            }

            // Fallback for very top of the page if no section has crossed the line yet
            if (!newActiveId && currentScrollY < (headerRect.height || baseHeaderHeight) + 100 && sections.length > 0) {
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
        lastScrollY = currentScrollY; // Update lastScrollY *after* state update
    };


    const updateActiveLinkOnLoad = () => {
        const currentScrollY = window.scrollY;
        let initialActiveId = null;

        const headerRect = headerElement.getBoundingClientRect();
        let effectiveDetectionLine = headerBottomBuffer; 
        if (headerRect.bottom > 0) { 
            effectiveDetectionLine = headerRect.height + headerBottomBuffer;
        }

        const isScrolledToBottom = (window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight - 5;
        if (isScrolledToBottom && sections.length > 0) {
            initialActiveId = sections[sections.length - 1].id;
        } else {
            for (let i = sections.length - 1; i >= 0; i--) { // Iterate backwards
                const rect = sections[i].getBoundingClientRect();
                if (rect.top <= effectiveDetectionLine) { 
                    initialActiveId = sections[i].id;
                    break;
                }
            }
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
