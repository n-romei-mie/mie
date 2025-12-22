/**
 * WEBFLOW ULTIMATE ENGINE - Versione Corretta
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

// --- 2. MWG EFFECT 029 – SCROLL WORDS (RIPRISTINATO E ADATTATO) ---
function wrapWordsInSpan(element) {
    const text = element.textContent;
    element.innerHTML = text
        .split(" ")
        .map((word) => `<span>${word}</span>`)
        .join(" ");
}

function initMwgEffect029() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    // Gestione elemento .scroll (fade out iniziale)
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
    words.forEach((word) => {
        word.classList.add("word" + Math.floor(Math.random() * 4));
    });

    // Word 1 animation
    document.querySelectorAll(".mwg_effect029 .word1").forEach((el) => {
        gsap.to(el, {
            x: "-0.8em",
            ease: "none",
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 60%",
                scrub: 0.2,
            },
        });
    });

    // Word 2 animation
    document.querySelectorAll(".mwg_effect029 .word2").forEach((el) => {
        gsap.to(el, {
            x: "1.6em",
            ease: "none",
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 60%",
                scrub: 0.2,
            },
        });
    });

    // Word 3 animation
    document.querySelectorAll(".mwg_effect029 .word3").forEach((el) => {
        gsap.to(el, {
            x: "-2.4em",
            ease: "none",
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 60%",
                scrub: 0.2,
            },
        });
    });
}

// --- 3. LOGO WALL CYCLE ---
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

// --- 4. ABOUT GRID FLIP ---
function initAboutGridFlip() {
    const grid = document.querySelector(".about__grid-wrap");
    const items = grid?.querySelectorAll(".ag__img");
    const btnBig = document.querySelector(".ag__trigger.is--big");
    const btnSmall = document.querySelector(".ag__trigger.is--small");
    if (!grid || !items?.length) return;

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
}

// --- 5. ALTRI MODULI ---
function initCategoryCount() {
    const categories = document.querySelectorAll('[data-category-id]');
    const projects = document.querySelectorAll('[data-project-category]');
    categories.forEach(category => {
        const catID = category.getAttribute('data-category-id');
        const countEl = category.querySelector('[data-category-count]');
        if (countEl) countEl.textContent = [...projects].filter(proj => proj.getAttribute('data-project-category') === catID).length;
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
            contents.forEach(content => { if (content.getAttribute('data-grid') === gridId) content.classList.add('active'); });
            ScrollTrigger.refresh();
        };
    });
}

function initMutliFilterSetupMultiMatch() {
    const groups = [...document.querySelectorAll('[data-filter-group]')];
    groups.forEach(group => {
        const buttons = [...group.querySelectorAll('[data-filter-target]')];
        const items = [...group.querySelectorAll('[data-filter-name]')];
        let activeTags = new Set(['all']);
        const paint = (target, isResize = false) => {
            if (!isResize && target) {
                target = target.toLowerCase();
                if (target === 'all') { activeTags.clear(); activeTags.add('all'); }
                else { activeTags.delete('all'); activeTags.has(target) ? activeTags.delete(target) : activeTags.add(target); if (!activeTags.size) activeTags.add('all'); }
            }
            items.forEach(el => {
                const show = activeTags.has('all') || [...activeTags].some(t => el.getAttribute('data-filter-name').toLowerCase().includes(t));
                el.setAttribute('data-filter-status', show ? 'active' : 'not-active');
            });
            buttons.forEach(btn => {
                const t = btn.getAttribute('data-filter-target').toLowerCase();
                btn.setAttribute('data-filter-status', (t === 'all' ? activeTags.has('all') : activeTags.has(t)) ? 'active' : 'not-active');
            });
        };
        group.onclick = e => { const btn = e.target.closest('[data-filter-target]'); if (btn) paint(btn.getAttribute('data-filter-target')); };
        paint('all');
    });
}

function initPsItemHover() {
    document.querySelectorAll(".ps__item").forEach((item) => {
        const imgWrap = item.querySelector(".ps__item-img");
        const cta = item.querySelector(".projects__cta");
        const targets = item.querySelectorAll("[data-split-ps]");
        if (!imgWrap || !targets.length) return;
        const allLines = [];
        targets.forEach(el => {
            const split = new SplitType(el, { types: "lines", lineClass: "split-line" });
            gsap.set(split.lines, { yPercent: 100 });
            allLines.push(...split.lines);
        });
        const tl = gsap.timeline({ paused: true });
        tl.to(allLines, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 }, 0);
        if (cta) { gsap.set(cta, { autoAlpha: 0 }); tl.to(cta, { autoAlpha: 1, duration: 0.4 }, 0); }
        imgWrap.onmouseenter = () => tl.play();
        imgWrap.onmouseleave = () => tl.reverse();
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

// --- 6. NAVIGAZIONE ---
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

// --- 7. FINALIZE ---
function finalizePage(isT = false) {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");
    if (window.Webflow) { window.Webflow.destroy(); window.Webflow.ready(); window.Webflow.require('ix2').init(); }
    if (window.lenis) { 
        window.lenis.scrollTo(0, { immediate: true }); 
        window.lenis.resize(); 
    }
    
    // Inizializza i moduli
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
