(() => {
    "use strict";

    // -------------------------
    // Content
    // -------------------------
    const DATA = {
        rice: {
            label: "Rice Customers",
            customers: [
                { id: "market_trader", name: "Market Trader", icon: "stall" },
                { id: "hotel_restaurant", name: "Hotel/Restaurant", icon: "plate" },
                { id: "rice_mill", name: "Rice Mill", icon: "factory" },
                { id: "supermarket", name: "Supermarket", icon: "cart" }
            ],
            needs: [
                {
                    id: "n1",
                    text: "Wants affordable price, pays cash immediately",
                    matchTo: "market_trader"
                },
                {
                    id: "n2",
                    text: "Wants consistent quality, pays weekly or monthly",
                    matchTo: "hotel_restaurant"
                },
                {
                    id: "n3",
                    text: "Wants large quantity of raw paddy, pays on delivery",
                    matchTo: "rice_mill"
                },
                {
                    id: "n4",
                    text: "Wants packaged product with label, pays in 30-60 days",
                    matchTo: "supermarket"
                }
            ]
        },
        fish: {
            label: "Fish Customers",
            customers: [
                { id: "pepper_soup_joint", name: "Pepper Soup Joint", icon: "pot" },
                { id: "restaurant", name: "Restaurant", icon: "building" },
                { id: "market_seller", name: "Market Seller", icon: "woman" },
                { id: "fish_processor", name: "Fish Processor", icon: "rack" }
            ],
            needs: [
                {
                    id: "n1",
                    text: "Wants 1kg catfish, buys 2-3 times per week",
                    matchTo: "pepper_soup_joint"
                },
                {
                    id: "n2",
                    text: "Wants same size fish always, orders weekly",
                    matchTo: "restaurant"
                },
                {
                    id: "n3",
                    text: "Wants mixed sizes, pays cash",
                    matchTo: "market_seller"
                },
                {
                    id: "n4",
                    text: "Wants large volume any size",
                    matchTo: "fish_processor"
                }
            ]
        }
    };

    // -------------------------
    // Elements
    // -------------------------
    const screenIntro = document.getElementById("screenIntro");
    const screenGame = document.getElementById("screenGame");
    const screenDone = document.getElementById("screenDone");

    const riceBtn = document.getElementById("riceBtn");
    const fishBtn = document.getElementById("fishBtn");
    const resetBtn = document.getElementById("resetBtn");

    const versionLabel = document.getElementById("versionLabel");
    const customerList = document.getElementById("customerList");
    const needTray = document.getElementById("needTray");

    const matchCount = document.getElementById("matchCount");
    const toast = document.getElementById("toast");
    const srLive = document.getElementById("srLive");

    const soundToggle = document.getElementById("soundToggle");

    const doneText = document.getElementById("doneText");
    const otherVersionBtn = document.getElementById("otherVersionBtn");

    // -------------------------
    // State
    // -------------------------
    let mode = null;              // "rice" or "fish"
    let matches = 0;
    let activeDrag = null;        // { el, id, matchTo, startX, startY, rect, offsetX, offsetY, homeParent, homeIndex }
    let zones = [];               // [{ id, el, rect }]
    let pointerId = null;

    // -------------------------
    // Screen helpers
    // -------------------------
    function showScreen(which) {
        screenIntro.classList.remove("is-active");
        screenGame.classList.remove("is-active");
        screenDone.classList.remove("is-active");
        which.classList.add("is-active");
    }

    function announce(text) {
        srLive.textContent = text;
    }

    function setToast(text) {
        toast.textContent = text || "";
    }

    function setMatchCount() {
        matchCount.textContent = `${matches}/4`;
    }

    // -------------------------
    // Simple inline SVG icons (offline)
    // -------------------------
    function iconSVG(name) {
        const common = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
        const wrap = (paths) => `
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                ${paths}
            </svg>
        `;

        switch (name) {
            case "stall":
                return wrap(`
                    <path ${common} d="M4 10h16" />
                    <path ${common} d="M6 10v10h12V10" />
                    <path ${common} d="M6 6h12l2 4H4l2-4z" />
                `);
            case "plate":
                return wrap(`
                    <path ${common} d="M4 3v7" />
                    <path ${common} d="M7 3v7" />
                    <path ${common} d="M4 7h3" />
                    <path ${common} d="M14 3v8" />
                    <path ${common} d="M18 3v8" />
                    <path ${common} d="M14 7h4" />
                    <path ${common} d="M10 21c6 0 10-3.5 10-8H0c0 4.5 4 8 10 8z" />
                `);
            case "factory":
                return wrap(`
                    <path ${common} d="M3 21V10l6 3V10l6 3V8l6 3v10H3z" />
                    <path ${common} d="M7 21v-6" />
                    <path ${common} d="M11 21v-6" />
                    <path ${common} d="M15 21v-6" />
                `);
            case "cart":
                return wrap(`
                    <path ${common} d="M6 6h15l-2 9H7L6 6z" />
                    <path ${common} d="M6 6l-2-2H2" />
                    <path ${common} d="M8 20a1 1 0 1 0 0.01 0" />
                    <path ${common} d="M18 20a1 1 0 1 0 0.01 0" />
                `);
            case "pot":
                return wrap(`
                    <path ${common} d="M6 9h12" />
                    <path ${common} d="M7 9v8a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V9" />
                    <path ${common} d="M9 6c0 1 1 1 1 2s-1 1-1 2" />
                    <path ${common} d="M12 6c0 1 1 1 1 2s-1 1-1 2" />
                    <path ${common} d="M15 6c0 1 1 1 1 2s-1 1-1 2" />
                `);
            case "building":
                return wrap(`
                    <path ${common} d="M4 21V7l8-4 8 4v14H4z" />
                    <path ${common} d="M9 21v-6h6v6" />
                    <path ${common} d="M8 10h1" />
                    <path ${common} d="M15 10h1" />
                    <path ${common} d="M8 13h1" />
                    <path ${common} d="M15 13h1" />
                `);
            case "woman":
                return wrap(`
                    <path ${common} d="M12 12a4 4 0 1 0-0.01 0" />
                    <path ${common} d="M6 21c1-4 3-6 6-6s5 2 6 6" />
                    <path ${common} d="M9 12c-2 1-3 2-4 4" />
                    <path ${common} d="M15 12c2 1 3 2 4 4" />
                `);
            case "rack":
                return wrap(`
                    <path ${common} d="M5 8h14" />
                    <path ${common} d="M6 8v11" />
                    <path ${common} d="M18 8v11" />
                    <path ${common} d="M8 12h8" />
                    <path ${common} d="M8 16h8" />
                `);
            default:
                return wrap(`<path ${common} d="M12 2v20M2 12h20" />`);
        }
    }

    // -------------------------
    // Audio (offline, no files)
    // -------------------------
    function playTone(type) {
        if (!soundToggle.checked) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.value = type === "good" ? 740 : 240;
            gain.gain.value = 0.04;

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();

            setTimeout(() => {
                osc.stop();
                ctx.close().catch(() => {});
            }, 140);
        } catch (e) {
            // ignore
        }
    }

    // -------------------------
    // Rendering
    // -------------------------
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function render(modeKey) {
        mode = modeKey;
        localStorage.setItem("agrisiti_match_mode", modeKey);
        matches = 0;
        setMatchCount();
        setToast("");

        const cfg = DATA[mode];
        versionLabel.textContent = cfg.label;

        // Customers (left)
        customerList.innerHTML = cfg.customers.map(c => `
            <div class="customer-card" data-customer="${c.id}">
                <div class="customer-top">
                    <div class="customer-left">
                        <div class="icon" aria-hidden="true">${iconSVG(c.icon)}</div>
                        <div class="customer-name">${c.name}</div>
                    </div>
                    <div class="lockmark" aria-hidden="true">✓</div>
                </div>
                <div class="dropzone" data-zone="${c.id}" aria-label="Drop need here for ${c.name}">
                    Drop the matching need here
                </div>
            </div>
        `).join("");

        // Needs (right) — shuffled
        const needs = shuffle(cfg.needs);
        needTray.innerHTML = needs.map((n, i) => `
            <div class="need-card"
                 role="button"
                 tabindex="0"
                 aria-label="Need card: ${n.text}"
                 data-need="${n.id}"
                 data-match="${n.matchTo}">
                <div class="need-text">${n.text}</div>
                <span class="need-hint">Drag me</span>
            </div>
        `).join("");

        // Build zones rect list (after layout paint)
        requestAnimationFrame(refreshZones);

        // Bind drag to each need card
        bindNeeds();

        // Allow keyboard “pick/drop” (basic)
        bindKeyboardAssist();

        showScreen(screenGame);
        announce(`${cfg.label} loaded. Match 4 needs to 4 customers.`);
    }

    function refreshZones() {
        zones = Array.from(document.querySelectorAll("[data-zone]")).map(z => {
            const rect = z.getBoundingClientRect();
            return { id: z.getAttribute("data-zone"), el: z, rect };
        });
    }

    // -------------------------
    // Drag logic (Pointer Events: mobile friendly)
    // -------------------------
    function bindNeeds() {
        const cards = Array.from(document.querySelectorAll(".need-card"));

        cards.forEach(card => {
            card.addEventListener("pointerdown", (e) => startDrag(e, card));
        });

        window.addEventListener("resize", () => requestAnimationFrame(refreshZones), { passive: true });
        window.addEventListener("scroll", () => requestAnimationFrame(refreshZones), { passive: true });
    }

    function startDrag(e, el) {
        if (el.classList.contains("locked")) return;

        pointerId = e.pointerId;
        el.setPointerCapture(pointerId);

        refreshZones();

        const rect = el.getBoundingClientRect();
        const homeParent = el.parentElement;
        const homeIndex = Array.from(homeParent.children).indexOf(el);

        // store state
        activeDrag = {
            el,
            id: el.getAttribute("data-need"),
            matchTo: el.getAttribute("data-match"),
            startX: e.clientX,
            startY: e.clientY,
            rect,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            homeParent,
            homeIndex
        };

        // Move to body overlay positioning
        el.classList.add("dragging");
        el.style.position = "fixed";
        el.style.left = `${rect.left}px`;
        el.style.top = `${rect.top}px`;
        el.style.width = `${rect.width}px`;
        el.style.zIndex = "9999";

        // prevent page scroll on touch
        e.preventDefault();

        document.addEventListener("pointermove", onMove, { passive: false });
        document.addEventListener("pointerup", onUp, { passive: false });
        document.addEventListener("pointercancel", onCancel, { passive: false });

        highlightZone(null);
    }

    function onMove(e) {
        if (!activeDrag || e.pointerId !== pointerId) return;

        e.preventDefault();

        const x = e.clientX - activeDrag.offsetX;
        const y = e.clientY - activeDrag.offsetY;

        activeDrag.el.style.left = `${x}px`;
        activeDrag.el.style.top = `${y}px`;

        const over = zoneUnderPointer(e.clientX, e.clientY);
        highlightZone(over ? over.id : null);
    }

    function onUp(e) {
        if (!activeDrag || e.pointerId !== pointerId) return;
        e.preventDefault();

        const over = zoneUnderPointer(e.clientX, e.clientY);
        highlightZone(null);

        if (!over) {
            bounceBack(activeDrag.el);
            cleanupDrag();
            return;
        }

        // Correct?
        const correct = over.id === activeDrag.matchTo;
        if (correct) {
            lockToZone(activeDrag.el, over.el, over.id);
            playTone("good");
            setToast("Correct match! ✓");
            announce("Correct match.");
        } else {
            wrongDrop(activeDrag.el);
            playTone("bad");
            setToast("Not quite — try a different customer.");
            announce("Not quite. Try again.");
        }

        cleanupDrag();
    }

    function onCancel(e) {
        if (!activeDrag || e.pointerId !== pointerId) return;
        bounceBack(activeDrag.el);
        cleanupDrag();
    }

    function cleanupDrag() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);

        if (activeDrag) {
            activeDrag.el.classList.remove("dragging");
            activeDrag.el.style.position = "";
            activeDrag.el.style.left = "";
            activeDrag.el.style.top = "";
            activeDrag.el.style.width = "";
            activeDrag.el.style.zIndex = "";
        }

        activeDrag = null;
        pointerId = null;
    }

    function zoneUnderPointer(x, y) {
        // Use latest rects
        for (const z of zones) {
            const r = z.el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                return { ...z, rect: r };
            }
        }
        return null;
    }

    function highlightZone(zoneId) {
        document.querySelectorAll(".customer-card").forEach(c => c.classList.remove("over"));
        if (!zoneId) return;

        const card = document.querySelector(`.customer-card[data-customer="${zoneId}"]`);
        if (card && !card.classList.contains("matched")) card.classList.add("over");
    }

    function bounceBack(el) {
        // return to tray position
        if (!activeDrag) return;

        const parent = activeDrag.homeParent;
        const children = Array.from(parent.children);
        const idx = Math.min(activeDrag.homeIndex, children.length);

        // place back into tray in the original index (best effort)
        if (idx >= children.length) parent.appendChild(el);
        else parent.insertBefore(el, children[idx]);

        el.classList.add("shake");
        setTimeout(() => el.classList.remove("shake"), 300);
    }

    function wrongDrop(el) {
        bounceBack(el);
    }

    function lockToZone(needEl, zoneEl, zoneId) {
        // Move card inside the dropzone (snap-to-grid)
        zoneEl.textContent = "";
        zoneEl.appendChild(needEl);

        needEl.classList.remove("shake");
        needEl.classList.add("locked", "pop");
        needEl.querySelector(".need-hint")?.remove();

        // Mark customer as matched + show check
        const customerCard = document.querySelector(`.customer-card[data-customer="${zoneId}"]`);
        if (customerCard) customerCard.classList.add("matched", "pop");

        matches += 1;
        setMatchCount();

        // disable dragging
        needEl.style.touchAction = "none";

        // done?
        if (matches >= 4) finish();
    }

    function finish() {
        const label = DATA[mode].label;
        doneText.textContent = `You completed all matches for ${label}.`;

        setToast("");
        announce("All matches complete. Great job!");
        showScreen(screenDone);
        celebrate();
    }

    function celebrate() {
        // lightweight confetti-ish: pulse the done card
        screenDone.classList.add("pop");
        setTimeout(() => screenDone.classList.remove("pop"), 300);
    }

    // -------------------------
    // Keyboard assist (simple)
    // -------------------------
    function bindKeyboardAssist() {
        // Enter key on need card will “pick up” and then choose a customer by focusing dropzone and pressing Enter
        // Minimal but helpful for accessibility.
        let picked = null;

        needTray.querySelectorAll(".need-card").forEach(card => {
            card.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;
                if (card.classList.contains("locked")) return;

                picked = card;
                setToast("Selected a need. Now click a customer drop area to place it.");
                announce("Need selected. Choose a customer drop area.");
            });
        });

        customerList.querySelectorAll("[data-zone]").forEach(zone => {
            zone.setAttribute("tabindex", "0");
            zone.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;
                if (!picked) return;

                const zoneId = zone.getAttribute("data-zone");
                const correct = picked.getAttribute("data-match") === zoneId;

                if (correct) {
                    lockToZone(picked, zone, zoneId);
                    playTone("good");
                } else {
                    picked.classList.add("shake");
                    setTimeout(() => picked.classList.remove("shake"), 300);
                    playTone("bad");
                    setToast("Not quite — try a different customer.");
                }

                picked = null;
            });
        });
    }

    // -------------------------
    // Events
    // -------------------------
    riceBtn.addEventListener("click", () => render("rice"));
    fishBtn.addEventListener("click", () => render("fish"));

    resetBtn.addEventListener("click", () => {
        if (!mode) return;
        render(mode);
    });

    otherVersionBtn.addEventListener("click", () => {
        const next = mode === "rice" ? "fish" : "rice";
        render(next);
    });

    // Default
    showScreen(screenIntro);
    setMatchCount();
    announce("Choose Rice Customers or Fish Customers to start.");
})();
