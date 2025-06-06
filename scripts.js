/**
 * HFW Shadow Fleet - scripts.js (Corrected & Refactored)
 * Manages all interactive elements of the HFW design document.
 */

// --- GLOBAL VARIABLES & CONFIG (Moved DOM selectors into initPageListeners) ---

// Model Viewer Data
const modelBaseURL = "https://ArchKaine.github.io/ship-models/";
const models = {
    shadow: { src: modelBaseURL + "Spectre_Shadow.glb", alt: "Anvil Spectre Shadow" },
    revenant: { src: modelBaseURL + "Spectre_Revenant.glb", alt: "Anvil Spectre Revenant" },
    eidolon_shadow: { src: modelBaseURL + "Eidolon_Shadow.glb", alt: "Anvil Eidolon Shadow" },
};

// --- FUNCTION DEFINITIONS ---

/**
 * Builds and updates the "On This Section" table of contents.
 * @param {HTMLElement} asideElement - The main aside container.
 * @param {HTMLElement} mainContentScroller - The main scrolling container.
 */
function updateAside(asideElement, mainContentScroller) {
  if (!asideElement || !mainContentScroller) return;
  const asideTocList = asideElement.querySelector("ul.aside-toc");
  if (!asideTocList) return;

  const svgIcon =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" ' +
    'style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;">' +
    '<path d="M10 17l5-5-5-5v10z"></path></svg>';

  const viewportHeight = window.innerHeight;
  const activationOffset = viewportHeight * 0.35; 

  const pageSections = Array.from(mainContentScroller.querySelectorAll(":scope > .section"));
  let activeSection = null;
  
  for (let i = pageSections.length - 1; i >= 0; i--) {
    const sec = pageSections[i];
    const rect = sec.getBoundingClientRect(); 
    if (rect.top < activationOffset && rect.bottom > activationOffset * 0.2) { 
      activeSection = sec;
      break;
    }
  }
  
  if (!activeSection && pageSections.length > 0 && mainContentScroller.scrollTop < 50) {
      activeSection = pageSections[0];
  } else if (mainContentScroller.scrollTop + mainContentScroller.clientHeight >= mainContentScroller.scrollHeight - 50 && pageSections.length) {
      activeSection = pageSections[pageSections.length - 1];
  }

  asideTocList.innerHTML = ""; 

  if (!activeSection) {
    const li = document.createElement("li");
    li.textContent = "Scroll to a section.";
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
    const sectionTitleElement = activeSection.querySelector('h2');
    const sectionTitle = sectionTitleElement ? (Array.from(sectionTitleElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(' ').trim() || sectionTitleElement.textContent.trim()) : 'current section';
    li.textContent = `No sub-headings in ${sectionTitle}.`;
    asideTocList.appendChild(li);
    asideElement.style.display = "flex";
    return;
  }

  let anItemWasHighlighted = false;
  headings.forEach((h) => {
    if (!h.id) { 
      h.id = `<span class="math-inline">\{activeSection\.id\}\-</span>{h.tagName.toLowerCase()}-${h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")}`.replace(/[^a-zA-Z0-9-_]/g, '');
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
      asideTocList.querySelectorAll("a").forEach((link) => link.classList.remove("active"));
      a.classList.add("active");
    });
    const li = document.createElement("li");
    li.appendChild(a);
    asideTocList.appendChild(li);
  });

  if (!anItemWasHighlighted && window.location.hash) {
      const activeLinkByHash = asideTocList.querySelector(`a[href="${window.location.hash}"]`);
      if (activeLinkByHash) {
          asideTocList.querySelectorAll("a").forEach(link => link.classList.remove("active"));
          activeLinkByHash.classList.add("active");
      }
  }
  asideElement.style.display = "flex";
}

/**
 * Highlights the main navigation links based on scroll position.
 * @param {NodeListOf<Element>} spectreNavLinks - The collection of main navigation links.
 * @param {HTMLElement} mainContentScroller - The main scrolling container.
 */
function handleSpectreNavScroll(spectreNavLinks, mainContentScroller) {
  if (!mainContentScroller || !spectreNavLinks) return;
  
  let currentNavId = "";
  const navActivationOffset = window.innerHeight * 0.4; 

  for (let i = spectreNavLinks.length - 1; i >= 0; i--) {
    const link = spectreNavLinks[i];
    const sectionId = link.getAttribute("href");
    if (sectionId && sectionId.startsWith("#")) {
        const sec = document.getElementById(sectionId.substring(1));
        if (sec) {
            const rect = sec.getBoundingClientRect();
            if (rect.top < navActivationOffset && rect.bottom > navActivationOffset * 0.2 ) { 
              currentNavId = sec.id;
              break;
            }
        }
    }
  }
  
  if (!currentNavId) {
    const firstNavLink = spectreNavLinks[0];
    const firstSectionId = firstNavLink ? firstNavLink.getAttribute("href") : null;
    if (firstSectionId && document.getElementById(firstSectionId.substring(1))) {
        if (mainContentScroller.scrollTop < 50) currentNavId = firstSectionId.substring(1);
    }
  }

  spectreNavLinks.forEach((link) => {
    link.classList.toggle("nav-active", link.getAttribute("href") === `#${currentNavId}`);
  });
}

/**
 * Displays the content for a specific ship family.
 * @param {string} familyIdSuffix - The suffix for the family ID (e.g., 'spectre').
 * @param {HTMLElement} btnEl - The button element that was clicked.
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
          // Re-query asideElement and mainContentScroller here or pass them as args
          const aside = document.getElementById("section-aside");
          const scroller = document.querySelector(".spectre-post-container > .container");
          updateAside(aside, scroller);
      }
  }
}

/**
 * Displays content for a specific ship variant.
 * @param {string} variantId 
 * @param {HTMLElement} btnEl 
 * @param {string} familyId 
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
    const aside = document.getElementById("section-aside");
    const scroller = document.querySelector(".spectre-post-container > .container");
    updateAside(aside, scroller);
}

// --- MODEL VIEWER FUNCTIONS (No change) ---
// ... switchModel, setView, recenter functions are unchanged ...

/**
 * Main initialization function to set up all page listeners.
 */
function initPageListeners() {
  // --- ROBUST ELEMENT CACHING ---
  // We query for elements here, inside init, to ensure the DOM is ready.
  const asideElement = document.getElementById("section-aside");
  const mainContentScroller = document.querySelector(".spectre-post-container > .container");
  const spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  
  if (!asideElement || !mainContentScroller || !spectreNavLinks) {
      console.error("Core layout elements not found! Site functionality will be limited.");
      return;
  }

  // Setup primary scroll and resize listeners, passing cached elements
  const scrollOptions = { passive: true }; 
  mainContentScroller.addEventListener("scroll", () => handleSpectreNavScroll(spectreNavLinks, mainContentScroller), scrollOptions);
  mainContentScroller.addEventListener("scroll", () => updateAside(asideElement, mainContentScroller), scrollOptions);
  window.addEventListener("resize", () => updateAside(asideElement, mainContentScroller), scrollOptions); 

  // --- Setup Ship Family Tab Listeners ---
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
