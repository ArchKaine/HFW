document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.lore-nav ul li a');
    const sections = document.querySelectorAll('.lore-content section');

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Offset for fixed header/spacing
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for active link highlighting
    const observerOptions = {
        root: null, // viewport
        rootMargin: '-50% 0px -50% 0px', // When section is in the middle of the viewport
        threshold: 0 // No threshold needed, as rootMargin handles visibility
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove 'active-lore-link' from all links
                navLinks.forEach(link => link.classList.remove('active-lore-link'));

                // Add 'active-lore-link' to the current section's link
                const currentId = entry.target.id;
                const activeLink = document.querySelector(`.lore-nav ul li a[href="#${currentId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active-lore-link');
                }
            }
        });
    }, observerOptions);

    // Observe each section
    sections.forEach(section => {
        observer.observe(section);
    });

    // Optional: Make the lore-nav sticky/fixed as you scroll
    // You'd need more specific CSS for its position and styling (e.g., fixed top, left/right)
    // For now, let's just add a class when it becomes sticky
    const loreNav = document.querySelector('.lore-nav');
    if (loreNav) {
        let initialNavTop = loreNav.offsetTop;
        window.addEventListener('scroll', () => {
            if (window.scrollY > initialNavTop - 20) { // Adjust '20' for desired scroll point
                loreNav.classList.add('sticky-lore-nav');
            } else {
                loreNav.classList.remove('sticky-lore-nav');
            }
        });
    }
});
