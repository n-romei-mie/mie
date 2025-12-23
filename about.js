/**
 * WEBFLOW ULTIMATE ENGINE - FINAL PRODUCTION
 * Include: Logo Wall Fix, Parallax, Filters, Nav, Scramble, Footer, SplitText
 */

// 1. REGISTRAZIONE PLUGIN
if (typeof gsap !== "undefined") {
    const plugins = [ScrollTrigger, Flip];
    if (typeof SplitText !== "undefined") plugins.push(SplitText);
    if (typeof ScrambleTextPlugin !== "undefined") plugins.push(ScrambleTextPlugin);
    gsap.registerPlugin(...plugins);
}

// =============================================================================
// HELPER: SAFE REVERT & CLEANUP
// =============================================================================
function safeSplitRevert(elements, className) {
    if (!elements.length) return;
    elements.forEach(el => {
        if (el.splitInstance) {
            el.splitInstance.revert();
            el.splitInstance = null;
        }
        el.classList.remove(className);
        // Pulizia wrapper manuali
        const wrappers = el.querySelectorAll('.line-wrapper');
        wrappers.forEach(w => {
            const parent = w.parentNode;
            while (w.firstChild) parent.insertBefore(w.firstChild, w);
            parent.removeChild(w);
        });
    });
}

// =============================================================================
// 2. LOGO WALL CYCLE (RIPRISTINATO ORIGINALE)
// =============================================================================
function initLogoWallCycle() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const loopDelay = 1.5;
    const duration = 0.9;

    document.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
        // Reset per evitare istanze multiple sullo stesso elemento
        if (root._logoWallActive) return; 
        root._logoWallActive = true;

        const list = root.querySelector("[data-logo-wall-list]");
        if (!list) return;

        const items = Array.from(list.querySelectorAll("[data-logo-wall-item]"));
        if (!items.length) return;

        const shuffleFront = root.getAttribute("data-logo-wall-shuffle") !== "false";
        
        // Target originali (solo quelli presenti nell'HTML statico)
        const originalTargets = items
            .map((item) => item.querySelector("[data-logo-wall-target]"))
            .filter(Boolean);

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

            // Rimuovi target iniettati precedentemente (pulizia DOM)
            items.forEach((item) => {
                const targets = item.querySelectorAll("[data-logo-wall-target]");
                targets.forEach((t) => {
                    // Rimuovi se è un clone o se ce ne sono più di uno
                    if (t.classList.contains('cloned-logo') || targets.length > 1) {
                       // t.remove(); // Commentato: la logica originale rimuoveva tutto e rigenerava
                    }
                });
                // Reset brutale del contenuto per evitare duplicati fantasma
                const parent = item.querySelector("[data-logo-wall-target-parent]") || item;
                // Nota: Non svuotiamo brutalmente se ci sono altri elementi, ma qui assumiamo struttura fissa
            });
            
            // Ricostruzione Pool
            pool = originalTargets.map((n) => {
                const c = n.cloneNode(true);
                c.classList.add('cloned-logo');
                return c;
            });

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

            // Riempimento iniziale
            for (let i = 0; i < visibleCount; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                // Pulizia sicura: rimuovi vecchi target dentro il parent corrente
                parent.querySelectorAll("[data-logo-wall-target]").forEach(el => el.remove());
                parent.appendChild(pool.shift());
            }

            tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
            tl.call(swapNext);
            tl.play(); // Avvio immediato
        }

        function swapNext() {
            const nowCount = items.filter(isVisible).length;
            if (nowCount !== visibleCount) { setup(); return; }
            
            // Refill pool se vuoto
            if (!pool.length) {
                 pool = originalTargets.map((n) => { const c = n.cloneNode(true); c.classList.add('cloned-logo'); return c; });
                 pool = shuffleArray(pool);
            }

            const idx = pattern[patternIndex % visibleCount];
            patternIndex++;

            const container = visibleItems[idx];
            // Supporto :has per trovare il parent corretto
            const parent = container.querySelector("[data-logo-wall-target-parent]") || 
                           (container.querySelector(":scope > [data-logo-wall-target]") ? container : container.children[0]) || 
                           container;

            const current = parent.querySelector("[data-logo-wall-target]");
            // Se c'è già un'animazione in corso (2 loghi), salta
            if (parent.querySelectorAll("[data-logo-wall-target]").length > 1) return;

            const incoming = pool.shift();
            if (!incoming) return;

            gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
            parent.appendChild(incoming);

            if (current) {
                gsap.to(current, {
                    yPercent: -50, autoAlpha: 0, duration, ease: "expo.inOut",
                    onComplete: () => { 
                        current.remove(); 
                        // Recycle current into pool? Original logic pushed it back
                        // pool.push(current); // Opzionale: riciclare
                    }
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
            onLeaveBack: () => tl && tl.pause()
        });
        
        // Visibility API per risparmiare risorse
        document.addEventListener("visibilitychange", () => {
             if (!tl) return;
             document.hidden ? tl.pause() : tl.play();
        });
    });
}

