/**
 * HFW Shadow Fleet - scripts.js (v8 - Corrected Model Viewer ID)
 * Dynamically loads section content and manages all page interactivity.
 */

// Top-level variables for globally accessed DOM elements
let asideElement, mainContentScroller, spectreNavLinks, modelViewer;

// Model Viewer Data
const modelBaseURL = "https://ArchKaine.github.io/ship-models/";
const models = {
    shadow: { src: modelBaseURL + "Spectre_Shadow.glb", alt: "Anvil Spectre Shadow" },
    revenant: { src: modelBaseURL + "Spectre_Revenant.glb", alt: "Anvil Spectre Revenant" },
    eidolon_shadow: { src: modelBaseURL + "Eidolon_Shadow.glb", alt: "Anvil Eidolon Shadow" },
    daemon: { src: modelBaseURL + "HFW_Daemon_Racing_Ship.glb", alt: "Anvil Daemon" },
};


// --- FUNCTION DEFINITIONS ---

function updateAside() {
  if (!asideElement || !mainContentScroller) return;
  const asideTocList = asideElement.querySelector("ul.aside-toc");
  if (!asideTocList) return;
  const svgIcon = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;"><path d="M10 17l5-5-5-5v10z"></path></svg>';
  const activationOffset = window.innerHeight * 0.35;
  const pageSections = Array.from(mainContentScroller.querySelectorAll(":scope > .section"));
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
  if (!activeSection && pageSections.length > 0 && pageSections[0].offsetParent !== null && mainContentScroller.scrollTop < 50) {
    activeSection = pageSections[0];
  }
  asideTocList.innerHTML = "";
  if (!activeSection) {
    const li = document.createElement("li");
    li.textContent = "Scroll to a section.";
    li.style.cssText = "padding: 0.5rem 1rem; font-size: 0.9rem; color: #777;";
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
  if (!headings.length) {
    const li = document.createElement("li");
    const titleEl = activeSection.querySelector('h2');
    const titleText = titleEl ? (Array.from(titleEl.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent.trim()).join(' ').trim() || titleEl.textContent.trim()) : 'current section';
    li.textContent = `No sub-headings in ${titleText}.`;
    li.style.cssText = "padding: 0.5rem 1rem; font-size: 0.9rem; color: #777;";
    asideTocList.appendChild(li);
    return;
  }
  headings.forEach(h => {
    if (!h.id) h.id = `${activeSection.id}-${h.tagName.toLowerCase()}-${h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")}`;
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    const headingText = Array.from(h.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent.trim()).join(' ').trim() || h.textContent.trim();
    a.innerHTML = svgIcon + headingText;
    if (h.tagName.toLowerCase() === "h4") a.style.paddingLeft = "1.5rem";
    a.addEventListener("click", e => {
      e.preventDefault();
      const targetElement = document.getElementById(h.id);
      if (targetElement && mainContentScroller) {
        const scrollerRect = mainContentScroller.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const scrollToPosition = targetRect.top - scrollerRect.top + mainContentScroller.scrollTop - (window.innerHeight * 0.1);
        mainContentScroller.scrollTo({ top: Math.max(0, scrollToPosition), behavior: "smooth" });
      }
    });
    const li = document.createElement("li");
    li.appendChild(a);
    asideTocList.appendChild(li);
  });
}

function handleSpectreNavScroll() {
  if (!mainContentScroller || !spectreNavLinks) return;
  let currentNavId = "";
  const navActivationOffset = window.innerHeight * 0.4;
  spectreNavLinks.forEach(link => {
    const sectionId = link.getAttribute("href");
    const sec = sectionId.startsWith("#") ? document.getElementById(sectionId.substring(1)) : null;
    if (sec && sec.offsetParent !== null) {
      const rect = sec.getBoundingClientRect();
      if (rect.top < navActivationOffset) currentNavId = sec.id;
    }
  });
  spectreNavLinks.forEach(link => link.classList.toggle("nav-active", link.getAttribute("href") === `#${currentNavId}`));
}

function showFamily(familyIdSuffix, btnEl) {
  document.querySelectorAll(".ship-family-content-wrapper").forEach(w => {
    w.style.display = "none";
    w.classList.remove("active-family-content");
  });
  document.querySelectorAll(".ship-family-tabs button.family-tab").forEach(t => t.classList.remove("active-family"));
  const contentToShow = document.getElementById("content-family-" + familyIdSuffix);
  if (contentToShow) {
    contentToShow.style.display = "block";
    contentToShow.classList.add("active-family-content");
  }
  if (btnEl) btnEl.classList.add("active-family");
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

function switchModel(modelKey) {
  if (modelViewer && models[modelKey]) {
    modelViewer.src = models[modelKey].src;
    modelViewer.alt = models[modelKey].alt;
  } else {
      console.error("Could not switch model. ModelViewer element found:", modelViewer, "Model key valid:", models.hasOwnProperty(modelKey));
  }
}

function setView(orbitString) {
  if (modelViewer) {
    modelViewer.cameraOrbit = orbitString;
  }
}

function recenter() {
  if (modelViewer) {
    modelViewer.cameraTarget = "auto auto auto";
    modelViewer.cameraOrbit = "0deg 75deg 7m";
  }
}

/**
 * Main initialization function to set up all page listeners.
 */
function initPageListeners() {
  // Assign elements to top-level variables.
  asideElement = document.getElementById("section-aside");
  mainContentScroller = document.querySelector(".spectre-post-container > .container");
  spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  
  // --- THIS IS THE FIX ---
  // Look for either the old ID or the new ID to make the script more robust.
  modelViewer = document.getElementById('spectreViewerInComponent') || document.getElementById('spectreViewer');

  if (!modelViewer) {
      console.error("CRITICAL: model-viewer element not found with ID 'spectreViewerInComponent' or 'spectreViewer'. Model controls will not work.");
  }
  
  if (!mainContentScroller) {
    console.error("Main content container not found!");
    return;
  }

  // Setup primary scroll and resize listeners.
  mainContentScroller.addEventListener("scroll", handleSpectreNavScroll, { passive: true });
  mainContentScroller.addEventListener("scroll", updateAside, { passive: true });
  window.addEventListener("resize", updateAside, { passive: true });

  // Setup All Tab Listeners
  document.querySelectorAll(".ship-family-tabs .family-tab").forEach(tab => {
    tab.addEventListener('click', () => { if (tab.dataset.family) showFamily(tab.dataset.family, tab); });
  });
  document.querySelectorAll(".variant-tabs button").forEach(tab => {
    tab.addEventListener('click', () => { if (tab.dataset.variantId && tab.dataset.familyId) showVariantContent(tab.dataset.variantId, tab, tab.dataset.familyId); });
  });

  // Setup Model Viewer Control Listeners
  document.querySelectorAll('.model-switch-btn').forEach(button => {
    button.addEventListener('click', () => { if (button.dataset.modelKey) switchModel(button.dataset.modelKey); });
  });
  document.querySelectorAll('.view-set-btn').forEach(button => {
    button.addEventListener('click', () => { if (button.dataset.cameraOrbit) setView(button.dataset.cameraOrbit); });
  });
  const recenterBtn = document.getElementById('recenter-btn');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', recenter);
  }

  // Initialize the view
  const firstFamilyButton = document.querySelector(".ship-family-tabs button.family-tab");
  if (firstFamilyButton && firstFamilyButton.dataset.family) {
    showFamily(firstFamilyButton.dataset.family, firstFamilyButton);
  }

  // Final initial UI update
  updateAside();
  handleSpectreNavScroll();
}

// --- SCRIPT INITIALIZATION ---
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageListeners);
} else {
  initPageListeners();
}
