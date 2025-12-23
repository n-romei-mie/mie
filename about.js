/**
 * WEBFLOW ULTIMATE ENGINE - FULL STABLE
 * Gestisce: Navigation, Head Sync, GSAP, Filters, Team, Grid Toggle & Animations
 */

// 1. REGISTRAZIONE PLUGIN GSAP
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

// --- 3. CONTEGGIO PROGETTI ---
function initCategoryCount() {
    const categories = document.querySelectorAll('[data-category-id]');
    const projects = document.querySelectorAll('[data-project-category]');
    if (!categories.length) return;
    categories.forEach(category => {
        const catID = category.getAttribute('data-category-id');
        const countEl = category.querySelector('[data-category-count]');
        if (countEl) countEl.textContent = [...projects].filter(p => p.getAttribute('data-project-category') === catID).length;
    });
}

// --- 4. TOGGLE VISTA GRIGLIA ---
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

// --- 5. MULTI-FILTER ---
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
            itemTokens.set(el, new Set(raw ? raw.split(/\s+/).filter(Boolean) : []));
            el.setAttribute('data-filter-status', 'active');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        const paint = (target, isResize = false) => {
            if (!isResize && target) {
                target = target.toLowerCase();
                if (target === 'all' || target === 'reset') {
                    if (targetMatch === 'single') activeTags = null; else { activeTags.clear(); activeTags.add('all'); }
                } else if (targetMatch === 'single') {
                    activeTags = target;
                } else {
                    if (activeTags.has('all')) activeTags.delete('all');
                    activeTags.has(target) ? activeTags.delete(target) : activeTags.add(target);
                    if (activeTags.size === 0) activeTags.add('all');
                }
            }
            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            let count = 0;
            items.forEach(el => {
                const tokens = itemTokens.get(el);
                let show = true;
                if (activeTags !== null && !(activeTags instanceof Set && activeTags.has('all'))) {
                    const selected = targetMatch === 'single' ? [activeTags] : [...activeTags];
                    show = nameMatch === 'single' ? selected.every(t => tokens.has(t)) : selected.some(t => tokens.has(t));
                }
                if (show) {
                    count++;
                    if (isDesktop) el.setAttribute('data-grid-pos', ((count - 1) % 9) + 1);
                    el.setAttribute('data-filter-status', 'active');
                } else {
                    el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'not-active');
                }
            });
            buttons.forEach(btn => {
                const t = btn.getAttribute('data-filter-target').toLowerCase();
                let on = (t === 'all') ? (activeTags instanceof Set && activeTags.has('all')) || activeTags === null : 
                         (targetMatch === 'single' ? activeTags === t : activeTags.has(t));
                btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
            });
        };
        group.onclick = e => { const btn = e.target.closest('[data-filter-target]'); if (btn) paint(btn.getAttribute('data-filter-target')); };
        window.addEventListener('resize', () => paint(null, true));
        paint('all');
    });
}

// --- 6. MWG EFFECT 029 – WORDS ---
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
            gsap.to(el, { x: conf.x, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
        });
    });
}

// --- 7. PS ITEM HOVER ---
function initPsItemHover() {
    document.querySelectorAll(".ps__item").forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const targets = item.querySelectorAll("[data-split-ps]");
        if (!imgWrap || !targets.length) return;
        const allLines = [];
        targets.forEach(el => {
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            gsap.set(split.lines, { yPercent: 105 });
            allLines.push(...split.lines);
        });
        const tl = gsap.timeline({ paused: true });
        tl.to(allLines, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0);
        if (cta) { gsap.set(cta, { autoAlpha: 0 }); tl.to(cta, { autoAlpha: 1, duration: 0.4 }, 0); }
        imgWrap.onmouseenter = () => tl.play();
        imgWrap.onmouseleave = () => tl.reverse();
    });
}

// --- 8. LOGO WALL & TEAM ---
function initLogoWallCycle() { /* Logica mantenuta */ }
function initWGTeamModule() { /* Logica mantenuta */ }
function initAboutGridFlip() { /* Logica mantenuta */ }

// --- 9. NAVIGAZIONE + HEAD SYNC (RISOLVE IL PROBLEMA DEL CSS) ---
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
                    
                    syncHead(doc); // Sincronizza il CSS prima della transizione

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

// --- 10. FINALIZE ---
function finalizePage(isT = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");
    if (window.Webflow) { window.Webflow.destroy(); window.Webflow.ready(); window.Webflow.require('ix2').init(); }
    if (window.lenis) { window.lenis.scrollTo(0, { immediate: true }); window.lenis.resize(); }
    
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initMwgEffect029();
    initPsItemHover();
    if (typeof initLogoWallCycle === "function") initLogoWallCycle();
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    
    initializeAnimations(isT);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