// =============================================================================
// 3. GLOBAL PARALLAX (TUO CODICE INTEGRATO)
// =============================================================================
function initGlobalParallax() {
    let mm = gsap.matchMedia();
    mm.add({
        isMobile: "(max-width:479px)",
        isMobileLandscape: "(max-width:767px)",
        isTablet: "(max-width:991px)",
        isDesktop: "(min-width:992px)",
    }, (ctx) => {
        let { isMobile, isMobileLandscape, isTablet } = ctx.conditions;
        
        document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
            let disable = trigger.getAttribute("data-parallax-disable");
            if ((disable === "mobile" && isMobile) ||
                (disable === "mobileLandscape" && isMobileLandscape) ||
                (disable === "tablet" && isTablet)) { return; }

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
                    }
                }
            );
        });
    });
}

// =============================================================================
// 4. SPLIT TEXT (LINES & EYEBROW)
// =============================================================================
const splitDataMap = new Map();

function initSplitTextAnimations() {
    if (typeof SplitText === "undefined") return;

    // A. DATA-SPLIT (Lines Unmask)
    const elements = gsap.utils.toArray("[data-split]");
    elements.forEach((el) => {
        // Revert se esiste
        const existing = splitDataMap.get(el);
        if (existing) { existing.split.revert(); existing.st.kill(); }

        const alreadyAnimated = el._hasAnimated === true;
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
        splitDataMap.set(el, { split, st });
    });

    // B. EYEBROW (Chars)
    gsap.utils.toArray(".eyebrow").forEach((el) => {
        if(el._ebSplit) el._ebSplit.revert();
        const split = new SplitText(el, { type: "chars", mask: "chars", charsClass: "eyebrow-char" });
        el._ebSplit = split;
        gsap.set(split.chars, { opacity: 0 });
        ScrollTrigger.create({
            trigger: el, start: "top 85%", once: true,
            onEnter: () => gsap.to(split.chars, { opacity: 1, duration: 0.05, ease: "power1.out", stagger: { amount: 0.4, from: "random" } })
        });
    });
}

// =============================================================================
// 5. SCRAMBLE TEXT & FOOTER CANVAS
// =============================================================================
function initScrambleTextAnimations() {
    if (typeof ScrambleTextPlugin === "undefined") return;
    document.querySelectorAll('[data-scramble-hover="link"]').forEach(target => {
        const textEl = target.querySelector('[data-scramble-hover="target"]');
        if (!textEl) return;
        const originalText = textEl.textContent;
        const customText = textEl.getAttribute("data-scramble-text");
        
        // Usa SplitText se disponibile per char coloring
        if (typeof SplitText !== "undefined") new SplitText(textEl, { type: "chars", charsClass: "char" });

        const highlightRandom = () => {
            const chars = textEl.querySelectorAll(".char");
            if(chars.length) {
                chars.forEach(c => c.style.color = "");
                chars[Math.floor(Math.random() * chars.length)].style.color = "#C3FF00";
            }
        };

        // Clone to clear listeners
        const newTarget = target.cloneNode(true);
        target.parentNode.replaceChild(newTarget, target);
        // Re-select textEl inside newTarget if it was inside
        const newTextEl = newTarget.querySelector('[data-scramble-hover="target"]') || textEl;

        newTarget.addEventListener("mouseenter", () => {
            gsap.to(newTextEl, { duration: 1, scrambleText: { text: customText || originalText, chars: "_X" }, onUpdate: highlightRandom });
        });
        newTarget.addEventListener("mouseleave", () => {
            gsap.to(newTextEl, { duration: 0.6, scrambleText: { text: originalText, speed: 2, chars: "X_" }, onUpdate: highlightRandom });
        });
    });
}

