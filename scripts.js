/**
 * HFW Shadow Fleet - scripts.js (Refactored to use modern event listeners)
 * Manages all interactive elements of the HFW design document.
 */

// --- CACHED DOM ELEMENTS (No changes here) ---
const asideElement = document.getElementById("section-aside");
const asideTocList = asideElement ? asideElement.querySelector("ul.aside-toc") : null;
const mainContentScroller = document.querySelector(".spectre-post-container > .container");
const spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
const pageSections = Array.from(document.querySelectorAll(".spectre-post-container > .container > .section"));
const modelViewer = document.getElementById('spectreViewer');


// --- MODEL VIEWER DATA (No changes here) ---
const modelBaseURL = "https://ArchKaine.github.io/ship-models/";
const models = {
    shadow: { src: modelBaseURL + "Spectre_Shadow.glb", alt: "Anvil Spectre Shadow" },
    revenant: { src: modelBaseURL + "Spectre_Revenant.glb", alt: "Anvil Spectre Revenant" },
    eidolon_shadow: { src: modelBaseURL + "Eidolon_Shadow.glb", alt: "Anvil Eidolon Shadow" },
};


// --- FUNCTION DEFINITIONS (No longer global) ---

/**
 * Builds and updates the "On This Section" table of contents in the aside panel
 * based on the currently visible section in the viewport.
 */
