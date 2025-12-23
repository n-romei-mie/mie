/**
 * WEBFLOW ULTIMATE ENGINE - FINAL FULL STACK
 * Includes: Nav, Filters, Team, Words, Wall, Flip, Scale, Circle, CMS Next, Parallax, Scramble, Footer Canvas
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    // Registra tutto ciò che è disponibile
    const plugins = [ScrollTrigger, Flip];
    if (typeof SplitText !== "undefined") plugins.push(SplitText);
    if (typeof ScrambleTextPlugin !== "undefined") plugins.push(ScrambleTextPlugin);
    gsap.registerPlugin(...plugins);
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
// 2. PARALLAX SYSTEM (TUO CODICE INTEGRATO)
// =============================================================================
function initGlobalParallax() {
    // Pulizia automatica gestita da gsap.context, ma reinizializziamo a ogni pagina
    let mm = gsap.matchMedia();

    mm.add({
        isMobile: "(max-width:479px)",
        isMobileLandscape: "(max-width:767px)",
        isTablet: "(max-width:991px)",
        isDesktop: "(min-width:992px)",
    }, (ctx) => {
        let { isMobile, isMobileLandscape, isTablet } = ctx.conditions;

        // Scoped context per facile cleanup
        ScrollTrigger.batch('[data-parallax="trigger"]', {
            onEnter: batch => {
                batch.forEach((trigger) => {
                    let disable = trigger.getAttribute("data-parallax-disable");
                    if ((disable === "mobile" && isMobile) ||
                        (disable === "mobileLandscape" && isMobileLandscape) ||
                        (disable === "tablet" && isTablet)) {
                        return;
                    }

                    let target = trigger.querySelector('[data-parallax="target"]') || trigger;
                    let direction = trigger.getAttribute("data-parallax-direction") || "vertical";
                    let axis = direction === "horizontal" ? "xPercent" : "yPercent";
                    let scrubAttr = trigger.getAttribute("data-parallax-scrub");
                    let scrubVal = scrubAttr ? parseFloat(scrubAttr) : true;
                    let startVal = parseFloat(trigger.getAttribute("data-parallax-start") || 20);
                    let endVal = parseFloat(trigger.getAttribute("data-parallax-end") || -20);
                    let scrollStart = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
                    let scrollEnd = trigger.getAttribute("data-parallax-scroll-end") || "bottom top";

                    gsap.fromTo(target, 
                        { [axis]: startVal }, 
                        {
                            [axis]: endVal,
                            ease: "none",
                            scrollTrigger: {
                                trigger: trigger,
                                start: `clamp(${scrollStart})`,
                                end: `clamp(${scrollEnd})`,
                                scrub: scrubVal,
                            },
                        }
                    );
                });
            }
        });
    });
}

// =============================================================================
// 3. TEXT SPLIT ANIMATIONS (LINES & EYEBROW)
// =============================================================================
// Gestione resize per SplitText
let splitResizeHandler = null;
const splitData = new Map();

function initSplitTextAnimations() {
    if (typeof SplitText === "undefined") return;

    // --- A. LINES UNMASK (data-split) ---
    function createSplit(el) {
        const alreadyAnimated = el._hasAnimated === true;
        // Revert preventivo
        const existing = splitData.get(el);
        if (existing) { existing.split.revert(); existing.st.kill(); }

        const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "split-line" });
        let st;

        if (alreadyAnimated) {
            gsap.set(split.lines, { yPercent: 0 });
            st = ScrollTrigger.create({
                trigger: el, start: "top bottom",
                onEnter: () => gsap.set(split.lines, { yPercent: 0 })
            });
        } else {
            gsap.set(split.lines, { yPercent: 100 });
            st = ScrollTrigger.create({
                trigger: el, start: "top 80%",
                onEnter: () => {
                    if (el._hasAnimated) return;
                    el._hasAnimated = true;
                    gsap.to(split.lines, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 });
                }
            });
        }
        splitData.set(el, { split, st });
    }

    const elements = gsap.utils.toArray("[data-split]");
    elements.forEach(createSplit);

    // --- B. EYEBROW CHARS ---
    const eyebrowElements = gsap.utils.toArray(".eyebrow");
    eyebrowElements.forEach((el) => {
        // Pulizia precedente se necessario
        if(el._splitInstance) el._splitInstance.revert();
        
        const split = new SplitText(el, { type: "chars", mask: "chars", charsClass: "eyebrow-char" });
        el._splitInstance = split;
        const chars = split.chars;
        
        gsap.set(chars, { opacity: 0 });
        ScrollTrigger.create({
            trigger: el, start: "top 85%", once: true,
            onEnter: () => {
                gsap.to(chars, { opacity: 1, duration: 0.05, ease: "power1.out", stagger: { amount: 0.4, from: "random" } });
            }
        });
    });

    // Gestione Resize Unica
    if (splitResizeHandler) window.removeEventListener("resize", splitResizeHandler);
    splitResizeHandler = () => { elements.forEach(createSplit); ScrollTrigger.refresh(); };
    window.addEventListener("resize", splitResizeHandler);
}

// =============================================================================
// 4. SCRAMBLE TEXT HOVER
// =============================================================================
function initScrambleTextAnimations() {
    if (typeof gsap === "undefined" || typeof ScrambleTextPlugin === "undefined") return;

    function highlightRandomChar(el) {
        const chars = el.querySelectorAll(".char");
        if (!chars.length) return;
        chars.forEach(c => (c.style.color = ""));
        const rand = chars[Math.floor(Math.random() * chars.length)];
        if (rand) rand.style.color = "#C3FF00";
    }

    const targets = document.querySelectorAll('[data-scramble-hover="link"]');
    targets.forEach(target => {
        const textEl = target.querySelector('[data-scramble-hover="target"]');
        if (!textEl) return;

        const originalText = textEl.textContent;
        const customHoverText = textEl.getAttribute("data-scramble-text");

        // Use SplitType or SplitText based on availability for char wrapping
        if (typeof SplitText !== "undefined") {
            new SplitText(textEl, { type: "words, chars", wordsClass: "word", charsClass: "char" });
        } else if (typeof SplitType !== "undefined") {
             new SplitType(textEl, { types: "words, chars", wordClass: "word", charClass: "char" });
        }

        // Clean previous listeners
        const newTarget = target.cloneNode(true);
        target.parentNode.replaceChild(newTarget, target);
        const newTextEl = newTarget.querySelector('[data-scramble-hover="target"]'); // Re-select inside clone

        newTarget.addEventListener("mouseenter", () => {
            gsap.to(newTextEl, {
                duration: 1,
                scrambleText: { text: customHoverText || originalText, chars: "_X" },
                onUpdate: () => highlightRandomChar(newTextEl)
            });
        });

        newTarget.addEventListener("mouseleave", () => {
            gsap.to(newTextEl, {
                duration: 0.6,
                scrambleText: { text: originalText, speed: 2, chars: "X_" },
                onUpdate: () => highlightRandomChar(newTextEl)
            });
        });
    });
}

// =============================================================================
// 5. FOOTER CANVAS SCRUBBER (PROTECTED)
// =============================================================================
// Variabili globali per pulizia Footer
let footerScrollHandler = null;
let footerResizeObserver = null;

function initFooterCanvasScrubber() {
    let e = document.getElementById("footercanvas");
    if (!e || !e.getContext) return;

    // CLEANUP PRECEDENTE
    if (footerScrollHandler) window.removeEventListener("scroll", footerScrollHandler);
    if (footerResizeObserver) { footerResizeObserver.disconnect(); footerResizeObserver = null; }

    let t = e.getContext("2d", { alpha: !1, desynchronized: !0 });
    t.imageSmoothingEnabled = !0, t.imageSmoothingQuality = "high";
    
    let n = e.dataset.base || "",
        a = (e.dataset.ext || "jpg").toLowerCase(),
        i = parseInt(e.dataset.frames || "45", 10),
        r = parseInt(e.dataset.pad || "5", 10),
        l = parseInt(e.dataset.start || "0", 10);
        
    if (!n || !i) return;

    let o = e.parentElement || e, s = 0, c = 0, f = 1, d = 0, h = 0;

    function u() {
        f = Math.min(window.devicePixelRatio || 1, 2);
        let n = Math.max(1, Math.round(o.clientWidth * f)),
            a = Math.max(1, Math.round(o.clientHeight * f));
        (e.width !== n || e.height !== a) && (e.width = n, e.height = a, t.setTransform(1, 0, 0, 1, 0, 0), t.scale(f, f)), s = Math.max(1, o.clientWidth), c = Math.max(1, o.clientHeight)
    }

    let $ = new Map, m = new Map;
    async function g(e) {
        if (e < l || e > l + (i - 1)) return null;
        if ($.has(e)) return $.get(e);
        if (m.has(e)) return m.get(e);
        let s = n + String(e).padStart(r, "0") + "." + a;
        let c = fetch(s, { cache: "force-cache" })
            .then(e => e.ok ? e.blob() : null)
            .then(createImageBitmap)
            .then(t => {
                if(t) {
                    if($.size > 60) { let key = $.keys().next().value; $.get(key)?.close?.(); $.delete(key); }
                    $.set(e, t);
                    m.delete(e);
                    if((!d || !h)) { d = t.width; h = t.height; }
                    return t;
                }
                return null;
            }).catch(() => { m.delete(e); return null; });
        return m.set(e, c), c;
    }

    let _ = { start: null, end: null };
    function b(e) {
        let n = Math.max(l, e - 20), a = Math.min(l + (i - 1), e + 20);
        if (n !== _.start || a !== _.end) {
            _ = { start: n, end: a };
            for (let r = n; r <= a; r += 10) {
                setTimeout(() => { for (let e = r; e <= Math.min(a, r + 9); e++) $.has(e) || m.has(e) || g(e) }, 0)
            }
        }
    }

    function v(e) {
        if (!e || !s || !c) return;
        let n = (d || e.width) / (h || e.height), a = s / c, i_draw, r_draw;
        n > a ? i_draw = (r_draw = c) * n : r_draw = (i_draw = s) / n;
        t.clearRect(0, 0, s, c);
        t.drawImage(e, (s - i_draw) * .5, (c - r_draw) * .5, i_draw, r_draw);
    }

    let x = l, w = null, p = !1;
    function y() { w && v(w) }
    
    let C = (function e(t) {
        let n = t;
        for (; n && !n.classList?.contains("footer__video-scrub");) n = n.parentElement;
        return n || document.body
    })(e);

    u();
    for (let E = l; E < l + Math.min(20, i); E++) g(E);
    b(l); 
    g(l).then(e => { e && (w = e, y()) });

    // SCROLL LISTENER ASSEGNATO ALLA VARIABILE GLOBALE
    footerScrollHandler = function() {
        let rect = C.getBoundingClientRect();
        let top = window.scrollY + rect.top;
        let total = Math.max(1, C.offsetHeight - window.innerHeight);
        let progress = Math.min(1, Math.max(0, (window.scrollY - top) / total));
        
        let frame = Math.min(l + (i - 1), Math.max(l, Math.round(progress * (i - 1)) + l));
        if (frame !== x) {
            b(x = frame);
            if (!p) {
                p = true;
                requestAnimationFrame(async () => {
                    let img = $.get(x);
                    if (!img) {
                        // fallback logic omitted for brevity, keeping it simple
                        img = await g(x);
                    }
                    if (img) { w = img; v(img); }
                    p = false;
                });
            }
        }
    };
    window.addEventListener("scroll", footerScrollHandler, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
        footerResizeObserver = new ResizeObserver(() => { u(); y(); });
        footerResizeObserver.observe(o);
    }
}

// =============================================================================
// 6. MODULI ESISTENTI (Filter, Hover, Words, Team, Wall, Flip, Count, Toggle)
// =============================================================================
// ... (Tutte le funzioni precedenti rimangono invariate, le richiamo sotto)

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

let currentFilterResizeHandler = null;
function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    if (!groups.length) return;

    if (currentFilterResizeHandler) { window.removeEventListener('resize', currentFilterResizeHandler); currentFilterResizeHandler = null; }
    currentFilterResizeHandler = () => {
        groups.forEach(group => { const activeBtn = group.querySelector('[data-filter-target][data-filter-status="active"]'); if (activeBtn) activeBtn.click(); });
    };
    window.addEventListener('resize', currentFilterResizeHandler);

    groups.forEach(group => {
        const oldGroup = group; const newGroup = oldGroup.cloneNode(true); oldGroup.parentNode.replaceChild(newGroup, oldGroup);
        const targetMatch = (newGroup.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
        const nameMatch = (newGroup.getAttribute('data-filter-name-match') || 'multi').trim().toLowerCase();
        const buttons = [...newGroup.querySelectorAll('[data-filter-target]')];
        const items = [...newGroup.querySelectorAll('[data-filter-name]')];
        const itemTokens = new Map();
        items.forEach(el => {
            const collectors = el.querySelectorAll('[data-filter-name-collect]');
            if (collectors.length) {
                const tokens = []; collectors.forEach(c => { const v = (c.getAttribute('data-filter-name-collect') || '').trim().toLowerCase(); if (v) tokens.push(v); });
                if (tokens.length) el.setAttribute('data-filter-name', tokens.join(' '));
            }
            const raw = (el.getAttribute('data-filter-name') || '').trim().toLowerCase();
            itemTokens.set(el, new Set(raw ? raw.split(/\s+/).filter(Boolean) : []));
            el.setAttribute('data-filter-status', 'active'); el.removeAttribute('data-grid-pos');
        });
        let activeTags = targetMatch === 'single' ? null : new Set(['all']);
        const paint = (rawTarget) => {
            if (rawTarget) {
                const target = rawTarget.trim().toLowerCase();
                if (target === 'all' || target === 'reset') { if (targetMatch === 'single') activeTags = null; else { activeTags.clear(); activeTags.add('all'); } }
                else if (targetMatch === 'single') { activeTags = target; }
                else { if (activeTags.has('all')) activeTags.delete('all'); if (activeTags.has(target)) activeTags.delete(target); else activeTags.add(target); if (activeTags.size === 0) { activeTags.clear(); activeTags.add('all'); } }
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
                    if (isDesktop) el.setAttribute('data-grid-pos', visibleCounter <= 5 ? visibleCounter : ((visibleCounter - 6) % 8) + 6);
                    else el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'active');
                } else {
                    el.removeAttribute('data-grid-pos');
                    el.setAttribute('data-filter-status', 'not-active');
                }
            });
            buttons.forEach(btn => {
                const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
                if (t === 'reset') btn.setAttribute('data-filter-status', isFiltered ? 'active' : 'not-active');
                else {
                    let on = (t === 'all') ? !isFiltered : (targetMatch === 'single' ? activeTags === t : (activeTags instanceof Set && activeTags.has(t)));
                    btn.setAttribute('data-filter-status', on ? 'active' : 'not-active');
                }
            });
            ScrollTrigger.refresh();
        };
        newGroup.onclick = (e) => { const btn = e.target.closest('[data-filter-target]'); if (btn) paint(btn.getAttribute('data-filter-target')); };
        paint('all');
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
                wrapper.style.overflow = 'hidden'; wrapper.style.display = 'block'; wrapper.style.lineHeight = 'inherit';
                line.parentNode.insertBefore(wrapper, line); wrapper.appendChild(line);
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
    if (scrollIcon) { gsap.to(".scroll", { autoAlpha: 0, duration: 0.2, scrollTrigger: { trigger: ".mwg_effect029", start: "top top", end: "top top-=1", toggleActions: "play none reverse none" }}); }
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
            for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
            return a;
        }
        function setup() {
            if (tl) tl.kill();
            items.forEach((item) => { item.querySelectorAll("[data-logo-wall-target]").forEach((old) => { if(old.parentNode.querySelectorAll("[data-logo-wall-target]").length > 1 || old.classList.contains('cloned-logo')) old.remove(); }); });
            pattern = shuffleArray(Array.from({ length: visibleItems.length }, (_, i) => i));
            patternIndex = 0;
            pool = originalTargets.map((n) => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
            for (let i = 0; i < visibleItems.length; i++) { const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i]; parent.innerHTML = ''; parent.appendChild(pool.shift()); }
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
            if (current) gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => { current.remove(); pool.push(current); }});
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

function initCircleType() {
    const circleEl = document.getElementById('circlep');
    if (circleEl && typeof CircleType !== 'undefined') new CircleType(circleEl);
}

function initScaleOnScroll() {
    const elements = gsap.utils.toArray("[data-scale]");
    if (!elements.length) return;
    elements.forEach((el) => {
        gsap.killTweensOf(el);
        gsap.set(el, { scale: 1.2 });
        gsap.to(el, { scale: 1, ease: "power2.inOut", duration: 1.5, scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }});
    });
}

let cmsNextScrollHandler = null;
function initCmsNextPowerUp() {
    if (typeof $ === "undefined") return;
    if (cmsNextScrollHandler) { window.removeEventListener("scroll", cmsNextScrollHandler); cmsNextScrollHandler = null; }
    const componentsData = [];
    $("[tr-cmsnext-element='component']").each(function () {
        let componentEl = $(this), cmsListEl = componentEl.find(".w-dyn-items").first(), cmsItemEl = cmsListEl.children(), currentItemEl, noResultEl = componentEl.find("[tr-cmsnext-element='no-result']");
        cmsItemEl.each(function () { if ($(this).find(".w--current").length) currentItemEl = $(this); });
        let nextItemEl = currentItemEl ? currentItemEl.next() : $(), prevItemEl = currentItemEl ? currentItemEl.prev() : $();
        if (componentEl.attr("tr-cmsnext-loop") === "true") { if (!nextItemEl.length) nextItemEl = cmsItemEl.first(); if (!prevItemEl.length) prevItemEl = cmsItemEl.last(); }
        let displayEl = nextItemEl;
        if (componentEl.attr("tr-cmsnext-showprev") === "true") displayEl = prevItemEl;
        if (componentEl.attr("tr-cmsnext-showall") === "true") { prevItemEl.addClass("is-prev"); currentItemEl && currentItemEl.addClass("is-current"); nextItemEl.addClass("is-next"); } else { cmsItemEl.not(displayEl).remove(); if (!displayEl.length) noResultEl.show(); if (!displayEl.length && componentEl.attr("tr-cmsnext-hideempty") === "true") componentEl.hide(); }
        const sectionEl = componentEl.closest(".section__next-project");
        let targetItemEl = nextItemEl;
        if (componentEl.attr("tr-cmsnext-showprev") === "true") targetItemEl = prevItemEl;
        if (sectionEl.length && targetItemEl && targetItemEl.length) { componentsData.push({ sectionEl, componentEl, targetItemEl, triggered: false }); }
    });
    if (componentsData.length) {
        let isRunning = false;
        cmsNextScrollHandler = () => {
            if (isRunning) return;
            isRunning = true;
            window.requestAnimationFrame(() => {
                componentsData.forEach((item) => {
                    if (item.triggered) return;
                    if (!document.contains(item.sectionEl[0])) return;
                    const sectionRect = item.sectionEl[0].getBoundingClientRect();
                    const componentHeight = item.componentEl.outerHeight() || 0;
                    if (sectionRect.bottom <= componentHeight + 1 && sectionRect.bottom >= 0) {
                        const linkEl = item.targetItemEl.find("a").first();
                        const href = linkEl.attr("href");
                        if (href) { item.triggered = true; window.location.href = href; }
                    }
                });
                isRunning = false;
            });
        };
        window.addEventListener("scroll", cmsNextScrollHandler, { passive: true });
    }
}

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
            wrapper.style.overflow = 'hidden'; wrapper.style.display = 'block';
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
// NAVIGAZIONE E RESET
// =============================================================================
function syncHead(newDoc) {
    const currentHead = document.head;
    const newStyles = newDoc.head.querySelectorAll('link[rel="stylesheet"], style');
    const currentStylesMap = new Set();
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(s => { currentStylesMap.add(s.href || s.innerText); });
    newStyles.forEach(style => { if (!currentStylesMap.has(style.href || style.innerText)) { currentHead.appendChild(style.cloneNode(true)); } });
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

function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    if (window.Webflow) { window.Webflow.destroy(); window.Webflow.ready(); window.Webflow.require('ix2').init(); }
    if (window.lenis) { window.lenis.scrollTo(0, { immediate: true }); window.lenis.resize(); }
    
    // Inizializza tutto
    initCategoryCount();
    initGridToggle();
    initMutliFilterSetupMultiMatch();
    initPsItemHover();
    initMwgEffect029();
    initLogoWallCycle();
    
    // Nuovi moduli integrati
    initGlobalParallax();
    initSplitTextAnimations();
    initScrambleTextAnimations();
    initFooterCanvasScrubber();
    initCircleType();
    initScaleOnScroll();
    initCmsNextPowerUp();

    // Moduli opzionali
    if (typeof initWGTeamModule === "function") initWGTeamModule();
    if (typeof initAboutGridFlip === "function") initAboutGridFlip();
    
    initializeAnimations(isTransition);
    setTimeout(() => { ScrollTrigger.refresh(); }, 400);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
