/**
 * WEBFLOW + VIEW TRANSITION API + GSAP
 * Versione Definitiva: Risolve blocchi scroll e duplicazione elementi
 */

// Registrazione Plugin GSAP
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, Flip);
}

// --- 1. ANIMAZIONI INGRESSO (data-transition) ---
function initializeAnimations(isTransition = false) {
    const dynamicDelay = isTransition ? 1.1 : 0.2;
    const linkDelay = isTransition ? 1.2 : 0.4;

    // Link Navigazione
    const links = document.querySelectorAll(".link a");
    if (links.length > 0) {
        gsap.set(links, { y: "100%" });
        gsap.to(links, { y: "0%", duration: 1, stagger: 0.1, ease: "power4.out", delay: linkDelay });
    }

    // Elementi con attributo data-transition
    const elementsToAnimate = document.querySelectorAll('[data-transition]');
    elementsToAnimate.forEach(el => {
        // Evita di processare due volte lo stesso elemento (bug linee sottili)
        if (el.classList.contains('split-done')) return;

        const split = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        split.lines.forEach(line => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('line-wrapper');
            line.parentNode.insertBefore(wrapper, line);
            wrapper.appendChild(line);
            
            // Stili necessari per il funzionamento della maschera
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'block';
            line.style.display = 'block';
        });

        const spans = el.querySelectorAll(".line-inner");
        gsap.set(spans, { y: "110%" });
        
        // Rendiamo visibile l'elemento solo ora (gestito con opacity 0 nel CSS)
        el.classList.add('split-done');
        el.style.opacity = "1";

        gsap.to(spans, {
            y: "0%",
            duration: 1.2,
            stagger: 0.08,
            ease: "power3.out",
            delay: dynamicDelay
        });
    });
}

// --- 2. MWG EFFECT 029 (SCROLL WORDS) ---
function initMwgEffect029() {
    const paragraph = document.querySelector(".mwg_effect029 .is--title-w");
    if (!paragraph || paragraph.dataset.processed === "true") return;

    paragraph.dataset.processed = "true";
    const text = paragraph.textContent;
    paragraph.innerHTML = text.split(" ").map(w => `<span>${w}</span>`).join(" ");
    
    const words = paragraph.querySelectorAll("span");
    words.forEach(w => w.classList.add("word" + Math.floor(Math.random() * 4)));

    const configs = [{c:".word1", x:"-0.8em"}, {c:".word2", x:"1.6em"}, {c:".word3", x:"-2.4em"}];
    configs.forEach(conf => {
        document.querySelectorAll(`.mwg_effect029 ${conf.c}`).forEach(el => {
            gsap.to(el, {
                x: conf.x,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 90%", end: "bottom 10%", scrub: 0.2 }
            });
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

        const originalTargets = items.map(item => item.querySelector("[data-logo-wall-target]")).filter(Boolean);
        let tl, pool = [], visibleItems = [], pattern = [], patternIndex = 0;

        const setup = () => {
            if (tl) tl.kill();
            visibleItems = items.filter(el => window.getComputedStyle(el).display !== "none");
            const visibleCount = visibleItems.length;
            pattern = Array.from({ length: visibleCount }, (_, i) => i).sort(() => Math.random() - 0.5);
            
            items.forEach(item => item.querySelectorAll("[data-logo-wall-target]").forEach(old => old.remove()));
            pool = originalTargets.map(n => n.cloneNode(true)).sort(() => Math.random() - 0.5);

            for (let i = 0; i < visibleCount; i++) {
                const parent = visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
                parent.appendChild(pool.shift());
            }

            tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.call(() => {
                const idx = pattern[patternIndex % visibleCount];
                patternIndex++;
                const container = visibleItems[idx];
                const parent = container.querySelector("[data-logo-wall-target-parent]") || container;
                const current = parent.querySelector("[data-logo-wall-target]");
                const incoming = pool.shift();
                if (!incoming || !current) return;

                gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
                parent.appendChild(incoming);
                gsap.to(current, { yPercent: -50, autoAlpha: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => { current.remove(); pool.push(current); }});
                gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration: 0.9, delay: 0.1, ease: "expo.inOut" });
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

    const switchLayout = (toBig) => {
        const state = Flip.getState(items);
        toBig ? (grid.classList.add("is--big"), grid.classList.remove("is--small")) : (grid.classList.add("is--small"), grid.classList.remove("is--big"));
        Flip.from(state, { duration: 1.3, ease: "power4.inOut", scale: true, onComplete: () => ScrollTrigger.refresh() });
    };
    if (btnBig) btnBig.onclick = () => switchLayout(true);
    if (btnSmall) btnSmall.onclick = () => switchLayout(false);
}

// --- 5. NAVIGAZIONE (VIEW TRANSITIONS) ---
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

// --- 6. FINALIZE & RESET ---
function finalizePage(isTransition = false) {
    // 1. Reset Posizione Scroll e Lenis
    window.scrollTo(0, 0);
    if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
        window.lenis.resize();
    }

    // 2. Pulizia Totale GSAP e ScrollTrigger
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf("*");

    // 3. Reset Motore Webflow
    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
    }

    // 4. Re-Inizializzazione Script Custom
    initMwgEffect029();
    initLogoWallCycle();
    initAboutGridFlip();
    
    // 5. Inizializzazione Animazioni Ingresso
    initializeAnimations(isTransition);

    // 6. Refresh Finale ScrollTrigger (Risolve bug dello scroll bloccato)
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 200);
}

// Avvio Iniziale
window.addEventListener("DOMContentLoaded", () => {
    finalizePage(false);
});
