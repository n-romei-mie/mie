/**
 * WEBFLOW + VIEW TRANSITION API + GSAP
 * Versione Omnicomprensiva con WG Team Module
 */

// Registrazione Plugin GSAP
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// --- 1. ANIMAZIONI INGRESSO (data-transition) ---
function initializeAnimations(isTransition = false) {
    const dynamicDelay = isTransition ? 1.1 : 0.2;
    const linkDelay = isTransition ? 1.2 : 0.4;

    const links = document.querySelectorAll(".link a");
    if (links.length > 0) {
        gsap.set(links, { y: "100%" });
        gsap.to(links, { y: "0%", duration: 1, stagger: 0.1, ease: "power4.out", delay: linkDelay });
    }

    const elementsToAnimate = document.querySelectorAll('[data-transition]');
    elementsToAnimate.forEach(el => {
        if (el.classList.contains('split-done')) return;

        const split = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        split.lines.forEach(line => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('line-wrapper');
            line.parentNode.insertBefore(wrapper, line);
            wrapper.appendChild(line);
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'block';
            line.style.display = 'block';
        });

        const spans = el.querySelectorAll(".line-inner");
        gsap.set(spans, { y: "110%" });
        el.classList.add('split-done');
        el.style.opacity = "1";

        gsap.to(spans, {
            y: "0%",
            duration: 1.2,
            stagger: 0.08,
            ease: "power3.out",
            delay: dynamicDelay
        });
    });
}

// --- 2. MWG EFFECT 029 (SCROLL WORDS) ---
function initMwgEffect029() {
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph || paragraph.dataset.processed === "true") return;
    paragraph.dataset.processed = "true";

    paragraph.innerHTML = paragraph.textContent.split(" ").map(w => `<span>${w}</span>`).join(" ");
    const words = paragraph.querySelectorAll("span");
    words.forEach(w => w.classList.add("word" + Math.floor(Math.random() * 4)));

    const configs = [{c:".word1", x:"-0.8em"}, {c:".word2", x:"1.6em"}, {c:".word3", x:"-2.4em"}];
    configs.forEach(conf => {
        document.querySelectorAll(`.mwg_effect029 ${conf.c}`).forEach(el => {
            gsap.to(el, {
                x: conf.x,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 90%", end: "bottom 10%", scrub: 0.2 }
            });
        });
    });
}

// --- 3. LOGO WALL CYCLE ---
function initLogoWallCycle() {
    document.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
        if (root.dataset.initialized === "true") return;
        root.dataset.initialized = "true";
        const list = root.querySelector("[data-logo-wall-list]");
        const items = Array.from(list?.querySelectorAll("[data-logo-wall-item]") || []);
        if (!items.length) return;

        const originalTargets = items.map(item => item.querySelector("[data-logo-wall-target]")).filter(Boolean);
        let tl, pool = [], visibleItems = [], pattern = [], patternIndex = 0;

        const setup = () => {
            if (tl) tl.kill();
            visibleItems = items.filter(el => window.getComputedStyle(el).display !== "none");
            const visibleCount = visibleItems.length;
            pattern = Array.from({ length: visibleCount }, (_, i) => i).sort(() => Math.random() - 0.5);
            items.forEach(item => item.querySelectorAll("[data-logo-wall-target]").forEach(old => old.remove()));
            pool = originalTargets.map(n => n.cloneNode(true)).sort(() => Math.random() - 0.5);
            for (let i = 0; i < visibleCount; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                parent.appendChild(pool.shift());
            }
            tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.call(() => {
                const idx = pattern[patternIndex % visibleCount];
                patternIndex++;
                const container = visibleItems[idx];
                const parent = container.querySelector("[data-logo-wall-target-parent]") || container;
                const current = parent.querySelector("[data-logo-wall-target]");
                const incoming = pool.shift();
                if (!incoming || !current) return;
                gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
                parent.appendChild(incoming);
                gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => { current.remove(); pool.push(current); }});
                gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration: 0.9, delay: 0.1, ease: "expo.inOut" });
            });
        };
        setup();
        ScrollTrigger.create({ trigger: root, onEnter: () => tl.play(), onLeave: () => tl.pause() });
    });
}

// --- 4. ABOUT GRID FLIP ---
function initAboutGridFlip() {
    const grid = document.querySelector(".about__grid-wrap");
    const items = grid?.querySelectorAll(".ag__img");
    const btnBig = document.querySelector(".ag__trigger.is--big");
    const btnSmall = document.querySelector(".ag__trigger.is--small");
    if (!grid || !items?.length) return;

    const switchLayout = (toBig) => {
        const state = Flip.getState(items);
        toBig ? (grid.classList.add("is--big"), grid.classList.remove("is--small")) : (grid.classList.add("is--small"), grid.classList.remove("is--big"));
        Flip.from(state, { duration: 1.3, ease: "power4.inOut", scale: true, onComplete: () => ScrollTrigger.refresh() });
    };
    if (btnBig) btnBig.onclick = () => switchLayout(true);
    if (btnSmall) btnSmall.onclick = () => switchLayout(false);
}

