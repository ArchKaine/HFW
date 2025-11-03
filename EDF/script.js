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

    // Select all elements with an 'id' that are either a <section> or have the .content-body class
    const sections = mainContentArea.querySelectorAll('section[id], .content-body[id]');
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
            const targetElement = document.getElementById(targetId);

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
    // Refined rootMargin for more precise tracking
    const observerOptions = {
        root: null, // viewport
        // This creates a narrow 'window' for detection:
        // top: headerHeight + 1px (just below your fixed header)
        // bottom: viewport height - (headerHeight + some small buffer), effectively making the detection window very short
        // A smaller negative bottom margin will make the detection window for 'intersecting' shorter.
        // We're looking for the element whose TOP edge crosses the line just below the header.
        rootMargin: `-${headerHeight + 1}px 0px -90% 0px`, // Changed -20% to -90% to make the detection window very narrow
        threshold: 0 // No threshold needed, as rootMargin creates the precise window
    };

    let activeLinkOnScroll = null; // Variable to keep track of the currently active link by scroll

    const observer = new IntersectionObserver((entries) => {
        // Find all entries that are currently intersecting (visible in our narrow detection window)
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
            // Sort entries to find the one whose TOP is closest to the detection line (i.e., the one highest on screen)
            intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            
            // The first element in the sorted array is the one that should be active
            const currentActiveEntry = intersectingEntries[0];
            const currentId = currentActiveEntry.target.id;
            const correspondingLink = sidebarNavUl.querySelector(`a[href="#${currentId}"]`);

            // Only update if the active link has actually changed
            if (correspondingLink && correspondingLink !== activeLinkOnScroll) {
                navLinks.forEach(link => link.classList.remove('active'));
                correspondingLink.classList.add('active');
                activeLinkOnScroll = correspondingLink;
            }
        } else {
            // If no sections are intersecting (e.g., at the very top of the page before any section)
            // Or if all sections have scrolled past
            // Let's ensure the first link is active if scrolled very near the top.
            if (window.scrollY < headerHeight && navLinks.length > 0) {
                 if (navLinks[0] !== activeLinkOnScroll) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    navLinks[0].classList.add('active');
                    activeLinkOnScroll = navLinks[0];
                 }
            }
        }
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
            // This is the initial "active" detection logic
            if (rect.top <= headerHeight + 50 && rect.bottom > headerHeight + 50) { // Added a small buffer
                currentActiveElementId = sections[i].id;
                break;
            }
        }

        navLinks.forEach(link => link.classList.remove('active'));
        if (currentActiveElementId) {
            const initialActiveLink = sidebarNavUl.querySelector(`a[href="#${currentActiveElementId}"]`);
            if (initialActiveLink) {
                initialActiveLink.classList.add('active');
                activeLinkOnScroll = initialActiveLink; // Set initial active link for scroll tracking
            }
        } else if (navLinks.length > 0) {
            // If no section is in view (e.g., at very top), activate the first link
            navLinks[0].classList.add('active');
            activeLinkOnScroll = navLinks[0];
        }
    };

    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad);
    updateActiveLinkOnLoad(); // Run immediately for initial state
});
