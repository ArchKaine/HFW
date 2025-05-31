  // Cache frequently accessed DOM elements
  const asideElement = document.getElementById("section-aside");
  const asideTocList = asideElement ? asideElement.querySelector("ul.aside-toc") : null;
  const mainContentScroller = document.querySelector(".spectre-post-container > .container");
  const spectreNavLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  const pageSections = Array.from(document.querySelectorAll(".spectre-post-container > .container > .section"));
  const modelViewer = document.getElementById('spectreViewer');

  // Model Viewer Data
  const modelBaseURL = "https://ArchKaine.github.io/ship-models/";
  const models = {
      shadow: { src: modelBaseURL + "Spectre_Shadow.glb", alt: "Anvil Spectre Shadow" },
      revenant: { src: modelBaseURL + "Spectre_Revenant.glb", alt: "Anvil Spectre Revenant" },
      eidolon_shadow: { src: modelBaseURL + "Eidolon_Shadow.glb", alt: "Anvil Eidolon Shadow" },
  };

  // 1) Build & update the “On This Section” aside
  function updateAside() {
    if (!asideElement || !asideTocList || !mainContentScroller) return;

    const svgIcon =
      '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" ' +
      'style="vertical-align:-0.1em;margin-right:0.8em;opacity:0.7;">' +
      '<path d="M10 17l5-5-5-5v10z"></path></svg>';

    const viewportHeight = window.innerHeight;
    const activationOffset = viewportHeight * 0.35; 

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
  window.updateAside = updateAside;

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
  window.showFamily = showFamily;

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
  window.showVariantContent = showVariantContent;

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
  window.switchModel = switchModel;
  window.setView = setView;
  window.recenter = recenter;

  function initPageListeners() {
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

    const firstFamilyButton = document.querySelector(".ship-family-tabs button.family-tab");
    if (firstFamilyButton) {
         const clickEvent = firstFamilyButton.getAttribute('onclick');
         if (clickEvent) {
            const familyIdSuffixMatch = clickEvent.match(/'([^']+)'/);
            if (familyIdSuffixMatch && familyIdSuffixMatch[1]) {
                showFamily(familyIdSuffixMatch[1], firstFamilyButton);
            }
         }
    } else { 
        updateAside();
        handleSpectreNavScroll();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageListeners);
  } else {
    initPageListeners();
  }

  window.addEventListener("load", () => {
      updateAside();
      handleSpectreNavScroll(); 
      // The model-viewer tag itself now defines interaction-prompt="none".
      // We will let its 'reveal' attribute use its default ("auto") if not specified on the tag.
      // So, no need to set these via JS here unless specifically overriding.
  } , { passive: true });