// --- 5. WG TEAM MODULE ---
function initWGTeamModule() {
  const nameItems = gsap.utils.toArray(".wg__collection-name-item");
  const imageItems = gsap.utils.toArray(".wg__item");
  const roleItems = gsap.utils.toArray(".wg__right-role-wrap");
  const mobileRoles = gsap.utils.toArray(".wg__right-role-wrap-mobile");
  const namesWrapper = document.querySelector(".wg__collection-name-list");

  if (!nameItems.length || !imageItems.length) return;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  const imageByOrder = {};
  imageItems.forEach(img => { if (img.dataset.order) imageByOrder[img.dataset.order] = img; });

  const roleByOrder = {};
  roleItems.forEach(role => { if (role.dataset.order) roleByOrder[role.dataset.order] = role; });

  const defaultOrder = "1";
  gsap.set(nameItems, { opacity: 0.5 });
  gsap.set(imageItems, { autoAlpha: 0 });
  gsap.set(roleItems, { autoAlpha: 0 });
  gsap.set(mobileRoles, { display: "none" });

  if (imageByOrder[defaultOrder]) gsap.set(imageByOrder[defaultOrder], { autoAlpha: 1 });
  const defaultName = nameItems.find(el => el.dataset.order === defaultOrder);
  if (defaultName) gsap.set(defaultName, { opacity: 1 });

  let activeRole = null;

  const showByOrder = (order, pointerClientY) => {
    if (!order) return;
    gsap.set(nameItems, { opacity: 0.5 });
    const activeName = nameItems.find(el => el.dataset.order === order);
    if (activeName) gsap.set(activeName, { opacity: 1 });

    if (imageByOrder[order]) {
      gsap.set(imageItems, { autoAlpha: 0 });
      gsap.set(imageByOrder[order], { autoAlpha: 1 });
    }

    if (isMobile) return;
    gsap.set(roleItems, { autoAlpha: 0 });
    activeRole = roleByOrder[order] || null;
    if (activeRole && namesWrapper && typeof pointerClientY === "number") {
      const bounds = namesWrapper.getBoundingClientRect();
      gsap.set(activeRole, { y: pointerClientY - bounds.top });
      gsap.set(activeRole, { autoAlpha: 1 });
    }
  };

  nameItems.forEach(nameEl => {
    const order = nameEl.dataset.order;
    nameEl.addEventListener("mouseenter", (e) => { if (!isMobile) showByOrder(order, e.clientY); });
    nameEl.addEventListener("click", (e) => {
      if (!isMobile) return;
      e.preventDefault();
      showByOrder(order);
      gsap.set(mobileRoles, { display: "none" });
      const mobileRole = nameEl.querySelector(".wg__right-role-wrap-mobile");
      if (mobileRole) gsap.set(mobileRole, { display: "block" });
    });
  });

  if (!isMobile && namesWrapper) {
    namesWrapper.addEventListener("mousemove", (e) => {
      if (!activeRole) return;
      const bounds = namesWrapper.getBoundingClientRect();
      gsap.to(activeRole, { y: e.clientY - bounds.top, duration: 0.25, ease: "power3.out", overwrite: "auto" });
    });
  }
}

// --- 6. NAVIGAZIONE (VIEW TRANSITIONS) ---
if (window.navigation) {
    navigation.addEventListener("navigate", (event) => {
        if (!event.destination.url.includes(window.location.origin)) return;
        event.intercept({
            handler: async () => {
                try {
                    const response = await fetch(event.destination.url);
                    const text = await response.text();
                    const doc = new DOMParser().parseFromString(text, "text/html");
                    if (document.startViewTransition) {
                        const transition = document.startViewTransition(() => {
                            document.body.innerHTML = doc.body.innerHTML;
                            document.title = doc.title;
                        });
                        transition.ready.then(() => finalizePage(true));
                    } else {
                        document.body.innerHTML = doc.body.innerHTML;
                        finalizePage(true);
                    }
                } catch (err) { window.location.href = event.destination.url; }
            },
            scroll: "manual"
        });
    });
}

// --- 7. FINALIZE & RESET ---
function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    if (window.lenis) { window.lenis.scrollTo(0, { immediate: true }); window.lenis.resize(); }

    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
    }

    // Inizializza moduli
    initMwgEffect029();
    initLogoWallCycle();
    initAboutGridFlip();
    initWGTeamModule();
    initializeAnimations(isTransition);

    setTimeout(() => { ScrollTrigger.refresh(); }, 250);
}

// Avvio Iniziale
window.addEventListener("DOMContentLoaded", () => finalizePage(false));