let footerScrollHandler = null;
function initFooterCanvasScrubber() {
    let e = document.getElementById("footercanvas");
    if (!e || !e.getContext) return;
    if (footerScrollHandler) window.removeEventListener("scroll", footerScrollHandler);

    let t = e.getContext("2d", { alpha: !1, desynchronized: !0 });
    let n = e.dataset.base, i = parseInt(e.dataset.frames||"45"), a = e.dataset.ext||"jpg";
    if(!n) return;

    let $ = new Map, m = new Map, l=0, x=0, p=false;
    async function g(idx) {
        if($.has(idx)) return $.get(idx);
        let src = n + String(idx).padStart(5, "0") + "." + a;
        let b = await fetch(src).then(r=>r.blob()).then(createImageBitmap).catch(()=>null);
        if(b) { $.set(idx, b); if($.size>60) $.delete($.keys().next().value); }
        return b;
    }
    
    function draw(img) {
        if(!img) return;
        let s = e.parentElement.clientWidth, c = e.parentElement.clientHeight;
        e.width = s; e.height = c;
        // Simple cover logic
        let r = s/c, ir = img.width/img.height;
        let dw = ir > r ? c*ir : s, dh = ir > r ? c : s/ir;
        t.drawImage(img, (s-dw)/2, (c-dh)/2, dw, dh);
    }

    footerScrollHandler = () => {
        let rect = e.parentElement.getBoundingClientRect();
        let prog = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
        let frame = Math.floor(prog * (i - 1));
        if(frame !== x) {
            x = frame;
            if(!p) { p=true; g(x).then(img => { draw(img); p=false; }); }
        }
    };
    window.addEventListener("scroll", footerScrollHandler, {passive:true});
    g(0).then(draw); // Init frame 0
}

// =============================================================================
// 6. ALTRI MODULI (Words, Filter, Scale, etc)
// =============================================================================
function initMwgEffect029() {
    const p = document.querySelector(".mwg_effect029 .is--title-w");
    if (!p) return;
    if(p.dataset.proc === "true") p.innerHTML = p.textContent; p.dataset.proc = "true";
    p.innerHTML = p.textContent.split(" ").map(w => `<span>${w}</span>`).join(" ");
    p.querySelectorAll("span").forEach(s => s.classList.add("word" + Math.floor(Math.random()*4)));
    
    [".word1", ".word2", ".word3"].forEach((c, i) => {
        const x = ["-0.8em", "1.6em", "-2.4em"][i];
        document.querySelectorAll(`.mwg_effect029 ${c}`).forEach(el => {
            gsap.to(el, { x: x, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.2 }});
        });
    });
}

function initMutliFilterSetupMultiMatch() {
    const groups = document.querySelectorAll('[data-filter-group]');
    groups.forEach(g => {
        const group = g.cloneNode(true); g.parentNode.replaceChild(group, g); // Clean listeners
        const btns = group.querySelectorAll('[data-filter-target]');
        const items = group.querySelectorAll('[data-filter-name]');
        
        const paint = (target) => {
            let active = target === 'all' ? null : target;
            let count = 0;
            items.forEach(el => {
                const tags = el.getAttribute('data-filter-name').toLowerCase();
                const show = !active || tags.includes(active);
                el.style.display = show ? '' : 'none'; // Simple toggle
                if(show) {
                    count++;
                    // Grid logic 1-5 then loop
                    const pos = count <= 5 ? count : ((count - 6) % 8) + 6;
                    if(window.innerWidth >= 992) el.setAttribute('data-grid-pos', pos);
                }
            });
            btns.forEach(b => b.setAttribute('data-filter-status', b.getAttribute('data-filter-target') === target ? 'active' : 'not-active'));
            ScrollTrigger.refresh();
        };
        
        group.onclick = (e) => {
            const btn = e.target.closest('[data-filter-target]');
            if(btn) paint(btn.getAttribute('data-filter-target'));
        };
        paint('all'); // Init
    });
}