function updateAside() {
  if (!asideElement || !asideTocList || !mainContentScroller) return;

  const svgIcon =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" ' +
    'style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;">' +
    '<path d="M10 17l5-5-5-5v10z"></path></svg>';

  const viewportHeight = window.innerHeight;
  const activationOffset = viewportHeight * 0.35; 

  let activeSection = null;
  // Use a different method to find visible sections that works with dynamic loading
  const currentlyVisibleSections = Array.from(document.querySelectorAll(".spectre-post-container > .container > .section"))
                                      .filter(sec => sec.offsetParent !== null);
  
  for (let i = currentlyVisibleSections.length - 1; i >= 0; i--) {
    const sec = currentlyVisibleSections[i];
    const rect = sec.getBoundingClientRect(); 
    if (rect.top < activationOffset && rect.bottom > activationOffset * 0.2) { 
      activeSection = sec;
      break;
    }
  }
  
  if (!activeSection && currentlyVisibleSections.length > 0 && mainContentScroller.scrollTop < 50) {
      activeSection = currentlyVisibleSections[0];
  } else if (mainContentScroller.scrollTop + mainContentScroller.clientHeight >= mainContentScroller.scrollHeight - 50 && currentlyVisibleSections.length) {
      activeSection = currentlyVisibleSections[currentlyVisibleSections.length - 1];
  }

  asideTocList.innerHTML = ""; 

  if (!activeSection) {
    const li = document.createElement("li");
    li.style.padding = "0.5rem 1rem";
    li.style.fontSize = "0.9rem";
    li.style.color = "#777";
    li.textContent = "Scroll to a section.";
    asideTocList.appendChild(li);
    asideElement.style.display = "flex"; 
    return;
  }

  let sourceForHeadings = activeSection;
  if (activeSection.id === "spectre-variants") {
    const activeFamilyContent = activeSection.querySelector(
      ".ship-family-content-wrapper.active-family-content"
    );
    if (activeFamilyContent) {
      sourceForHeadings =
        activeFamilyContent.querySelector(".variant-content.active") ||
        activeFamilyContent;
    }
  }

  const headings = Array.from(
    sourceForHeadings.querySelectorAll("h2, h3, h4")
  );

  if (!headings.length) {
    const li = document.createElement("li");
    li.style.padding = "0.5rem 1rem";
    li.style.fontSize = "0.9rem";
    li.style.color = "#777";
    const sectionTitleElement = activeSection.querySelector('h2');
    const sectionTitle = sectionTitleElement ? Array.from(sectionTitleElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(' ').trim() || sectionTitleElement.textContent.trim() : 'current section';
    li.textContent = `No sub-headings in ${sectionTitle}.`;
    asideTocList.appendChild(li);
    asideElement.style.display = "flex";
    return;
  }

  let anItemWasHighlighted = false;
  headings.forEach((h) => {
    if (!h.id) { 
      h.id = `${activeSection.id}-${h.tagName.toLowerCase()}-${h.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")}`.replace(/[^a-zA-Z0-9-_]/g, '');
    }
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    const headingText = Array.from(h.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(' ').trim() || h.textContent.trim();
    a.innerHTML = svgIcon + headingText;

    if (h.tagName.toLowerCase() === "h4") {
      a.style.paddingLeft = "1.5rem"; 
    }

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
          
          mainContentScroller.scrollTo({
              top: Math.max(0, scrollToPosition), 
              behavior: "smooth",
          });
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
 * Highlights the main navigation links based on the current scroll position.
 */
function handleSpectreNavScroll() {
  if (!mainContentScroller) return;
  const sectionsForNav = [];
  spectreNavLinks.forEach(link => {
      const sectionId = link.getAttribute("href");
      if (sectionId && sectionId.startsWith("#")) {
          const sec = document.getElementById(sectionId.substring(1));
          if (sec) sectionsForNav.push(sec);
      }
  });

  let currentNavId = "";
  const navActivationOffset = window.innerHeight * 0.4; 

  for (let i = sectionsForNav.length - 1; i >= 0; i--) {
    const sec = sectionsForNav[i];
    const rect = sec.getBoundingClientRect();
    if (rect.top < navActivationOffset && rect.bottom > navActivationOffset * 0.2 ) { 
      currentNavId = sec.id;
      break;
    }
  }
  if (!currentNavId && sectionsForNav.length > 0 && mainContentScroller.scrollTop < 50) {
       currentNavId = sectionsForNav[0].id;
  } else if (mainContentScroller.scrollTop + mainContentScroller.clientHeight >= mainContentScroller.scrollHeight - 50 && sectionsForNav.length) {
      currentNavId = sectionsForNav[sectionsForNav.length - 1].id;
  }

  spectreNavLinks.forEach((link) => {
    link.classList.toggle(
      "nav-active",
      link.getAttribute("href") === `#${currentNavId}`
    );
  });
}

/**
 * Displays the content for a specific ship family.
 * @param {string} familyIdSuffix - The suffix for the family ID (e.g., 'spectre').
 * @param {HTMLElement} btnEl - The button element that was clicked.
 */
function showFamily(familyIdSuffix, btnEl) {
  document.querySelectorAll(".ship-family-content-wrapper").forEach(function (wrapper) {
      wrapper.style.display = "none";
      wrapper.classList.remove("active-family-content");
  });
  document.querySelectorAll(".ship-family-tabs button.family-tab").forEach(function (tab) {
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
          // This logic will need to be refactored next
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
  } else {
      updateAside(); 
  }
}

/**
 * Displays the content for a specific ship variant within a family.
 * NOTE: This function still relies on onclick attributes for its parameters.
 * We will refactor this in the next step.
 * @param {string} variantId 
 * @param {HTMLElement} btnEl 
 * @param {string} familyId 
 */
function showVariantContent(variantId, btnEl, familyId) { 
    const familyContentWrapper = document.getElementById('content-family-' + familyId);
    if (!familyContentWrapper) return;

    familyContentWrapper.querySelectorAll(".variant-content").forEach(function (content) {
        content.style.display = "none";
        content.classList.remove("active");
    });
    familyContentWrapper.querySelectorAll(".variant-tabs button").forEach(function (tab) {
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

// --- MODEL VIEWER FUNCTIONS (No change in function logic) ---
function switchModel(modelKey) {
  if (modelViewer && models[modelKey]) {
    modelViewer.src = models[modelKey].src;
    modelViewer.alt = models[modelKey].alt;
    if (modelViewer.getAttribute('reveal') !== 'interaction') {
      modelViewer.setAttribute('reveal', 'interaction');
    }
  }
}

function setView(orbitString) {
  if (modelViewer) modelViewer.cameraOrbit = orbitString;
}

function recenter() {
  if (modelViewer) {
    modelViewer.cameraTarget = "auto auto auto";
    modelViewer.cameraOrbit = "0deg 75deg 7m"; 
  }
}

/**
 * Main initialization function to set up all page listeners.
 * This function will be called by content-loader.js after sections are loaded.
 */
function initPageListeners() {
  // Setup primary scroll and resize listeners
  const scrollOptions = { passive: true }; 
  if (mainContentScroller) {
      mainContentScroller.addEventListener("scroll", handleSpectreNavScroll, scrollOptions);
      mainContentScroller.addEventListener("scroll", updateAside, scrollOptions);
  } else {
      window.addEventListener("scroll", handleSpectreNavScroll, scrollOptions);
      window.addEventListener("scroll", updateAside, scrollOptions);
  }
  window.addEventListener("hashchange", updateAside); 
  window.addEventListener("resize", updateAside, scrollOptions); 

  // --- REFACTORED: Setup Ship Family Tab Listeners ---
  const familyTabs = document.querySelectorAll(".ship-family-tabs .family-tab");
  familyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // dataset.family corresponds to the data-family="spectre" attribute
      const familyId = tab.dataset.family;
      if (familyId) {
        showFamily(familyId, tab);
      }
    });
  });
  // --- END OF REFACTORED LOGIC ---

  // Initialize the view with the first tab active
  const firstFamilyButton = document.querySelector(".ship-family-tabs button.family-tab");
  if (firstFamilyButton) {
      const firstFamilyId = firstFamilyButton.dataset.family; // Use the new data attribute
      if (firstFamilyId) {
          showFamily(firstFamilyId, firstFamilyButton);
      }
  } else { 
      // Fallback if no tabs are present
      updateAside();
      handleSpectreNavScroll();
  }
}
// Expose the init function to the global scope so content-loader.js can call it.
window.initPageListeners = initPageListeners;

// --- INITIALIZATION IS NOW HANDLED BY content-loader.js AFTER DYNAMIC CONTENT IS LOADED ---
// The old DOMContentLoaded listener has been removed from this file.


// --- FINAL PAGE LOAD LISTENER (No changes here) ---
window.addEventListener("load", () => {
    updateAside();
    handleSpectreNavScroll(); 
} , { passive: true });
