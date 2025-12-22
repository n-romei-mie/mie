/**
 * WEBFLOW + VIEW TRANSITION API + GSAP
 * Versione Omnicomprensiva: Animazioni, Filtri, Team e Layout Toggle
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

        gsap.to(spans, { y: "0%", duration: 1.2, stagger: 0.08, ease: "power3.out", delay: dynamicDelay });
    });
}

// --- 2. CONTEGGIO PROGETTI ---
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

// --- 3. TOGGLE VISTA GRIGLIA ---
function initGridToggle() {
    const triggers = document.querySelectorAll('.tt__left, .tt__right');
    const contents = document.querySelectorAll('.ps__list-wrap, .ll__wrap');

    triggers.forEach(trigger => {
        trigger.onclick = function() {
            const gridId = this.getAttribute('data-grid');
            triggers.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            contents.forEach(content => {
                if (content.getAttribute('data-grid') === gridId) content.classList.add('active');
            });
            // Rinfresca ScrollTrigger dopo il cambio layout
            ScrollTrigger.refresh();
        };
    });
}

// --- 4. MULTI-FILTER SETUP ---
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
            const raw = (el.getAttribute('data-filter-name') || '').trim().toLowerCase();
            const tokens = raw ? raw.split(/\s+/).filter(Boolean) : [];
            itemTokens.set(el, new Set(tokens));
            if (!el.hasAttribute('data-filter-status')) el.setAttribute('data-filter-status', 'active');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        const paint = (rawTarget, isResize = false) => {
            if (!isResize) {
                const target = (rawTarget || '').trim().toLowerCase();
                if (target === 'all' || target === 'reset') {
                    if (targetMatch === 'single') activeTags = null; else { activeTags.clear(); activeTags.add('all'); }
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
                    let on = (t === 'all') ? (activeTags === null || (activeTags instanceof Set && activeTags.has('all'))) : 
                             (targetMatch === 'single' ? activeTags === t : activeTags.has(t));
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

// --- 5. PS ITEM HOVER ANIMATION ---
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
        hoverTl.to(allLines, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 }, 0);
        if (cta) hoverTl.to(cta, { autoAlpha: 1, duration: 0.4 }, 0);

        imgWrap.onmouseenter = () => hoverTl.play();
        imgWrap.onmouseleave = () => hoverTl.reverse();
    });
}

// --- 6. WG TEAM MODULE ---
function initWGTeamModule() {
  const nameItems = gsap.utils.toArray(".wg__collection-name-item");
  const imageItems = gsap.utils.toArray(".wg__item");
  const roleItems = gsap.utils.toArray(".wg__right-role-wrap");
  const namesWrapper = document.querySelector(".wg__collection-name-list");
  if (!nameItems.length || !imageItems.length) return;
  
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const imageByOrder = {};
  imageItems.forEach(img => { if (img.dataset.order) imageByOrder[img.dataset.order] = img; });
  const roleByOrder = {};
  roleItems.forEach(role => { if (role.dataset.order) roleByOrder[role.dataset.order] = role; });

  gsap.set(nameItems, { opacity: 0.5 });
  gsap.set(imageItems, { autoAlpha: 0 });
  gsap.set(roleItems, { autoAlpha: 0 });

  const showByOrder = (order, pointerY) => {
    gsap.set(nameItems, { opacity: 0.5 });
    const activeN = nameItems.find(el => el.dataset.order === order);
    if (activeN) gsap.set(activeN, { opacity: 1 });
    if (imageByOrder[order]) { gsap.set(imageItems, { autoAlpha: 0 }); gsap.set(imageByOrder[order], { autoAlpha: 1 }); }
    if (!isMobile) {
        gsap.set(roleItems, { autoAlpha: 0 });
        const activeR = roleByOrder[order];
        if (activeR && namesWrapper) {
            const b = namesWrapper.getBoundingClientRect();
            gsap.set(activeR, { y: pointerY - b.top, autoAlpha: 1 });
        }
    }
  };

  nameItems.forEach(el => {
    el.onmouseenter = (e) => { if(!isMobile) showByOrder(el.dataset.order, e.clientY); };
    el.onclick = (e) => { if(isMobile) { showByOrder(el.dataset.order); const r = el.querySelector(".wg__right-role-wrap-mobile"); if(r) r.style.display = "block"; }};
  });
}

// --- 7. NAVIGAZIONE (VIEW TRANSITIONS) ---
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

// --- 8. RESET E FINALIZE ---
function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
    }

    // Inizializza tutti i moduli
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    initWGTeamModule();
    // Inizializza animazioni di ingresso
    initializeAnimations(isTransition);

    setTimeout(() => { ScrollTrigger.refresh(); }, 250);
}

// Avvio Iniziale
window.addEventListener("DOMContentLoaded", () => finalizePage(false));
