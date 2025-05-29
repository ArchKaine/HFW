// scripts.js

// 1) Build & update the “On This Section” aside
function updateAside() {
  const aside = document.getElementById("section-aside");
  if (!aside) return;
  const list = aside.querySelector("ul");
  if (!list) return;

  const svgIcon =
    '<svg viewBox="0 0 24 24" width="0.8em" height="0.8em" fill="currentColor" ' +
    'style="vertical-align:-0.1em;margin-right:0.6em;opacity:0.7;">' +
    '<path d="M10 17l5-5-5-5v10z"></path></svg>';

  const sections = Array.from(document.querySelectorAll(".section"));
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const offset = vh * 0.35;

  // find the current main section
  let activeSection = null;
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    const top = sec.getBoundingClientRect().top + window.pageYOffset;
    if (scrollY >= top - offset) {
      activeSection = sec;
      break;
    }
  }
  // if at bottom, force last
  if (window.innerHeight + scrollY >= document.body.offsetHeight - 50 && sections.length) {
    activeSection = sections[sections.length - 1];
  }

  list.innerHTML = "";
  if (!activeSection) {
    const li = document.createElement("li");
    li.style.padding = "0.5rem 1rem";
    li.style.fontSize = "0.9rem";
    li.style.color = "#777";
    li.textContent = "No active section sub-headings.";
    list.appendChild(li);
    aside.style.display = "flex";
    return;
  }

  // drill into variants if we’re in the variants section
  let source = activeSection;
  if (activeSection.id === "spectre-variants") {
    const fam = activeSection.querySelector(".ship-family-content-wrapper.active-family-content");
    if (fam) {
      const varc = fam.querySelector(".variant-content.active");
      source = varc || fam;
    }
  }

  const headings = Array.from(source.querySelectorAll("h3, h4"));
  if (!headings.length) {
    const li = document.createElement("li");
    li.style.padding = "0.5rem 1rem";
    li.style.fontSize = "0.9rem";
    li.style.color = "#777";
    li.textContent = "No sub-sections.";
    list.appendChild(li);
    aside.style.display = "flex";
    return;
  }

  let highlighted = false;
  headings.forEach(h => {
    if (!h.id) {
      h.id = activeSection.id + "-" + h.tagName.toLowerCase() + "-" +
             h.textContent.trim().toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]+/g, "");
    }
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.innerHTML = svgIcon + h.textContent.trim();
    if (h.tagName.toLowerCase() === "h4") {
      a.style.paddingLeft = "1.5rem";
    }
    const rect = h.getBoundingClientRect();
    if (!highlighted && rect.top >= 0 && rect.top < offset) {
      a.classList.add("active");
      highlighted = true;
    }
    a.addEventListener("click", e => {
      e.preventDefault();
      window.scrollTo({
        top: document.getElementById(h.id).offsetTop - vh * 0.1,
        behavior: "smooth",
      });
      list.querySelectorAll("a").forEach(n => n.classList.remove("active"));
      a.classList.add("active");
      setTimeout(updateAside, 0);
    });
    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
  // respect hash if nothing auto-highlighted
  if (!highlighted && window.location.hash) {
    const byHash = list.querySelector(`a[href="${window.location.hash}"]`);
    if (byHash) {
      list.querySelectorAll("a").forEach(n => n.classList.remove("active"));
      byHash.classList.add("active");
    }
  }
  aside.style.display = "flex";
}
window.updateAside = updateAside;

// 2) Left-sidebar highlighter
function handleSpectreNavScroll() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  const sections = [];
  navLinks.forEach(link => {
    const sec = document.querySelector(link.getAttribute("href"));
    if (sec) sections.push(sec);
  });
  const scrollY = window.scrollY;
  const offset = window.innerHeight * 0.4;
  let current = "";
  for (let i = sections.length - 1; i >= 0; i--) {
    const top = sections[i].getBoundingClientRect().top + window.pageYOffset;
    if (scrollY >= top - offset) {
      current = sections[i].id;
      break;
    }
  }
  if (window.innerHeight + scrollY >= document.body.offsetHeight - 50 && sections.length) {
    current = sections[sections.length - 1].id;
  }
  navLinks.forEach(link => {
    link.classList.toggle("nav-active", link.getAttribute("href") === `#${current}`);
  });
}

