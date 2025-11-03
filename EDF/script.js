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

    // Select all scrollable sections with an 'id' attribute within the main content area.
    // This is now more flexible, looking for section[id] anywhere inside mainContentArea,
    // not strictly requiring them to be nested within .content-body.
    const sections = mainContentArea.querySelectorAll('section[id]');
    if (sections.length === 0) {
        // console.warn("No scrollable sections with ID found in .main-content-area. Scrollspy will not observe.");
        return; // Exit if there are no sections to observe
    }

    // Get the effective height of your fixed header from CSS variable
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-effective-height-for-sticky')) || 250; // Default to 250px if variable not found

    // Smooth scrolling for sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // Remove 'active' from all links and add to the clicked one
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Scroll with offset for fixed header
                const offsetTop = targetSection.getBoundingClientRect().top + window.scrollY - headerHeight;
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
        // rootMargin defines a shrinking of the viewport.
        // We want the detection zone to start 'headerHeight' + some buffer from the top.
        // The bottom margin of -20% helps ensure the previous section deactivates as the new one becomes prominent.
        rootMargin: `-${headerHeight + 20}px 0px -20% 0px`, 
        threshold: 0 // As soon as any part intersects the rootMargin
    };

    const observer = new IntersectionObserver((entries) => {
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
            intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            const activeEntry = intersectingEntries[0]; // The topmost intersecting section

            navLinks.forEach(link => link.classList.remove('active'));

            const currentId = activeEntry.target.id;
            const activeLink = sidebarNavUl.querySelector(`a[href="#${currentId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        } else {
            // If no section is intersecting (e.g., at the very top of the page before first section)
            // If scrolled to the very top, make the first link active
            if (window.scrollY < headerHeight && navLinks.length > 0) {
                 navLinks.forEach(link => link.classList.remove('active'));
                 navLinks[0].classList.add('active'); // Activate the very first link
            }
        }
    }, observerOptions);

    // Observe each section for changes in visibility
    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial active state on page load
    const updateActiveLinkOnLoad = () => {
        let currentActiveSectionId = null;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            // Check if section is past the header, but not completely scrolled past its bottom
            if (rect.top <= headerHeight && rect.bottom > headerHeight) {
                currentActiveSectionId = sections[i].id;
                break;
            }
        }

        navLinks.forEach(link => link.classList.remove('active'));
        if (currentActiveSectionId) {
            const initialActiveLink = sidebarNavUl.querySelector(`a[href="#${currentActiveSectionId}"]`);
            if (initialActiveLink) {
                initialActiveLink.classList.add('active');
            }
        } else if (navLinks.length > 0) {
            // If no section is in view (e.g., at very top or very bottom), activate the first link
            navLinks[0].classList.add('active');
        }
    };

    // Run on initial load and when the window is resized (layout might shift)
    window.addEventListener('load', updateActiveLinkOnLoad);
    window.addEventListener('resize', updateActiveLinkOnLoad);

    // Initial check (useful for cases where load event might be delayed or page isn't fully loaded yet)
    updateActiveLinkOnLoad();
});
