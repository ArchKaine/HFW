/**
 * HFW Shadow Fleet - scripts.js (Corrected & Refactored - v2)
 * Manages all interactive elements of the HFW design document.
 */

// --- Top-level variables for globally accessed DOM elements ---
// Declared here, but assigned in initPageListeners to ensure the DOM is ready.
let asideElement, mainContentScroller, spectreNavLinks, modelViewer;

// --- Model Viewer Data ---
const modelBaseURL = "https://ArchKaine.github.io/ship-models/";
const models = {
    shadow: { src: modelBaseURL + "Spectre_Shadow.glb", alt: "Anvil Spectre Shadow" },
    revenant: { src: modelBaseURL + "Spectre_Revenant.glb", alt: "Anvil Spectre Revenant" },
    eidolon_shadow: { src: modelBaseURL + "Eidolon_Shadow.glb", alt: "Anvil Eidolon Shadow" },
};


// --- FUNCTION DEFINITIONS ---

/**
 * Builds and updates the "On This Section" table of contents in the aside panel.
 */
function updateAside() {
  if (!asideElement || !mainContentScroller) return;
  const asideTocList = asideElement.querySelector("ul.aside-toc");
  if (!asideTocList) return;

  const svgIcon =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;"><path d="M10 17l5-5-5-5v10z"></path></svg>';

  const viewportHeight = window.innerHeight;
  const activationOffset = viewportHeight * 0.35;

  const pageSections = Array.from(mainContentScroller.querySelectorAll(":scope > .section"));
  let activeSection = null;

  for (let i = pageSections.length - 1; i >= 0; i--) {
    const sec = pageSections[i];
    if (sec.offsetParent === null) continue; // Skip hidden sections
    const rect = sec.getBoundingClientRect();
    if (rect.top < activationOffset && rect.bottom > activationOffset * 0.2) {
      activeSection = sec;
      break;
    }
  }

  if (!activeSection && pageSections.length > 0 && pageSections[0].offsetParent !== null) {
    if (mainContentScroller.scrollTop < 50) activeSection = pageSections[0];
  }

  asideTocList.innerHTML = "";

  if (!activeSection) {
    const li = document.createElement("li");
    li.textContent = "Scroll to a section.";
    li.style.cssText = "padding: 0.5rem 1rem; font-size: 0.9rem; color: #777;";
    asideTocList.appendChild(li);
    asideElement.style.display = "flex";
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

  if (!headings.length) {
    const li = document.createElement("li");
    const titleEl = activeSection.querySelector('h2');
    const titleText = titleEl ? (Array.from(titleEl.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent.trim()).join(' ').trim() || titleEl.textContent.trim()) : 'current section';
    li.textContent = `No sub-headings in ${titleText}.`;
    li.style.cssText = "padding: 0.5rem 1rem; font-size: 0.9rem; color: #777;";
    asideTocList.appendChild(li);
    asideElement.style.display = "flex";
    return;
  }

  let anItemWasHighlighted = false;
  headings.forEach((h) => {
    if (!h.id) {
      h.id = `${activeSection.id}-${h.tagName.toLowerCase()}-${h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")}`;
    }
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    const headingText = Array.from(h.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(' ').trim() || h.textContent.trim();
    a.innerHTML = svgIcon + headingText;
    if (h.tagName.toLowerCase() === "h4") a.style.paddingLeft = "1.5rem";

    const headingRect = h.getBoundingClientRect();
    if (!anItemWasHighlighted && headingRect.top >= 0 && headingRect.top < activationOffset) {
      a.classList.add("active");
      anItemWasHighlighted = true;
    }

    a.addEventListener("click", (e) => {
      e.preventDefault();
      const targetElement = document.getElementById(h.id);
      if (targetElement && mainContentScroller) {
        const scrollerRect = mainContentScroller.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const scrollToPosition = targetRect.top - scrollerRect.top + mainContentScroller.scrollTop - (window.innerHeight * 0.1);
        mainContentScroller.scrollTo({ top: Math.max(0, scrollToPosition), behavior: "smooth" });
      }
      asideTocList.querySelectorAll("a").forEach(link => link.classList.remove("active"));
      a.classList.add("active");
    });
    const li = document.createElement("li");
    li.appendChild(a);
    asideTocList.appendChild(li);
  });
  asideElement.style.display = "flex";
}

/**
 * Highlights the main navigation links based on scroll position.
 */
function handleSpectreNavScroll() {
  if (!mainContentScroller || !spectreNavLinks) return;
  let currentNavId = "";
  const navActivationOffset = window.innerHeight * 0.4;

  spectreNavLinks.forEach(link => {
      const sectionId = link.getAttribute("href");
      const sec = sectionId.startsWith("#") ? document.getElementById(sectionId.substring(1)) : null;
      if (sec && sec.offsetParent !== null) {
          const rect = sec.getBoundingClientRect();
          if (rect.top < navActivationOffset) {
              currentNavId = sec.id;
          }
      }
  });

  spectreNavLinks.forEach(link => {
    link.classList.toggle("nav-active", link.getAttribute("href") === `#${currentNavId}`);
  });
}

/**
 * Displays the content for a specific ship family.
 */
function showFamily(familyIdSuffix, btnEl) {
  document.querySelectorAll(".ship-family-content-wrapper").forEach(wrapper => {
    wrapper.style.display = "none";
    wrapper.classList.remove("active-family-content");
  });
  document.querySelectorAll(".ship-family-tabs button.family-tab").forEach(tab => {
    tab.classList.remove("active-family");
  });

  const contentToShow = document.getElementById("content-family-" + familyIdSuffix);
  if (contentToShow) {
    contentToShow.style.display = "block";
    contentToShow.classList.add("active-family-content");
  }
  if (btnEl) {
    btnEl.classList.add("active-family");
  }

  if (contentToShow) {
    const firstVariantButton = contentToShow.querySelector(".variant-tabs button");
    if (firstVariantButton) {
      // This part still needs refactoring in the next step
      const clickEvent = firstVariantButton.getAttribute('onclick');
      if (clickEvent) {
        const matches = clickEvent.match(/'([^']+)'/g);
        if (matches && matches.length >= 2) {
          const variantId = matches[0].replace(/'/g, '');
          const familyIdFromClick = matches[1].replace(/'/g, '');
          showVariantContent(variantId, firstVariantButton, familyIdFromClick);
        } else if (matches && matches.length === 1) {
          const variantId = matches[0].replace(/'/g, '');
          showVariantContent(variantId, firstVariantButton, familyIdSuffix);
        }
      }
    } else {
      updateAside();
    }
  }
}

/**
 * Displays content for a specific ship variant.
 */
function showVariantContent(variantId, btnEl, familyId) {
  const familyContentWrapper = document.getElementById('content-family-' + familyId);
  if (!familyContentWrapper) return;

  familyContentWrapper.querySelectorAll(".variant-content").forEach(content => {
    content.style.display = "none";
    content.classList.remove("active");
  });
  familyContentWrapper.querySelectorAll(".variant-tabs button").forEach(tab => {
    tab.classList.remove("active");
  });

  const contentToShow = document.getElementById(variantId);
  if (contentToShow) {
    contentToShow.style.display = "block";
    contentToShow.classList.add("active");
  }
  if (btnEl) {
    btnEl.classList.add("active");
  }
  updateAside();
}

/**
 * Main initialization function to set up all page listeners.
 */
function initPageListeners() {
  // Assign elements to the top-level variables now that the DOM is ready.
  asideElement = document.getElementById("section-aside");
  mainContentScroller = document.querySelector(".spectre-post-container > .container");
  spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  modelViewer = document.getElementById('spectreViewer');

  if (!mainContentScroller) {
    console.error("Main content container not found! Site functionality will be limited.");
    return;
  }

  // Setup primary scroll and resize listeners.
  const scrollOptions = { passive: true };
  mainContentScroller.addEventListener("scroll", handleSpectreNavScroll, scrollOptions);
  mainContentScroller.addEventListener("scroll", updateAside, scrollOptions);
  window.addEventListener("resize", updateAside, scrollOptions);

  // Setup Ship Family Tab Listeners
  const familyTabs = document.querySelectorAll(".ship-family-tabs .family-tab");
  familyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const familyId = tab.dataset.family;
      if (familyId) {
        showFamily(familyId, tab);
      }
    });
  });

  // Initialize the view with the first tab active
  const firstFamilyButton = document.querySelector(".ship-family-tabs button.family-tab");
  if (firstFamilyButton) {
    const firstFamilyId = firstFamilyButton.dataset.family;
    if (firstFamilyId) {
      showFamily(firstFamilyId, firstFamilyButton);
    }
  }

  // Initial UI update
  updateAside();
  handleSpectreNavScroll();
}

// --- SCRIPT INITIALIZATION ---
// This ensures the initPageListeners function runs once the document is fully parsed.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageListeners);
} else {
  // DOM is already ready.
  initPageListeners();
}

// NOTE: The Model Viewer and other functions like setView, recenter, etc., are not included here
// as their logic wasn't the source of the error and was omitted for brevity in the original
// user-provided script. If they use `onclick`, they will need refactoring as well.
