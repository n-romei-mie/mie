/**
 * WEBFLOW ULTIMATE ENGINE - FIXED FILTERS & HOVERS
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// --- 2. ANIMAZIONI INGRESSO (data-transition) ---
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

// --- 3. SISTEMA MULTI-FILTER (FIXED PER VIEW TRANSITIONS) ---
function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    groups.forEach(group => {
        // Rimuoviamo listener precedenti clonando il nodo (evita accumulo eventi)
        const newGroup = group.cloneNode(true);
        group.parentNode.replaceChild(newGroup, group);

        const targetMatch = (newGroup.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
        const nameMatch = (newGroup.getAttribute('data-filter-name-match') || 'multi').trim().toLowerCase();
        const buttons = [...newGroup.querySelectorAll('[data-filter-target]')];
        const items = [...newGroup.querySelectorAll('[data-filter-name]')];

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
            const tokens = raw ? raw.split(/\s+/).filter(Boolean) : [];
            itemTokens.set(el, new Set(tokens));
            el.setAttribute('data-filter-status', 'active');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        const paint = (rawTarget, isResize = false) => {
            if (!isResize && rawTarget) {
                const target = rawTarget.trim().toLowerCase();
                if (target === 'all' || target === 'reset') {
                    if (targetMatch === 'single') activeTags = null;
                    else { activeTags.clear(); activeTags.add('all'); }
                } else if (targetMatch === 'single') {
                    activeTags = target;
                } else {
                    if (activeTags.has('all')) activeTags.delete('all');
                    if (activeTags.has(target)) activeTags.delete(target);
                    else activeTags.add(target);
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
                    el.setAttribute('data-filter-status', 'active');
                } else {
                    el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'not-active');
                }
            });

            buttons.forEach(btn => {
                const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                let on = (t === 'all') ? (activeTags instanceof Set && activeTags.has('all')) || activeTags === null : 
                         (targetMatch === 'single' ? activeTags === t : activeTags.has(t));
                btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
            });
        };

        newGroup.addEventListener('click', e => {
            const btn = e.target.closest('[data-filter-target]');
            if (btn) paint(btn.getAttribute('data-filter-target'));
        });

        paint('all');
    });
}

// --- 4. ANIMAZIONI GSAP HOVER (FIXED PER VIEW TRANSITIONS) ---
function initPsItemHover() {
    const psItems = document.querySelectorAll(".ps__item");
    if (!psItems.length) return;

    psItems.forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const splitTargets = item.querySelectorAll("[data-split-ps]");

        if (!imgWrap || !splitTargets.length) return;

        // Pulizia se già processato per evitare split multipli
        splitTargets.forEach(el => {
            if (el.classList.contains('split-done-hover')) return;
        });

        const allLines = [];
        splitTargets.forEach((el) => {
            // Usiamo SplitType per compatibilità totale
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            gsap.set(split.lines, { yPercent: 105 });
            allLines.push(...split.lines);
            el.classList.add('split-done-hover');
        });

        if (cta) gsap.set(cta, { autoAlpha: 0 });

        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(allLines, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0);
        if (cta) hoverTl.to(cta, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0);

        // Usiamo onmouseenter/leave per sovrascrivere listener precedenti
        imgWrap.onmouseenter = () => hoverTl.timeScale(1).play();
        imgWrap.onmouseleave = () => hoverTl.timeScale(2.2).reverse();
    });
}

// --- 5. NAVIGAZIONE & HEAD SYNC ---
function syncHead(newDoc) {
    const currentHead = document.head;
    const newStyles = newDoc.head.querySelectorAll('link[rel="stylesheet"], style');
    const currentStylesMap = new Set();
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(s => {
        currentStylesMap.add(s.href || s.innerText);
    });
    newStyles.forEach(style => {
        if (!currentStylesMap.has(style.href || style.innerText)) {
            currentHead.appendChild(style.cloneNode(true));
        }
    });
}

if (window.navigation) {
    navigation.addEventListener("navigate", (event) => {
        if (!event.destination.url.includes(window.location.origin)) return;
        event.intercept({
            handler: async () => {
                try {
                    const response = await fetch(event.destination.url);
                    const text = await response.text();
                    const doc = new DOMParser().parseFromString(text, "text/html");
                    syncHead(doc);
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

// --- 6. FINALIZE & RESET ---
function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
    }

    // Riavvio moduli
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    
    // Altri moduli (Words, Team, etc.)
    if (typeof initMwgEffect029 === "function") initMwgEffect029();
    if (typeof initCategoryCount === "function") initCategoryCount();
    if (typeof initGridToggle === "function") initGridToggle();

    initializeAnimations(isTransition);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
window.addEventListener("resize", () => {
    // Refresh filtri su resize globale
    if (document.querySelector('[data-filter-group]')) initMutliFilterSetupMultiMatch();
});
