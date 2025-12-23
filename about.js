/**
 * WEBFLOW ULTIMATE ENGINE - FINAL INTEGRATION
 * Features: View Transitions, GSAP, Custom Grid Logic, Filters & Team
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// =============================================================================
// HELPER: SAFE REVERT & HEAD SYNC
// =============================================================================
function safeSplitRevert(elements, className) {
    if (!elements.length) return;
    elements.forEach(el => {
        if (el.splitInstance) {
            el.splitInstance.revert();
            el.splitInstance = null;
        }
        el.classList.remove(className);
        const wrappers = el.querySelectorAll('.line-wrapper');
        wrappers.forEach(w => {
            const parent = w.parentNode;
            while (w.firstChild) parent.insertBefore(w.firstChild, w);
            parent.removeChild(w);
        });
    });
}

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

// =============================================================================
// 2. ANIMAZIONI INGRESSO (data-transition)
// =============================================================================
function initializeAnimations(isTransition = false) {
    const dynamicDelay = isTransition ? 1.1 : 0.2;
    const linkDelay = isTransition ? 1.2 : 0.4;

    const links = document.querySelectorAll(".link a");
    if (links.length > 0) {
        gsap.set(links, { y: "100%", opacity: 1 });
        gsap.to(links, { y: "0%", duration: 1, stagger: 0.1, ease: "power4.out", delay: linkDelay });
    }

    const elementsToAnimate = document.querySelectorAll('[data-transition]');
    safeSplitRevert(elementsToAnimate, 'split-done');

    elementsToAnimate.forEach(el => {
        const split = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        el.splitInstance = split; 
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
        el.style.opacity = "1"; 
        el.classList.add('split-done');
        gsap.to(spans, { y: "0%", duration: 1.2, stagger: 0.08, ease: "power3.out", delay: dynamicDelay });
    });
}

// =============================================================================
// 3. CONTEGGIO PROGETTI (TUO CODICE INTEGRATO)
// =============================================================================
function initCategoryCount() {
    const categories = document.querySelectorAll('[data-category-id]');
    const projects = document.querySelectorAll('[data-project-category]');
    
    categories.forEach(category => {
        const catID = category.getAttribute('data-category-id');
        const countEl = category.querySelector('[data-category-count]');
        if (!countEl) return;
        const count = [...projects].filter(
            proj => proj.getAttribute('data-project-category') === catID
        ).length;
        countEl.textContent = count;
    });
}

// =============================================================================
// 4. TOGGLE VISTA GRIGLIA (TUO CODICE INTEGRATO)
// =============================================================================
function initGridToggle() {
    const triggers = document.querySelectorAll('.tt__left, .tt__right');
    const contents = document.querySelectorAll('.ps__list-wrap, .ll__wrap');
    
    // Usiamo .onclick per evitare accumulo di listener durante la navigazione
    triggers.forEach(trigger => {
        trigger.onclick = function () {
            const gridId = this.getAttribute('data-grid');
            
            // RESET
            triggers.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // ATTIVAZIONE
            this.classList.add('active');
            contents.forEach(content => {
                if (content.getAttribute('data-grid') === gridId) {
                    content.classList.add('active');
                }
            });
            
            // Refresh ScrollTrigger dopo il cambio layout
            ScrollTrigger.refresh();
        };
    });
}

// =============================================================================
// 5. SISTEMA MULTI-FILTER + GRIGLIA COMPLESSA (TUO CODICE INTEGRATO)
// =============================================================================
let currentResizeHandler = null;

function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    // Gestione Resize Globale (Safe)
    if (currentResizeHandler) {
        window.removeEventListener('resize', currentResizeHandler);
        currentResizeHandler = null;
    }
    currentResizeHandler = () => {
        groups.forEach(group => {
            // Rilancia il filtro attivo per ricalcolare la griglia
            const activeBtn = group.querySelector('[data-filter-target][data-filter-status="active"]');
            if (activeBtn) activeBtn.click();
        });
    };
    window.addEventListener('resize', currentResizeHandler);

    groups.forEach(group => {
        // Clone node per pulire vecchi eventi click
        const oldGroup = group;
        const newGroup = oldGroup.cloneNode(true);
        oldGroup.parentNode.replaceChild(newGroup, oldGroup);

        const targetMatch = (newGroup.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
        const nameMatch = (newGroup.getAttribute('data-filter-name-match') || 'multi').trim().toLowerCase();
        const buttons = [...newGroup.querySelectorAll('[data-filter-target]')];
        const items = [...newGroup.querySelectorAll('[data-filter-name]')];

        // --- SETUP TOKEN ---
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

            if (!el.hasAttribute('data-filter-status')) el.setAttribute('data-filter-status', 'active');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        // --- HELPERS ---
        const setButtonState = (btn, on) => {
            const next = on ? 'active' : 'not-active';
            if (btn.getAttribute('data-filter-status') !== next) {
                btn.setAttribute('data-filter-status', next);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
        };

        const hasRealActive = () => {
            if (targetMatch === 'single') return activeTags !== null;
            return activeTags.size > 0 && !activeTags.has('all');
        };

        const resetAll = () => {
            if (targetMatch === 'single') activeTags = null;
            else { activeTags.clear(); activeTags.add('all'); }
        };

        const itemMatches = (el) => {
            if (!hasRealActive()) return true;
            const tokens = itemTokens.get(el);
            if (targetMatch === 'single') return tokens.has(activeTags);
            const selected = [...activeTags];
            if (nameMatch === 'single') return selected.every(tag => tokens.has(tag));
            else return selected.some(tag => tokens.has(tag));
        };

        // --- PAINT (APPLICAZIONE FILTRI E GRIGLIA) ---
        const paint = (rawTarget, isResize = false) => {
            if (!isResize && rawTarget) {
                const target = rawTarget.trim().toLowerCase();
                if (target === 'all' || target === 'reset') {
                    resetAll();
                } else if (targetMatch === 'single') {
                    activeTags = target;
                } else {
                    if (activeTags.has('all')) activeTags.delete('all');
                    if (activeTags.has(target)) activeTags.delete(target);
                    else activeTags.add(target);
                    if (activeTags.size === 0) resetAll();
                }
            }

            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            let visibleCounter = 0;

            items.forEach(el => {
                const shouldShow = itemMatches(el);
                if (shouldShow) {
                    visibleCounter++;
                    let desktopPos;

                    // LOGICA GRIGLIA COMPLESSA (TUO CODICE)
                    if (isDesktop) {
                        if (visibleCounter <= 5) {
                            // Primi 5 elementi: posizioni 1, 2, 3, 4, 5
                            desktopPos = visibleCounter;
                        } else {
                            // Dal 6 in poi: Loop di 8 elementi (posizioni 6 -> 13)
                            desktopPos = ((visibleCounter - 6) % 8) + 6;
                        }
                        el.setAttribute('data-grid-pos', desktopPos);
                    } else {
                        el.removeAttribute('data-grid-pos');
                    }
                    el.setAttribute('data-filter-status', 'active');
                } else {
                    el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'not-active');
                }
            });

            if (!isResize) {
                buttons.forEach(btn => {
                    const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                    let on = false;
                    if (t === 'all') on = !hasRealActive();
                    else if (t === 'reset') on = hasRealActive();
                    else on = targetMatch === 'single' ? activeTags === t : activeTags.has(t);
                    setButtonState(btn, on);
                });
            }
            ScrollTrigger.refresh();
        };

        newGroup.onclick = (e) => {
            const btn = e.target.closest('[data-filter-target]');
            if (btn) paint(btn.getAttribute('data-filter-target'));
        };

        paint('all');
    });
}

// =============================================================================
// 6. ANIMAZIONI GSAP HOVER (Safe Wrapper)
// =============================================================================
function initPsItemHover() {
    const psItems = document.querySelectorAll(".ps__item");
    if (!psItems.length) return;

    psItems.forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const targets = item.querySelectorAll("[data-split-ps]");
        if (!imgWrap || !targets.length) return;

        safeSplitRevert(targets, 'split-done-hover');

        const allLines = [];
        targets.forEach(el => {
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            el.splitInstance = split; 
            el.classList.add('split-done-hover');
            
            split.lines.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('line-wrapper');
                wrapper.style.overflow = 'hidden';
                wrapper.style.display = 'block';
                wrapper.style.lineHeight = 'inherit';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            gsap.set(split.lines, { yPercent: 105 });
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

// =============================================================================
// 7. ALTRI MODULI (Words, Logo Wall, Team, Flip)
// =============================================================================
function initMwgEffect029() {
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph) return;
    if(paragraph.dataset.processed === "true") paragraph.innerHTML = paragraph.textContent; 
    paragraph.dataset.processed = "true";

    const scrollIcon = document.querySelector(".scroll");
    if (scrollIcon) {
        gsap.to(".scroll", { autoAlpha: 0, duration: 0.2, scrollTrigger: { trigger: ".mwg_effect029", start: "top top", end: "top top-=1", toggleActions: "play none reverse none" }});
    }

    paragraph.innerHTML = paragraph.textContent.split(" ").map(w => `<span>${w}</span>`).join(" ");
    const words = paragraph.querySelectorAll("span");
    words.forEach(w => w.classList.add("word" + Math.floor(Math.random() * 4)));

    [".word1", ".word2", ".word3"].forEach((cls, i) => {
        const x = ["-0.8em", "1.6em", "-2.4em"][i];
        document.querySelectorAll(`.mwg_effect029 ${cls}`).forEach(el => gsap.to(el, { x: x, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }}));
    });
}

function initLogoWallCycle() {
    const roots = document.querySelectorAll("[data-logo-wall-cycle-init]");
    roots.forEach((root) => {
        if(root.dataset.lwInitialized === "true") return;
        root.dataset.lwInitialized = "true";
        const list = root.querySelector("[data-logo-wall-list]");
        if (!list) return;
        const items = Array.from(list.querySelectorAll("[data-logo-wall-item]"));
        if (!items.length) return;
        const visibleItems = items.filter(el => window.getComputedStyle(el).display !== "none");
        if(!visibleItems.length) return;
        const originalTargets = items.map((item) => item.querySelector("[data-logo-wall-target]")).filter(Boolean);

        let pool = [], pattern = [], patternIndex = 0, tl;
        const shuffleArray = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

        const setup = () => {
            if (tl) tl.kill();
            items.forEach((item) => item.querySelectorAll("[data-logo-wall-target]").forEach((old) => { if(old.parentNode.querySelectorAll("[data-logo-wall-target]").length > 1 || old.classList.contains('cloned-logo')) old.remove(); }));
            pattern = shuffleArray(Array.from({ length: visibleItems.length }, (_, i) => i));
            patternIndex = 0;
            pool = originalTargets.map(n => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            for (let i = 0; i < visibleItems.length; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                parent.innerHTML = ''; 
                parent.appendChild(pool.shift());
            }
            pool = originalTargets.map(n => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.call(swapNext);
            tl.play();
        };

        const swapNext = () => {
            if (!pool.length) pool = originalTargets.map(n => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            const idx = pattern[patternIndex % visibleItems.length];
            patternIndex++;
            const container = visibleItems[idx];
            const parent = container.querySelector("[data-logo-wall-target-parent]") || container;
            const current = parent.querySelector("[data-logo-wall-target]");
            const incoming = pool.shift();
            gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
            parent.appendChild(incoming);
            if (current) gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => { current.remove(); pool.push(current); }});
            gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration: 0.9, delay: 0.1, ease: "expo.inOut" });
        };
        setup();
        ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onEnter: () => tl && tl.play(), onLeave: () => tl && tl.pause() });
    });
}

function initAboutGridFlip() {
    const grid = document.querySelector(".about__grid-wrap");
    const items = grid?.querySelectorAll(".ag__img");
    const btnBig = document.querySelector(".ag__trigger.is--big");
    const btnSmall = document.querySelector(".ag__trigger.is--small");
    if (!grid || !items || !items.length) return;
    const updateButtons = (isBig) => {
        if (btnBig) gsap.to(btnBig, { opacity: isBig ? 1 : 0.5, pointerEvents: isBig ? "none" : "auto" });
        if (btnSmall) gsap.to(btnSmall, { opacity: isBig ? 0.5 : 1, pointerEvents: isBig ? "auto" : "none" });
    };
    const switchLayout = (toBig) => {
        const state = Flip.getState(items);
        toBig ? (grid.classList.add("is--big"), grid.classList.remove("is--small")) : (grid.classList.add("is--small"), grid.classList.remove("is--big"));
        updateButtons(toBig);
        Flip.from(state, { duration: 1.3, ease: "power4.inOut", scale: true, onComplete: () => ScrollTrigger.refresh() });
    };
    if (btnBig) btnBig.onclick = () => switchLayout(true);
    if (btnSmall) btnSmall.onclick = () => switchLayout(false);
    updateButtons(grid.classList.contains("is--big"));
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

// =============================================================================
// 8. NAVIGAZIONE (VIEW TRANSITIONS + HEAD SYNC)
// =============================================================================
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

// =============================================================================
// 9. FINALIZE (MASTER CONTROLLER)
// =============================================================================
function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
    }
    if (window.lenis) { 
        window.lenis.scrollTo(0, { immediate: true }); 
        window.lenis.resize(); 
    }
    
    // Inizializza Moduli (in ordine sicuro)
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    initMwgEffect029();
    initLogoWallCycle();
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    
    initializeAnimations(isTransition);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

// Avvio Iniziale
window.addEventListener("DOMContentLoaded", () => finalizePage(false));