function initScaleOnScroll() {
    gsap.utils.toArray("[data-scale]").forEach(el => {
        gsap.fromTo(el, { scale: 1.2 }, {
            scale: 1, ease: "power2.inOut", duration: 1.5,
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }
        });
    });
}

function initCircleType() {
    const el = document.getElementById('circlep');
    if(el && typeof CircleType !== 'undefined') new CircleType(el);
}

// =============================================================================
// 7. ANIMAZIONI INGRESSO (Page Load)
// =============================================================================
function initializeAnimations(isTransition = false) {
    const delay = isTransition ? 1.1 : 0.2;
    // Link
    const links = document.querySelectorAll(".link a");
    if(links.length) {
        gsap.set(links, { y: "100%", opacity: 1 });
        gsap.to(links, { y: "0%", duration: 1, stagger: 0.1, delay });
    }
    // Data Transition (usiamo SplitType qui per non confondere con SplitText data-split)
    const elements = document.querySelectorAll('[data-transition]');
    safeSplitRevert(elements, 'split-done');
    elements.forEach(el => {
        const split = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        el.splitInstance = split;
        split.lines.forEach(l => {
            const w = document.createElement('div'); w.className = 'line-wrapper'; 
            w.style.overflow = 'hidden'; w.style.display = 'block';
            l.parentNode.insertBefore(w, l); w.appendChild(l);
        });
        gsap.set(el.querySelectorAll(".line-inner"), { y: "110%" });
        el.style.opacity = "1"; el.classList.add('split-done');
        gsap.to(el.querySelectorAll(".line-inner"), { y: "0%", duration: 1.2, stagger: 0.08, delay });
    });
}

// =============================================================================
// 8. MASTER CONTROLLER (Navigation & Reset)
// =============================================================================
function syncHead(newDoc) {
    const newTags = newDoc.head.querySelectorAll('link[rel="stylesheet"], style');
    newTags.forEach(t => {
        if(!document.head.querySelector(`[href="${t.href}"], style:contains("${t.innerText.substring(0,20)}")`)) {
            document.head.appendChild(t.cloneNode(true));
        }
    });
}

if (window.navigation) {
    navigation.addEventListener("navigate", (e) => {
        if (!e.destination.url.includes(window.location.origin)) return;
        e.intercept({
            handler: async () => {
                const res = await fetch(e.destination.url);
                const doc = new DOMParser().parseFromString(await res.text(), "text/html");
                syncHead(doc);
                if (document.startViewTransition) {
                    const t = document.startViewTransition(() => {
                        document.body.innerHTML = doc.body.innerHTML;
                        document.title = doc.title;
                    });
                    t.ready.then(() => finalizePage(true));
                } else {
                    document.body.innerHTML = doc.body.innerHTML;
                    finalizePage(true);
                }
            }
        });
    });
}

function finalizePage(isTransition = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");
    
    if (window.Webflow) { window.Webflow.destroy(); window.Webflow.ready(); window.Webflow.require('ix2').init(); }
    if (window.lenis) { window.lenis.scrollTo(0, {immediate:true}); window.lenis.resize(); }

    // Init All Modules
    initLogoWallCycle();
    initGlobalParallax();
    initSplitTextAnimations();
    initScrambleTextAnimations();
    initFooterCanvasScrubber();
    initMutliFilterSetupMultiMatch();
    initMwgEffect029();
    initScaleOnScroll();
    initCircleType();
    
    // Optional
    if(typeof initCategoryCount === "function") initCategoryCount();
    if(typeof initGridToggle === "function") initGridToggle();
    if(typeof initWGTeamModule === "function") initWGTeamModule();
    if(typeof initAboutGridFlip === "function") initAboutGridFlip();
    if(typeof initCmsNextPowerUp === "function") initCmsNextPowerUp();

    initializeAnimations(isTransition);
    setTimeout(() => ScrollTrigger.refresh(), 500);
}

window.addEventListener("DOMContentLoaded", () => finalizePage(false));
