/**
 * WEBFLOW ULTIMATE ENGINE - FINAL STABLE
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

// --- 3. SISTEMA MULTI-FILTER (FIXED) ---
function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    groups.forEach(group => {
        // Rimuove eventuali listener residui se la funzione viene riconsultata
        const newGroup = group.cloneNode(true);
        group.parentNode.replaceChild(newGroup, group);
        
        const targetMatch = (newGroup.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
        const nameMatch = (newGroup.getAttribute('data-filter-name-match') || 'multi').trim().toLowerCase();
        const buttons = [...newGroup.querySelectorAll('[data-filter-target]')];
        const items = [...newGroup.querySelectorAll('[data-filter-name]')];

        const itemTokens = new Map();
        items.forEach(el => {
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

        // Resize handler rimosso da window per evitare accumuli, gestito globalmente
        paint('all');
    });
}

// --- 4. PS ITEM HOVER (FIXED) ---
function initPsItemHover() {
    const psItems = document.querySelectorAll(".ps__item");
    psItems.forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const targets = item.querySelectorAll("[data-split-ps]");
        if (!imgWrap || !targets.length) return;

        // Pulizia per evitare duplicati su "indietro"
        targets.forEach(el => { if(el.classList.contains('split-done')) return; });

        const allLines = [];
        targets.forEach((el) => {
            // Usiamo SplitType per coerenza, se hai licenza SplitText puoi rimetterlo
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            gsap.set(split.lines, { yPercent: 105 });
            allLines.push(...split.lines);
            el.classList.add('split-done');
        });

        if (cta) gsap.set(cta, { autoAlpha: 0 });
        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(allLines, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0);
        if (cta) hoverTl.to(cta, { autoAlpha: 1, duration: 0.4 }, 0);

        imgWrap.onmouseenter = () => hoverTl.play();
        imgWrap.onmouseleave = () => hoverTl.reverse();
    });
}

// --- 5. ALTRI MODULI (Words, Team, Wall, Count, Flip, Toggle) ---
function initMwgEffect029() {
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph || paragraph.dataset.processed === "true") return;
    paragraph.dataset.processed = "true";
    paragraph.innerHTML = paragraph.textContent.split(" ").map(w => `<span>${w}</span>`).join(" ");
    const words = paragraph.querySelectorAll("span");
    words.forEach(w => w.classList.add("word" + (Math.floor(Math.random() * 3) + 1)));
    const configs = [{ sel: ".word1", x: "-0.8em" }, { sel: ".word2", x: "1.6em" }, { sel: ".word3", x: "-2.4em" }];
    configs.forEach(conf => {
        document.querySelectorAll(`.mwg_effect029 ${conf.sel}`).forEach(el => {
            gsap.to(el, { x: conf.x, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "bottom 10%", scrub: 0.2 }});
        });
    });
}

function initCategoryCount() {
    const categories = document.querySelectorAll('[data-category-id]');
    const projects = document.querySelectorAll('[data-project-category]');
    categories.forEach(category => {
        const catID = category.getAttribute('data-category-id');
        const countEl = category.querySelector('[data-category-count]');
        if (countEl) countEl.textContent = [...projects].filter(p => p.getAttribute('data-project-category') === catID).length;
    });
}

function initGridToggle() {
    const triggers = document.querySelectorAll('.tt__left, .tt__right');
    const contents = document.querySelectorAll('.ps__list-wrap, .ll__wrap');
    triggers.forEach(trigger => {
        trigger.onclick = function() {
            const gridId = this.getAttribute('data-grid');
            triggers.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            contents.forEach(c => { if (c.getAttribute('data-grid') === gridId) c.classList.add('active'); });
            ScrollTrigger.refresh();
        };
    });
}

// --- 6. NAVIGAZIONE E RESET ---
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
    
    // Inizializza moduli
    initMwgEffect029();
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    if (typeof initLogoWallCycle === "function") initLogoWallCycle();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    
    initializeAnimations(isT);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
window.addEventListener("resize", () => {
    // Gestione resize globale per i filtri
    const groups = document.querySelectorAll('[data-filter-group]');
    if(groups.length) initMutliFilterSetupMultiMatch();
});
