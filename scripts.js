// ────────────────────────────────────────────────────────────────
// 1) Make updateAside() global so showFamily/Variant can call it
// ────────────────────────────────────────────────────────────────
function updateAside() {
  const aside = document.getElementById("section-aside");
  if (!aside) return;
  const list = aside.querySelector("ul");
  if (!list) return;

  // Arrow icon for each entry
  const svgIcon =
    '<svg viewBox="0 0 24 24" width="0.8em" height="0.8em" fill="currentColor" ' +
    'style="vertical-align:-0.1em;margin-right:0.6em;opacity:0.7;">' +
    '<path d="M10 17l5-5-5-5v10z"></path></svg>';

  // Grab ALL .section containers (not just <section> tags)
  const sections = Array.from(document.querySelectorAll(".section"));
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const offset = vh * 0.35;

  // Find the active main section based on scroll
  let activeSection = null;
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    const top = sec.getBoundingClientRect().top + window.pageYOffset;
    if (scrollY >= top - offset) {
      activeSection = sec;
      break;
    }
  }
  // If at bottom of page, snap to last
  if (
    window.innerHeight + scrollY >= document.body.offsetHeight - 50 &&
    sections.length
  ) {
    activeSection = sections[sections.length - 1];
  }

  // Clear out old entries
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

  // If we're in the Variants section, drill into the active tab's content
  let source = activeSection;
  if (activeSection.id === "spectre-variants") {
    const fam = activeSection.querySelector(
      ".ship-family-content-wrapper.active-family-content"
    );
    if (fam) {
      const varc = fam.querySelector(".variant-content.active");
      source = varc || fam;
    }
  }

  // Gather all <h3> & <h4> under that source
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

  // Build list items
  let highlighted = false;
  headings.forEach((h) => {
    // Ensure each heading has an ID
    if (!h.id) {
      h.id =
        activeSection.id +
        "-" +
        h.tagName.toLowerCase() +
        "-" +
        h.textContent
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "");
    }
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.innerHTML = svgIcon + h.textContent.trim();

    // indent <h4>
    if (h.tagName.toLowerCase() === "h4") {
      a.style.paddingLeft = "1.5rem";
    }

    // highlight based on its position in viewport
    const rect = h.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < offset && !highlighted) {
      a.classList.add("active");
      highlighted = true;
    }

    // smooth scroll + immediate highlight on click
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: document.getElementById(h.id).offsetTop - vh * 0.1,
        behavior: "smooth",
      });
      list.querySelectorAll("a").forEach((n) => n.classList.remove("active"));
      a.classList.add("active");
      setTimeout(updateAside, 0);
    });

    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });

  // If nothing was auto-highlighted, try to respect the URL hash
  if (!highlighted && window.location.hash) {
    const activeByHash = list.querySelector(`a[href="${window.location.hash}"]`);
    if (activeByHash) {
      list.querySelectorAll("a").forEach((n) => n.classList.remove("active"));
      activeByHash.classList.add("active");
    }
  }

  aside.style.display = "flex";
}

// ────────────────────────────────────────────────────────────────
// 2) Left-nav section highlighter (unchanged)
// ────────────────────────────────────────────────────────────────
function handleSpectreNavScroll() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]:not([href="#spectre-top"])');
  const sections = [];
  navLinks.forEach((link) => {
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
  navLinks.forEach((link) => {
    link.classList.toggle("nav-active", link.getAttribute("href") === `#${current}`);
  });
}

// ────────────────────────────────────────────────────────────────
// 3) Tab-switchers (just added updateAside calls)
// ────────────────────────────────────────────────────────────────
function showFamily(familyIdSuffix, clickedFamilyButton) {
  const pc = document.querySelector(".spectre-post-container");
  if (!pc) return;
  pc.querySelectorAll(".ship-family-tabs button.family-tab").forEach((t) =>
    t.classList.remove("active-family")
  );
  clickedFamilyButton?.classList.add("active-family");

  pc.querySelectorAll(".ship-family-content-wrapper").forEach((w) => {
    w.style.display = "none";
    w.classList.remove("active-family-content");
  });
  const activeWrapper = pc.querySelector(`#content-family-${familyIdSuffix}`);
  if (activeWrapper) {
    activeWrapper.style.display = "block";
    activeWrapper.classList.add("active-family-content");
    // ensure the first variant is “active”
    const btns = activeWrapper.querySelectorAll(".variant-tabs button");
    btns.forEach((b) => b.classList.remove("active"));
    if (btns[0]) btns[0].classList.add("active");
    btns[0]?.click(); // this will showVariantContent & queue updateAside
  }

  setTimeout(updateAside, 50);
}

function showVariantContent(variantContentId, clickedVariantButton, familyIdSuffix) {
  const fam = document.querySelector(
    `.ship-family-content-wrapper#content-family-${familyIdSuffix}.active-family-content`
  );
  if (!fam) return;
  fam.querySelectorAll(".variant-tabs button").forEach((b) =>
    b.classList.remove("active")
  );
  clickedVariantButton?.classList.add("active");
  fam.querySelectorAll(".variant-content").forEach((c) =>
    c.classList.remove("active")
  );
  document.getElementById(variantContentId)?.classList.add("active");
  setTimeout(updateAside, 50);
}

// ────────────────────────────────────────────────────────────────
// 4) Model-viewer helpers (unchanged)
// ────────────────────────────────────────────────────────────────
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
  const orbits = { shadow: "0deg 75deg 7m", revenant: "0deg 75deg 10m", eidolon_shadow: "0deg 75deg 5m" };
  viewer.setAttribute("camera-orbit", orbits[key] || initialOrbit);
  viewer.jumpCameraToGoal();
}
function setView(orbit) {
  viewer?.setAttribute("camera-orbit", orbit);
  viewer?.jumpCameraToGoal();
}
function recenter() {
  viewer?.setAttribute("camera-orbit", initialOrbit);
  viewer?.jumpCameraToGoal();
}

// ────────────────────────────────────────────────────────────────
// 5) Wire up on DOMContentLoaded
// ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Left nav highlight
  window.addEventListener("scroll", handleSpectreNavScroll);

  // Aside highlight & menu on scroll / hashchange / resize
  window.addEventListener("scroll", updateAside);
  window.addEventListener("hashchange", updateAside);
  window.addEventListener("resize", updateAside);

  // Kick off for the very first family tab
  const firstFamily = document.querySelector(".ship-family-tabs button.family-tab");
  if (firstFamily) firstFamily.click();

  // Initial run after everything's loaded
  setTimeout(() => {
    updateAside();
    handleSpectreNavScroll();
  }, 250);
});
