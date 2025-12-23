/**
 * WEBFLOW ULTIMATE ENGINE - FINAL INTEGRATION
 * Fixes: MWG Words Logic, Logo Wall Loop, Filters & Navigation
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// =============================================================================
// HELPER: SAFE REVERT (PULIZIA HTML)
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

// =============================================================================
// 2. ANIMAZIONI INGRESSO (data-transition)
// =============================================================================
function initializeAnimations(isTransition = false) {
    const dynamicDelay = isTransition ? 1.1 : 0.2;
    const linkDelay = isTransition ? 1.2 : 0.4;

    const links = document.querySelectorAll(".link a");
    if (links.length > 0) {
        gsap.set(links, { y: "100%" });
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
        el.classList.add('split-done');
        el.style.opacity = "1";
        gsap.to(spans, { y: "0%", duration: 1.2, stagger: 0.08, ease: "power3.out", delay: dynamicDelay });
    });
}

// =============================================================================
// 3. MWG EFFECT 029 – SCROLL WORDS (TUO CODICE INTEGRATO)
// =============================================================================
function wrapWordsInSpan(element) {
    const text = element.textContent;
    element.innerHTML = text.split(" ").map((word) => `<span>${word}</span>`).join(" ");
}

function initMwgEffect029() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    // Reset preventivo per evitare duplicazione span
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph) return;
    
    // Se è già stato processato, lo resettiamo al testo pulito prima di riapplicare
    if(paragraph.dataset.mwgProcessed === "true") {
        paragraph.innerHTML = paragraph.textContent; 
    }
    paragraph.dataset.mwgProcessed = "true";

    // Animazione Scroll Icon
    const scrollIcon = document.querySelector(".scroll");
    if (scrollIcon) {
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
    }

    // Applicazione Spans
    wrapWordsInSpan(paragraph);

    // Assegnazione Classi Random (word0, word1, word2, word3)
    const words = paragraph.querySelectorAll("span");
    words.forEach((word) => {
        word.classList.add("word" + Math.floor(Math.random() * 4));
    });

    // Animazioni GSAP specifiche
    document.querySelectorAll(".mwg_effect029 .word1").forEach((el) => {
        gsap.to(el, { x: "-0.8em", ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
    });

    document.querySelectorAll(".mwg_effect029 .word2").forEach((el) => {
        gsap.to(el, { x: "1.6em", ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
    });

    document.querySelectorAll(".mwg_effect029 .word3").forEach((el) => {
        gsap.to(el, { x: "-2.4em", ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
    });
}

// =============================================================================
// 4. LOGO WALL CYCLE (TUO CODICE INTEGRATO)
// =============================================================================
function initLogoWallCycle() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const loopDelay = 1.5; 
    const duration = 0.9; 

    const roots = document.querySelectorAll("[data-logo-wall-cycle-init]");
    if (!roots.length) return;

    roots.forEach((root) => {
        // Controllo init per evitare loop doppi sulla stessa pagina
        if(root.dataset.lwInitialized === "true") return;
        root.dataset.lwInitialized = "true";

        const list = root.querySelector("[data-logo-wall-list]");
        if (!list) return;

        const items = Array.from(list.querySelectorAll("[data-logo-wall-item]"));
        if (!items.length) return;

        const shuffleFront = root.getAttribute("data-logo-wall-shuffle") !== "false";
        const originalTargets = items.map((item) => item.querySelector("[data-logo-wall-target]")).filter(Boolean);

        let visibleItems = [], visibleCount = 0, pool = [], pattern = [], patternIndex = 0, tl;

        function isVisible(el) { return window.getComputedStyle(el).display !== "none"; }
        function shuffleArray(arr) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function setup() {
            if (tl) tl.kill();
            visibleItems = items.filter(isVisible);
            visibleCount = visibleItems.length;
            pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
            patternIndex = 0;

            items.forEach((item) => {
                item.querySelectorAll("[data-logo-wall-target]").forEach((old) => old.remove());
            });

            pool = originalTargets.map((n) => n.cloneNode(true));
            let front, rest;
            if (shuffleFront) {
                const shuffledAll = shuffleArray(pool);
                front = shuffledAll.slice(0, visibleCount);
                rest = shuffleArray(shuffledAll.slice(visibleCount));
                pool = front.concat(rest);
            } else {
                front = pool.slice(0, visibleCount);
                rest = shuffleArray(pool.slice(visibleCount));
                pool = front.concat(rest);
            }

            for (let i = 0; i < visibleCount; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                parent.appendChild(pool.shift());
            }

            tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
            tl.call(swapNext);
            tl.play();
        }

        function swapNext() {
            const nowCount = items.filter(isVisible).length;
            if (nowCount !== visibleCount) { setup(); return; }
            if (!pool.length) return;

            const idx = pattern[patternIndex % visibleCount];
            patternIndex++;

            const container = visibleItems[idx];
            const parent = container.querySelector("[data-logo-wall-target-parent]") || container.querySelector("*:has(> [data-logo-wall-target])") || container;
            const existing = parent.querySelectorAll("[data-logo-wall-target]");
            if (existing.length > 1) return;

            const current = parent.querySelector("[data-logo-wall-target]");
            const incoming = pool.shift();

            gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
            parent.appendChild(incoming);

            if (current) {
                gsap.to(current, {
                    yPercent: -50, autoAlpha: 0, duration, ease: "expo.inOut",
                    onComplete: () => { current.remove(); pool.push(current); },
                });
            }
            gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration, delay: 0.1, ease: "expo.inOut" });
        }

        setup();

        ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => tl && tl.play(),
            onLeave: () => tl && tl.pause(),
            onEnterBack: () => tl && tl.play(),
            onLeaveBack: () => tl && tl.pause(),
        });
    });
}

// =============================================================================
// 5. SISTEMA MULTI-FILTER (FIXED)
// =============================================================================
let currentResizeHandler = null;

function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    if (currentResizeHandler) {
        window.removeEventListener('resize', currentResizeHandler);
        currentResizeHandler = null;
    }
    currentResizeHandler = () => {
        groups.forEach(group => {
            const activeBtn = group.querySelector('[data-filter-target][data-filter-status="active"]');
            if (activeBtn) activeBtn.click();
        });
    };
    window.addEventListener('resize', currentResizeHandler);

    groups.forEach(group => {
        const oldGroup = group;
        const newGroup = oldGroup.cloneNode(true);
        oldGroup.parentNode.replaceChild(newGroup, oldGroup);

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
            el.removeAttribute('data-grid-pos');
        });

        let activeTags = targetMatch === 'single' ? null : new Set(['all']);

        const paint = (rawTarget) => {
            if (rawTarget) {
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
            const isFiltered = activeTags !== null && !(activeTags instanceof Set && activeTags.has('all'));

            items.forEach(el => {
                const tokens = itemTokens.get(el);
                let shouldShow = true;
                if (isFiltered) {
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

            buttons.forEach(btn => {
                const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                if (t === 'reset') {
                     btn.setAttribute('data-filter-status', isFiltered ? 'active' : 'not-active');
                } else {
                    let on = (t === 'all') ? !isFiltered : 
                             (targetMatch === 'single' ? activeTags === t : (activeTags instanceof Set && activeTags.has(t)));
                    btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
                }
            });
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
// 6. ANIMAZIONI GSAP HOVER (FIXED: WRAPPER)
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
// 7. ALTRI MODULI (Count, Toggle, Team, Flip)
// =============================================================================
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
            contents.forEach(c => { if (c.getAttribute('data-grid') === gridId) c.classList.add('active'); });
            ScrollTrigger.refresh();
        };
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

// =============================================================================
// 9. FINALIZE (RESET & RE-INIT)
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
    
    // Ordine di inizializzazione
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    
    // Moduli Custom Aggiornati
    initMwgEffect029();
    initLogoWallCycle();

    initCategoryCount();
    initGridToggle();
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    
    initializeAnimations(isTransition);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
window.addEventListener("resize", () => {
    if (document.querySelector('[data-filter-group]')) initMutliFilterSetupMultiMatch();
});
