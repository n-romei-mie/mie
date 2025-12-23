/**
 * WEBFLOW ULTIMATE ENGINE - FINAL INTEGRATION
 * Features: Navigation, Filters, Team, Words, Wall, Flip, Scale, CircleType & CMS Next
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// =============================================================================
// HELPER: SAFE REVERT
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
// 2. ANIMAZIONI INGRESSO
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
// 3. NUOVI MODULI: SCALE, CIRCLE, CMS NEXT
// =============================================================================

function initCircleType() {
    const circleEl = document.getElementById('circlep');
    if (circleEl && typeof CircleType !== 'undefined') {
        new CircleType(circleEl);
    }
}

function initScaleOnScroll() {
    const elements = gsap.utils.toArray("[data-scale]");
    if (!elements.length) return;

    elements.forEach((el) => {
        // Kill previous tweens to avoid conflicts
        gsap.killTweensOf(el);
        
        // Initial state
        gsap.set(el, { scale: 1.2 });

        // Animation
        gsap.to(el, {
            scale: 1,
            ease: "power2.inOut",
            duration: 1.5,
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none reverse",
            },
        });
    });
}

// Variabile globale per gestire l'event listener dello scroll
let cmsNextScrollHandler = null;

function initCmsNextPowerUp() {
    // Dipendenza jQuery
    if (typeof $ === "undefined") return;

    // Pulizia listener precedente
    if (cmsNextScrollHandler) {
        window.removeEventListener("scroll", cmsNextScrollHandler);
        cmsNextScrollHandler = null;
    }

    const componentsData = [];

    $("[tr-cmsnext-element='component']").each(function () {
        let componentEl = $(this),
            cmsListEl = componentEl.find(".w-dyn-items").first(),
            cmsItemEl = cmsListEl.children(),
            currentItemEl,
            noResultEl = componentEl.find("[tr-cmsnext-element='no-result']");

        cmsItemEl.each(function () {
            if ($(this).find(".w--current").length) currentItemEl = $(this);
        });

        let nextItemEl = currentItemEl ? currentItemEl.next() : $(),
            prevItemEl = currentItemEl ? currentItemEl.prev() : $();

        if (componentEl.attr("tr-cmsnext-loop") === "true") {
            if (!nextItemEl.length) nextItemEl = cmsItemEl.first();
            if (!prevItemEl.length) prevItemEl = cmsItemEl.last();
        }

        let displayEl = nextItemEl;
        if (componentEl.attr("tr-cmsnext-showprev") === "true") displayEl = prevItemEl;

        if (componentEl.attr("tr-cmsnext-showall") === "true") {
            prevItemEl.addClass("is-prev");
            currentItemEl && currentItemEl.addClass("is-current");
            nextItemEl.addClass("is-next");
        } else {
            cmsItemEl.not(displayEl).remove();
            if (!displayEl.length) noResultEl.show();
            if (!displayEl.length && componentEl.attr("tr-cmsnext-hideempty") === "true") componentEl.hide();
        }

        // --- SCROLL TO NEXT LOGIC ---
        const sectionEl = componentEl.closest(".section__next-project");
        let targetItemEl = nextItemEl;
        if (componentEl.attr("tr-cmsnext-showprev") === "true") {
            targetItemEl = prevItemEl;
        }

        if (sectionEl.length && targetItemEl && targetItemEl.length) {
            componentsData.push({
                sectionEl,
                componentEl,
                targetItemEl,
                triggered: false
            });
        }
    });

    if (componentsData.length) {
        let isRunning = false;

        cmsNextScrollHandler = () => {
            if (isRunning) return;
            isRunning = true;

            window.requestAnimationFrame(() => {
                componentsData.forEach((item) => {
                    if (item.triggered) return;
                    // Check if element is still in DOM (safety for transitions)
                    if (!document.contains(item.sectionEl[0])) return;

                    const sectionRect = item.sectionEl[0].getBoundingClientRect();
                    const componentHeight = item.componentEl.outerHeight() || 0;

                    if (sectionRect.bottom <= componentHeight + 1 && sectionRect.bottom >= 0) {
                        const linkEl = item.targetItemEl.find("a").first();
                        const href = linkEl.attr("href");

                        if (href) {
                            item.triggered = true;
                            // Usa window.location.href normale che verrà intercettato dal nostro listener globale
                            window.location.href = href; 
                        }
                    }
                });
                isRunning = false;
            });
        };

        window.addEventListener("scroll", cmsNextScrollHandler, { passive: true });
    }
}


// =============================================================================
// 4. MODULI ESISTENTI (Filtri, Hover, Words, Team, Wall, Flip, Count, Toggle)
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

        const paint = (rawTarget, isResize = false) => {
            if (!isResize && rawTarget !== null) {
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
                    let desktopPos;
                    if (isDesktop) {
                        if (visibleCounter <= 5) desktopPos = visibleCounter;
                        else desktopPos = ((visibleCounter - 6) % 8) + 6;
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

            buttons.forEach(btn => {
                const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                let on = (t === 'all') ? (activeTags instanceof Set && activeTags.has('all')) || activeTags === null : 
                         (targetMatch === 'single' ? activeTags === t : activeTags.has(t));
                btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
            });
            ScrollTrigger.refresh();
        };

        newGroup.onclick = (e) => {
            const btn = e.target.closest('[data-filter-target]');
            if (btn) paint(btn.getAttribute('data-filter-target'), false);
        };

        paint(null, true); 
    });
}

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

function initMwgEffect029() {
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph) return;
    if(paragraph.dataset.processed === "true") paragraph.innerHTML = paragraph.textContent; 
    
    const scrollIcon = document.querySelector(".scroll");
    if (scrollIcon) {
        gsap.to(".scroll", {
            autoAlpha: 0, duration: 0.2,
            scrollTrigger: { trigger: ".mwg_effect029", start: "top top", end: "top top-=1", toggleActions: "play none reverse none" }
        });
    }

    paragraph.dataset.processed = "true";
    paragraph.innerHTML = paragraph.textContent.split(" ").map(w => `<span>${w}</span>`).join(" ");
    paragraph.querySelectorAll("span").forEach(w => w.classList.add("word" + (Math.floor(Math.random() * 3) + 1)));

    [{ s: ".word1", x: "-0.8em" }, { s: ".word2", x: "1.6em" }, { s: ".word3", x: "-2.4em" }].forEach(c => {
        const targets = paragraph.querySelectorAll(c.s);
        if(targets.length) gsap.to(targets, { x: c.x, ease: "none", scrollTrigger: { trigger: paragraph, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
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
            items.forEach((item) => {
                item.querySelectorAll("[data-logo-wall-target]").forEach((old) => {
                    if(old.parentNode.querySelectorAll("[data-logo-wall-target]").length > 1 || old.classList.contains('cloned-logo')) old.remove(); 
                });
            });
            pattern = shuffleArray(Array.from({ length: visibleItems.length }, (_, i) => i));
            patternIndex = 0;
            pool = originalTargets.map((n) => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            for (let i = 0; i < visibleItems.length; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                parent.innerHTML = ''; 
                parent.appendChild(pool.shift());
            }
            pool = originalTargets.map((n) => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.call(swapNext);
            tl.play();
        }

        function swapNext() {
            if (!pool.length) pool = originalTargets.map((n) => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            const idx = pattern[patternIndex % visibleItems.length];
            patternIndex++;
            const container = visibleItems[idx];
            const parent = container.querySelector("[data-logo-wall-target-parent]") || container;
            const current = parent.querySelector("[data-logo-wall-target]");
            const incoming = pool.shift();
            gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
            parent.appendChild(incoming);
            if (current) {
                gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => { current.remove(); pool.push(current); }});
            }
            gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration: 0.9, delay: 0.1, ease: "expo.inOut" });
        }
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

// =============================================================================
// 5. NAVIGAZIONE (VIEW TRANSITIONS + HEAD SYNC)
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
// 6. FINALIZE (RESET & RE-INIT)
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
    
    // Inizializza Nuovi Moduli
    initCircleType();
    initScaleOnScroll();
    initCmsNextPowerUp();

    // Inizializza Moduli Esistenti
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    initCategoryCount();
    initGridToggle();
    initMwgEffect029();
    initLogoWallCycle();
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    
    initializeAnimations(isTransition);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
