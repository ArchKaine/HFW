document.addEventListener('DOMContentLoaded', () => {
    // Select dynamic sidebar navigation links using the new generic class
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) {
        // console.warn("No .sidebar-nav ul found. Scrollspy script will not run.");
        return; // Exit if the sidebar navigation is not present on this page
    }
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    // Select the main content area where the scrollable sections reside
    const mainContentArea = document.querySelector('.main-content-area');
    if (!mainContentArea) {
        // console.warn("No .main-content-area found. Scrollspy script will not run.");
        return; // Exit if the main content area is not present
    }

    // --- CRITICAL CHANGE FOR UNIVERSAL SECTION TRACKING ---
    // Select all elements with an 'id' that are either a <section> or have the .content-body class
    // This allows it to track both <section id="..."> and <div class="content-body" id="...">
    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
    // Note: If you have other element types with IDs you want to track, you would add them here.
    // E.g., mainContentArea.querySelectorAll('section[id], div[id], article[id]');
    // Or, for broadest compatibility with ALL IDs that are scroll targets:
    // const sections = mainContentArea.querySelectorAll('[id]');
    // However, targeting .content-body[id] is more precise given your current HTML.

    if (sections.length === 0) {
        // console.warn("No scrollable sections/content-body divs with ID found in .main-content-area. Scrollspy will not observe.");
        return; // Exit if there are no elements to observe
    }

    // Get the effective height of your fixed header from CSS variable
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; // Default to 250px if variable not found

    // Smooth scrolling for sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId); // Renamed targetSection to targetElement for generality

            if (targetElement) {
                // Remove 'active' from all links and add to the clicked one
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
        rootMargin: `-${headerHeight + 20}px 0px -20% 0px`, 
        threshold: 0 
    };

    const observer = new IntersectionObserver((entries) => {
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
            intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            const activeEntry = intersectingEntries[0]; 

            navLinks.forEach(link => link.classList.remove('active'));

            const currentId = activeEntry.target.id;
            const activeLink = sidebarNavUl.querySelector(`a[href="#${currentId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        } else {
            if (window.scrollY < headerHeight && navLinks.length > 0) {
                 navLinks.forEach(link => link.classList.remove('active'));
                 navLinks[0].classList.add('active'); 
            }
        }
    }, observerOptions);

    // Observe each relevant element for changes in visibility
    sections.forEach(section => { // 'section' here refers to any element found by the selector
        observer.observe(section);
    });

    // Handle initial active state on page load
    const updateActiveLinkOnLoad = () => {
        let currentActiveElementId = null;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            // Check if element is past the header, but not completely scrolled past its bottom
            if (rect.top <= headerHeight && rect.bottom > headerHeight) {
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
    updateActiveLinkOnLoad();
});
