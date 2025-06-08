/**
 * HFW Shadow Fleet - scripts.js (v16 - Final, Robust Loader Logic)
 */
document.addEventListener('DOMContentLoaded', () => {
    // This is the new, reliable check.
    if (document.body.classList.contains('dynamic-load')) {
        console.log("Dynamic mode detected. Loading sections...");
        loadAllSections()
            .then(() => {
                console.log("All sections loaded.");
                initPageListeners();
            })
            .catch(error => {
                const mainContainer = document.querySelector(".container");
                mainContainer.innerHTML = `<div style="text-align: center; padding: 5rem 1rem; color: #ff4c4c;"><strong>Error:</strong> ${error.message}</div>`;
                console.error("Failed to load HFW content:", error);
            });
    } else {
        // The page is static (after an 'undo'), just run the scripts.
        console.log("Static content detected. Initializing scripts...");
        initPageListeners();
    }
});

async function loadAllSections() {
    if (window.location.protocol === 'file:') {
        throw new Error(`Due to browser security, this page must be viewed on a web server.`);
    }

    const mainContainer = document.querySelector(".container");
    if (!mainContainer) throw new Error("Main content container not found.");

    const manifestResponse = await fetch('sections/sections.json');
    if (!manifestResponse.ok) throw new Error('Could not fetch sections.json. Please run "node split-sections.js split" first.');
    const manifest = await manifestResponse.json();

    const fetchPromises = manifest.map(item => {
        if (item.type === 'section') {
            return fetch(`sections/${item.filename}`)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load '${item.filename}'`);
                    return response.text();
                });
        }
        return Promise.resolve(document.getElementById(item.id)?.outerHTML || '');
    });

    const results = await Promise.allSettled(fetchPromises);
    let finalHtml = '';
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            finalHtml += result.value + '\n';
        } else {
            const failedFile = manifest[index].filename || `ID: ${manifest[index].id}`;
            finalHtml += `<div style="color: red; border: 1px solid red; padding: 1rem; margin: 1rem;">Error loading section: <strong>${failedFile}</strong>.</div>\n`;
            console.error(`Failed to load content for ${failedFile}:`, result.reason);
        }
    });

    mainContainer.innerHTML = finalHtml;
}


// --- All other functions (initPageListeners, updateAside, etc.) remain unchanged ---
// (Paste the full content of all your other functions from the previous script version here)
let asideElement, mainContentScroller, spectreNavLinks;
function initPageListeners() {
    asideElement = document.getElementById("section-aside");
    mainContentScroller = document.querySelector(".spectre-post-container > .container");
    spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
    if (!mainContentScroller) return;
    const scrollOptions = { passive: true };
    window.addEventListener("scroll", handleSpectreNavScroll, scrollOptions);
    mainContentScroller.addEventListener("scroll", handleSpectreNavScroll, scrollOptions);
    window.addEventListener("scroll", updateAside, scrollOptions);
    mainContentScroller.addEventListener("scroll", updateAside, scrollOptions);
    window.addEventListener("resize", updateAside, scrollOptions);
    if (spectreNavLinks) {
        spectreNavLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    document.querySelectorAll(".ship-family-tabs .family-tab").forEach(tab => {
        tab.addEventListener('click', () => { if (tab.dataset.family) showFamily(tab.dataset.family, tab); });
    });
    document.querySelectorAll(".variant-tabs button").forEach(tab => {
        tab.addEventListener('click', () => { if (tab.dataset.variantId && tab.dataset.familyId) showVariantContent(tab.dataset.variantId, tab, tab.dataset.familyId); });
    });
    const firstFamilyButton = document.querySelector(".ship-family-tabs button.family-tab");
    if (firstFamilyButton && firstFamilyButton.dataset.family) {
        showFamily(firstFamilyButton.dataset.family, firstFamilyButton);
    }
    updateAside();
    handleSpectreNavScroll();
}
function updateAside() {
    if (!asideElement || !mainContentScroller) return;
    const asideTocList = asideElement.querySelector("ul.aside-toc");
    if (!asideTocList) return;
    const svgIcon = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;"><path d="M10 17l5-5-5-5v10z"></path></svg>';
    const activationOffset = window.innerHeight * 0.35;
    const pageSections = Array.from(mainContentScroller.querySelectorAll(":scope > .section, :scope > div[id]"));
    let activeSection = null;
    for (let i = pageSections.length - 1; i >= 0; i--) {
        const sec = pageSections[i];
        if (sec.offsetParent === null) continue;
        const rect = sec.getBoundingClientRect();
        if (rect.top < activationOffset && rect.bottom > activationOffset * 0.2) {
            activeSection = sec;
            break;
        }
    }
    if (!activeSection && pageSections.length > 0 && pageSections[0].offsetParent !== null && (mainContentScroller.scrollTop < 50 || window.scrollY < 50)) {
        activeSection = pageSections[0];
    }
    asideTocList.innerHTML = "";
    if (!activeSection) {
        const li = document.createElement("li");
        li.textContent = "Scroll to a section.";
        asideTocList.appendChild(li);
        return;
    }
    let sourceForHeadings = activeSection;
    if (activeSection.id === "spectre-variants") {
        const activeFamilyContent = activeSection.querySelector(".ship-family-content-wrapper.active-family-content");
        if (activeFamilyContent) {
            sourceForHeadings = activeFamilyContent.querySelector(".variant-content.active") || activeFamilyContent;
        }
    }
    const headings = Array.from(sourceForHeadings.querySelectorAll("h2, h3, h4"));
    if (!headings.length) return;
    const tocLinks = [];
    headings.forEach(h => {
        if (!h.id) {
            h.id = `${activeSection.id}-${h.tagName.toLowerCase()}-${h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")}`;
        }
        const a = document.createElement("a");
        a.href = `#${h.id}`;
        const headingText = Array.from(h.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(' ').trim() || h.textContent.trim();
        a.innerHTML = svgIcon + headingText;
        if (h.tagName.toLowerCase() === "h4") {
            a.style.paddingLeft = "1.5rem";
        }
        a.addEventListener("click", e => {
            e.preventDefault();
            const targetElement = document.getElementById(h.id);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        const li = document.createElement("li");
        li.appendChild(a);
        asideTocList.appendChild(li);
        tocLinks.push(a);
    });
    let activeLink = null;
    for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top < activationOffset) {
            activeLink = tocLinks[i];
            break;
        }
    }
    tocLinks.forEach(link => {
        link.classList.toggle("active", link === activeLink);
    });
}
function handleSpectreNavScroll() {
    if (!mainContentScroller || !spectreNavLinks) return;
    let currentNavId = "";
    const navActivationOffset = window.innerHeight * 0.4;
    spectreNavLinks.forEach(link => {
        if (!link.getAttribute('href').startsWith("#view-")) {
            const sectionId = link.getAttribute("href");
            const sec = sectionId.startsWith("#") ? document.getElementById(sectionId.substring(1)) : null;
            if (sec && sec.offsetParent !== null) {
                const rect = sec.getBoundingClientRect();
                if (rect.top < navActivationOffset) {
                    currentNavId = sec.id;
                }
            }
        }
    });
    spectreNavLinks.forEach(link => {
        if (!link.getAttribute('href').startsWith("#view-")) {
            link.classList.toggle("nav-active", link.getAttribute("href") === `#${currentNavId}`);
        }
    });
}
function showFamily(familyIdSuffix, btnEl) {
    const variantsWrapper = document.getElementById('spectre-variants');
    if (!variantsWrapper) return;
    variantsWrapper.querySelectorAll(".ship-family-content-wrapper").forEach(w => {
        w.style.display = "none";
        w.classList.remove("active-family-content");
    });
    variantsWrapper.querySelectorAll(".ship-family-tabs button.family-tab").forEach(t => {
        t.classList.remove("active-family");
    });
    const contentToShow = document.getElementById("content-family-" + familyIdSuffix);
    if (contentToShow) {
        contentToShow.style.display = "block";
        contentToShow.classList.add("active-family-content");
    }
    if (btnEl) {
        btnEl.classList.add("active-family");
    }
    const firstVariantButton = contentToShow ? contentToShow.querySelector(".variant-tabs button") : null;
    if (firstVariantButton) {
        const variantId = firstVariantButton.dataset.variantId;
        const familyId = firstVariantButton.dataset.familyId;
        if (variantId && familyId) showVariantContent(variantId, firstVariantButton, familyId);
    } else {
        updateAside();
    }
}
function showVariantContent(variantId, btnEl, familyId) {
    const familyContentWrapper = document.getElementById('content-family-' + familyId);
    if (!familyContentWrapper) return;
    familyContentWrapper.querySelectorAll(".variant-content").forEach(c => c.classList.remove("active"));
    familyContentWrapper.querySelectorAll(".variant-tabs button").forEach(t => t.classList.remove("active"));
    const contentToShow = document.getElementById(variantId);
    if (contentToShow) contentToShow.classList.add("active");
    if (btnEl) btnEl.classList.add("active");
    updateAside();
}