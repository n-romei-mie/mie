/**
 * WEBFLOW ULTIMATE ENGINE - Versione Integrata e Corretta
 */

// Registrazione Plugin
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
        gsap.to(spans, { y: "0%", duration: 1.2, stagger: 0.08, ease: "power3.out", delay: dynamicDelay });
    });
}

// --- 2. MWG EFFECT 029 – SCROLL WORDS ---
function wrapWordsInSpan(element) {
    const text = element.textContent;
    element.innerHTML = text.split(" ").map((word) => `<span>${word}</span>`).join(" ");
}

function initMwgEffect029() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.to(".scroll", {
        autoAlpha: 0,
        duration: 0.2,
        scrollTrigger: {
            trigger: ".mwg_effect029",
            start: "top top",
            end: "top top-=1",
            toggleActions: "play none reverse none",
        },
    });

    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph || paragraph.dataset.processed === "true") return;
    paragraph.dataset.processed = "true";

    wrapWordsInSpan(paragraph);
    const words = paragraph.querySelectorAll("span");
    words.forEach((word) => { word.classList.add("word" + (Math.floor(Math.random() * 3) + 1)); });

    [".word1", ".word2", ".word3"].forEach((cls, i) => {
        const xVal = [ "-0.8em", "1.6em", "-2.4em" ][i];
        document.querySelectorAll(`.mwg_effect029 ${cls}`).forEach((el) => {
            gsap.to(el, { x: xVal, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
        });
    });
}

// --- 3. CONTEGGIO PROGETTI PER CATEGORIA ---
function initCategoryCount() {
    const categories = document.querySelectorAll('[data-category-id]');
    const projects = document.querySelectorAll('[data-project-category]');
    if (!categories.length) return;

    categories.forEach(category => {
        const catID = category.getAttribute('data-category-id');
        const countEl = category.querySelector('[data-category-count]');
        if (!countEl) return;
        const count = [...projects].filter(proj => proj.getAttribute('data-project-category') === catID).length;
        countEl.textContent = count;
    });
}

// --- 4. TOGGLE VISTA GRIGLIA ---
function initGridToggle() {
    const triggers = document.querySelectorAll('.tt__left, .tt__right');
    const contents = document.querySelectorAll('.ps__list-wrap, .ll__wrap');
    if (!triggers.length) return;

    triggers.forEach(trigger => {
        trigger.onclick = function() {
            const gridId = this.getAttribute('data-grid');
            triggers.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            contents.forEach(content => { if (content.getAttribute('data-grid') === gridId) content.classList.add('active'); });
            ScrollTrigger.refresh();
        };
    });
}

// --- 5. SISTEMA MULTI-FILTER + GESTIONE RESIZE ---
function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    groups.forEach(group => {
        const targetMatch = (group.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
        const nameMatch = (group.getAttribute('data-filter-name-match') || 'multi').trim().toLowerCase();
        const buttons = [...group.querySelectorAll('[data-filter-target]')];
        const items = [...group.querySelectorAll('[data-filter-name]')];

        const itemTokens = new Map();
        items.forEach(el => {
            const collectors = el.querySelectorAll('[data-filter-name-collect]');
            if (collectors.length) {
                const seen = new Set(), tokens = [];
                collectors.forEach(c => {
                    const v = (c.getAttribute('data-filter-name-collect') || '').trim().toLowerCase();
                    if (v && !seen.has(v)) { seen.add(v); tokens.push(v); }
                });
                if (tokens.length) el.setAttribute('data-filter-name', tokens.join(' '));
            }
            const raw = (el.getAttribute('data-filter-name') || '').trim().toLowerCase();
            itemTokens.set(el, new Set(raw ? raw.split(/\s+/).filter(Boolean) : []));
            if (!el.hasAttribute('data-filter-status')) el.setAttribute('data-filter-status', 'active');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        const paint = (rawTarget, isResize = false) => {
            if (!isResize) {
                const target = (rawTarget || '').trim().toLowerCase();
                if (target === 'all' || target === 'reset') {
                    if (targetMatch === 'single') activeTags = null;
                    else { activeTags.clear(); activeTags.add('all'); }
                } else if (targetMatch === 'single') {
                    activeTags = target;
                } else {
                    if (activeTags.has('all')) activeTags.delete('all');
                    activeTags.has(target) ? activeTags.delete(target) : activeTags.add(target);
                    if (activeTags.size === 0) { activeTags.clear(); activeTags.add('all'); }
                }
            }

            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            let visibleCounter = 0;

            items.forEach(el => {
                const tokens = itemTokens.get(el);
                let shouldShow = true;
                if (activeTags !== null && !(activeTags instanceof Set && activeTags.has('all'))) {
                    const selected = targetMatch === 'single' ? [activeTags] : [...activeTags];
                    shouldShow = nameMatch === 'single' ? selected.every(tag => tokens.has(tag)) : selected.some(tag => tokens.has(tag));
                }

                if (shouldShow) {
                    visibleCounter++;
                    if (isDesktop) el.setAttribute('data-grid-pos', ((visibleCounter - 1) % 9) + 1);
                    else el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'active');
                } else {
                    el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'not-active');
                }
            });

            if (!isResize) {
                buttons.forEach(btn => {
                    const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                    let on = (t === 'all') ? (activeTags instanceof Set && activeTags.has('all')) || activeTags === null : 
                             (targetMatch === 'single' ? activeTags === t : (activeTags instanceof Set && activeTags.has(t)));
                    btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
                });
            }
        };

        group.onclick = e => {
            const btn = e.target.closest('[data-filter-target]');
            if (btn) paint(btn.getAttribute('data-filter-target'));
        };

        window.addEventListener('resize', () => paint(null, true));
        paint('all');
    });
}

// --- 6. ANIMAZIONI GSAP HOVER ---
function initPsItemHover() {
    const psItems = document.querySelectorAll(".ps__item");
    psItems.forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const splitTargets = item.querySelectorAll("[data-split-ps]");
        if (!imgWrap || !splitTargets.length) return;

        const allLines = [];
        splitTargets.forEach((el) => {
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            gsap.set(split.lines, { yPercent: 100 });
            allLines.push(...split.lines);
        });

        if (cta) gsap.set(cta, { autoAlpha: 0 });
        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(allLines, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0);
        if (cta) hoverTl.to(cta, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0);

        imgWrap.onmouseenter = () => hoverTl.timeScale(1).play();
        imgWrap.onmouseleave = () => hoverTl.timeScale(2.2).reverse();
    });
}