// 3) Family-tabs
function showFamily(familyIdSuffix, clickedFamilyButton) {
  const pc = document.querySelector(".spectre-post-container");
  if (!pc) return;
  pc.querySelectorAll(".ship-family-tabs button.family-tab")
    .forEach(t => t.classList.remove("active-family"));
  if (clickedFamilyButton) clickedFamilyButton.classList.add("active-family");

  pc.querySelectorAll(".ship-family-content-wrapper").forEach(w => {
    w.style.display = "none";
    w.classList.remove("active-family-content");
  });
  const activeWrapper = pc.querySelector(`#content-family-${familyIdSuffix}`);
  if (!activeWrapper) return;
  activeWrapper.style.display = "block";
  activeWrapper.classList.add("active-family-content");

  // activate first variant
  const btns = activeWrapper.querySelectorAll(".variant-tabs button");
  btns.forEach(b => b.classList.remove("active"));
  if (btns[0]) {
    // fire our own function, not rely on .click()
    showVariantContent(btns[0].getAttribute("onclick")
      .match(/'([^']+)'/)[1], btns[0], familyIdSuffix);
  }

  setTimeout(updateAside, 50);
}
window.showFamily = showFamily;

// 4) Variant-tabs (fixed)
function showVariantContent(variantContentId, clickedVariantButton, familyIdSuffix) {
  const fam = document.querySelector(
    `#content-family-${familyIdSuffix}.active-family-content`
  );
  if (!fam) return;

  fam.querySelectorAll(".variant-tabs button")
    .forEach(b => b.classList.remove("active"));
  if (clickedVariantButton) clickedVariantButton.classList.add("active");

  fam.querySelectorAll(".variant-content")
    .forEach(c => c.classList.remove("active"));
  const panel = document.getElementById(variantContentId);
  if (panel) panel.classList.add("active");

  setTimeout(updateAside, 50);
}
window.showVariantContent = showVariantContent;

// 5) model-viewer helpers (unchanged)
const viewer = document.querySelector("#spectreViewer");
const modelMap = {
  shadow: "https://ArchKaine.github.io/ship-models/Spectre_Shadow.glb",
  revenant: "https://ArchKaine.github.io/ship-models/Spectre_Revenant.glb",
  eidolon_shadow: "https://ArchKaine.github.io/ship-models/Eidolon Shadow.glb",
};
let initialOrbit;
if (viewer) {
  viewer.addEventListener("load", () => {
    initialOrbit = viewer.getAttribute("camera-orbit") || "0deg 75deg 7m";
  });
}
function switchModel(key) {
  if (!viewer || !modelMap[key]) return;
  viewer.src = modelMap[key];
  viewer.alt = "Anvil " + key.replace(/_/g, " ");
  const orbits = {
    shadow: "0deg 75deg 7m",
    revenant: "0deg 75deg 10m",
    eidolon_shadow: "0deg 75deg 5m"
  };
  viewer.setAttribute("camera-orbit", orbits[key] || initialOrbit);
  viewer.jumpCameraToGoal();
}
window.switchModel = switchModel;

function setView(orbit) {
  if (!viewer) return;
  viewer.setAttribute("camera-orbit", orbit);
  viewer.jumpCameraToGoal();
}
window.setView = setView;

function recenter() {
  if (!viewer) return;
  viewer.setAttribute("camera-orbit", initialOrbit);
  viewer.jumpCameraToGoal();
}
window.recenter = recenter;

// 6) init on DOM ready
function init() {
  window.addEventListener("scroll", handleSpectreNavScroll);
  window.addEventListener("scroll", updateAside);
  window.addEventListener("hashchange", updateAside);
  window.addEventListener("resize", updateAside);

  // fire the first family into view
  const firstFamily = document.querySelector(".ship-family-tabs button.family-tab");
  if (firstFamily) {
    showFamily(
      firstFamily.getAttribute("onclick").match(/'([^']+)'/)[1],
      firstFamily
    );
  }

  setTimeout(() => {
    updateAside();
    handleSpectreNavScroll();
  }, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
