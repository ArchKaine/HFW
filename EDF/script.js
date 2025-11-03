document.addEventListener('DOMContentLoaded', () => {
    // Select dynamic sidebar navigation links using the new generic class
    const sidebarNavUl = document.querySelector('.sidebar-nav ul');
    if (!sidebarNavUl) {
        // console.warn("No .sidebar-nav ul found. Scrollspy script will not run.");
        return; // Exit if the sidebar navigation is not present on this page
    }
    const navLinks = sidebarNavUl.querySelectorAll('li a');

    // Select all scrollable sections within the main content area
    // Using the generic classes: .content-body and section[id]
    const sections = document.querySelectorAll('.main-content-area .content-body section[id]');
    if (sections.length === 0) {
        // console.warn("No scrollable sections with ID found in .main-content-area .content-body. Scrollspy will not observe.");
        return; // Exit if there are no sections to observe
    }

    // Get the effective height of your fixed header from CSS variable
    // This is crucial for correctly positioning the Intersection Observer's detection area
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
    // This observes when a section enters a specific area of the viewport (just below the header)
    const observerOptions = {
        root: null, // viewport
        // rootMargin defines a shrinking of the viewport.
        // We want the detection zone to start 'headerHeight' + some buffer from the top.
        // The bottom margin of -20% helps ensure the previous section deactivates as the new one becomes prominent.
        rootMargin: `-${headerHeight + 20}px 0px -20% 0px`, 
        threshold: 0 // As soon as any part intersects the rootMargin
    };

    const observer = new IntersectionObserver((entries) => {
        // Filter for entries that are currently intersecting (i.e., visible in our detection zone)
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        // If there are intersecting entries, find the topmost one
        // This handles cases where multiple sections might briefly intersect the rootMargin
        if (intersectingEntries.length > 0) {
            // Sort by bounding client rect top to get the one closest to the top of the viewport
            intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            const activeEntry = intersectingEntries[0]; // The topmost intersecting section

            // Remove 'active' from all links
            navLinks.forEach(link => link.classList.remove('active'));

            // Add 'active' to the corresponding link
            const currentId = activeEntry.target.id;
            const activeLink = sidebarNavUl.querySelector(`a[href="#${currentId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        } else {
            // If no section is intersecting (e.g., at the very top of the page before first section)
            // or at the very bottom after the last section, you might want to deactivate all
            // or activate the first link if at the top.
            // For now, let's ensure the first link is active if at the very top.
            if (window.scrollY < headerHeight && navLinks.length > 0) {
                 navLinks.forEach(link => link.classList.remove('active'));
                 // Optionally activate the very first link if scrolled to top
                 // navLinks[0].classList.add('active');
            }
        }
    }, observerOptions);

    // Observe each section for changes in visibility
    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial active state on page load
    // This ensures the correct link is highlighted when the page first loads,
    // even if it loads scrolled down to a specific section.
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

    // Removed the optional sticky-lore-nav scroll listener
    // as position: sticky in CSS handles that much more robustly.
});