// --- 7. LOGO WALL CYCLE & WG TEAM ---
function initLogoWallCycle() {
    document.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
        if (root.dataset.initialized === "true") return;
        root.dataset.initialized = "true";
        const list = root.querySelector("[data-logo-wall-list]");
        const items = Array.from(list?.querySelectorAll("[data-logo-wall-item]") || []);
        if (!items.length) return;
        const original = items.map(i => i.querySelector("[data-logo-wall-target]")).filter(Boolean);
        let tl, pool = [], visible = [];
        const setup = () => {
            if (tl) tl.kill();
            visible = items.filter(el => window.getComputedStyle(el).display !== "none");
            pool = original.map(n => n.cloneNode(true)).sort(() => Math.random() - 0.5);
            visible.forEach(v => { v.innerHTML = ''; v.appendChild(pool.shift()); });
            tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.call(() => {
                const idx = Math.floor(Math.random() * visible.length);
                const parent = visible[idx];
                const current = parent.querySelector("[data-logo-wall-target]");
                const incoming = pool.shift();
                if (!incoming || !current) return;
                gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
                parent.appendChild(incoming);
                gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, onComplete: () => { current.remove(); pool.push(current); }});
                gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration: 0.9 });
            });
        };
        setup();
        ScrollTrigger.create({ trigger: root, onEnter: () => tl.play(), onLeave: () => tl.pause() });
    });
}

function initWGTeamModule() {
  const nameItems = gsap.utils.toArray(".wg__collection-name-item");
  const imageItems = gsap.utils.toArray(".wg__item");
  const roleItems = gsap.utils.toArray(".wg__right-role-wrap");
  const namesWrapper = document.querySelector(".wg__collection-name-list");
  if (!nameItems.length) return;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const show = (order, y) => {
    gsap.set(nameItems, { opacity: 0.5 });
    const activeN = nameItems.find(el => el.dataset.order === order);
    if (activeN) gsap.set(activeN, { opacity: 1 });
    imageItems.forEach(img => gsap.set(img, { autoAlpha: img.dataset.order === order ? 1 : 0 }));
    if (!isMobile && namesWrapper) {
        roleItems.forEach(role => {
            const isMatch = role.dataset.order === order;
            gsap.set(role, { autoAlpha: isMatch ? 1 : 0 });
            if (isMatch) gsap.set(role, { y: y - namesWrapper.getBoundingClientRect().top });
        });
    }
  };
  nameItems.forEach(el => {
    el.onmouseenter = (e) => { if(!isMobile) show(el.dataset.order, e.clientY); };
    el.onclick = () => { if(isMobile) { show(el.dataset.order); const r = el.querySelector(".wg__right-role-wrap-mobile"); if(r) r.style.display = "block"; }};
  });
}

// --- 8. NAVIGAZIONE & FINALIZE ---
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

function finalizePage(isT = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");
    if (window.Webflow) { window.Webflow.destroy(); window.Webflow.ready(); window.Webflow.require('ix2').init(); }
    if (window.lenis) { window.lenis.scrollTo(0, { immediate: true }); window.lenis.resize(); }
    
    // Esecuzione Moduli
    initMwgEffect029();
    initLogoWallCycle();
    initAboutGridFlip();
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    initWGTeamModule();
    initializeAnimations(isT);
    
    setTimeout(() => { ScrollTrigger.refresh(); }, 350);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
