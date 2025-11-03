document.addEventListener('DOMContentLoaded', () => {
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) return;
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) return;

    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    if (sections.length === 0) return;

    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; 
    const detectionBuffer = 10; 

    // --- NEW: Flag to temporarily disable IntersectionObserver updates during smooth scroll ---
    let isScrollingFromClick = false;
    const scrollEndDelay = 300; // Milliseconds to wait after scroll ends

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
                isScrollingFromClick = true; // Set flag
                setActiveLink(targetId); // Instantly set active class on click

                const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // --- NEW: Listen for scroll completion to reset flag ---
                // Using a timeout as 'scrollend' event isn't universally supported yet.
                // This debounces scroll events and waits for a brief pause.
                let scrollTimeout;
                const handleScroll = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        isScrollingFromClick = false;
                        // Force a re-evaluation by the observer after scroll ends
                        observer.takeRecords(); // Process any pending observer records
                        const currentScrollPos = window.scrollY;
                        // Manually trigger the observer logic once scroll has settled
                        // This ensures the correct element is highlighted after the scroll.
                        observer.disconnect(); // Temporarily stop observing
                        sections.forEach(section => observer.observe(section)); // Re-observe to trigger an initial detection
                        window.removeEventListener('scroll', handleScroll); // Clean up
                    }, scrollEndDelay);
                };
                window.addEventListener('scroll', handleScroll);
            }
        });
    });

    // Intersection Observer for active link highlighting
    const observerOptions = {
        root: null, 
        rootMargin: `-${headerHeight + detectionBuffer}px 0px -50% 0px`, 
        threshold: 0 
    };
    
    const observer = new IntersectionObserver((entries) => {
        // --- NEW: Block updates if scrolling from a click ---
        if (isScrollingFromClick) {
            return; // Do not update active link while a smooth scroll is in progress from a click
        }

        let currentActiveIdFromObserver = null;
        const intersecting = entries.filter(entry => entry.isIntersecting);

        if (intersecting.length > 0) {
            intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            currentActiveIdFromObserver = intersecting[0].target.id;
        }

        let finalActiveId = null;
        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5; 
        
        if (isScrolledToBottom && sections.length > 0) {
            finalActiveId = sections[sections.length - 1].id;
        } else if (currentActiveIdFromObserver) {
            finalActiveId = currentActiveIdFromObserver;
        } else if (window.scrollY < headerHeight + 100 && sections.length > 0) {
            finalActiveId = sections[0].id;
        }

        if (finalActiveId) {
            setActiveLink(finalActiveId);
        } else {
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
            if (rect.top <= headerHeight + detectionBuffer + 50 && rect.bottom > headerHeight + detectionBuffer + 50) { 
                initialActiveId = sections[i].id;
                break;
            }
        }
        
        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5;
        if (isScrolledToBottom && sections.length > 0) {
            initialActiveId = sections[sections.length - 1].id;
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
