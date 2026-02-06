(() => {
    "use strict";

    // -----------------------------
    // Storage keys
    // -----------------------------
    const KEY_BMC = "agrisiti_bmc_v1";
    const KEY_BADGES = "agrisiti_badges_v1";
    const KEY_PROFILE = "agrisiti_profile_v1";

    // Previous activities (optional)
    const KEY_MATCH_MODE = "agrisiti_match_mode";
    const KEY_COSTS_MODE = "agrisiti_costs_mode";
    const KEY_COSTS_TOTAL = "agrisiti_costs_total";
    const KEY_COSTS_SELECTED = "agrisiti_costs_selected";
    const KEY_SELL_PRICE = "agrisiti_sell_price";

    // -----------------------------
    // BMC boxes config (order for guided build)
    // -----------------------------
    const BOXES = [
        {
            id: "segments",
            title: "CUSTOMER SEGMENTS",
            question: "Who will buy your product?",
            examples: "Market traders\nRestaurants\nFish processors"
        },
        {
            id: "value",
            title: "VALUE PROPOSITION",
            question: "Why should they buy from YOU? What makes you special?",
            examples: "Best quality rice\nAlways deliver on time\nFree delivery"
        },
        {
            id: "channels",
            title: "CHANNELS",
            question: "How will customers get your product?",
            type: "checks",
            options: ["Farm gate pickup", "Delivery to customer", "Market stall", "Through middleman"],
            examples: "Farm gate pickup\nDelivery to customer"
        },
        {
            id: "relationships",
            title: "CUSTOMER RELATIONSHIPS",
            question: "How will you communicate with customers?",
            examples: "Phone calls\nWhatsApp messages\nVisit them regularly"
        },
        {
            id: "revenue",
            title: "REVENUE STREAMS",
            question: "How much will you charge? How will you receive payment?",
            examples: "₦1,000 per kg of rice, cash on delivery"
        },
        {
            id: "resources",
            title: "KEY RESOURCES",
            question: "What do you need to run your farm?",
            type: "checks",
            options: ["Land", "Pond(s)", "Equipment", "Seeds/Fingerlings", "Water supply", "Labor", "Capital/Money"],
            examples: "Land\nSeeds/Fingerlings\nLabor\nCapital/Money"
        },
        {
            id: "activities",
            title: "KEY ACTIVITIES",
            question: "What are your main daily/weekly activities?",
            examples: "Planting, weeding, harvesting\nFeeding fish, checking water, harvesting"
        },
        {
            id: "partners",
            title: "KEY PARTNERS",
            question: "Who are your important suppliers and helpers?",
            examples: "Seed supplier\nFeed seller\nEquipment provider\nLaborers"
        },
        {
            id: "costs",
            title: "COST STRUCTURE",
            question: "What are your main costs?",
            examples: "Seeds ₦15,000\nFertilizer ₦24,000\nLabor ₦75,000\nTotal ₦162,000"
        }
    ];

    // -----------------------------
    // Elements
    // -----------------------------
    const screenIntro = document.getElementById("screenIntro");
    const screenCanvas = document.getElementById("screenCanvas");

    const startBtn = document.getElementById("startBtn");
    const startBtn2 = document.getElementById("startBtn2");
    const loadBtn = document.getElementById("loadBtn");
    const resetAllBtn = document.getElementById("resetAllBtn");

    const progressText = document.getElementById("progressText");
    const continueGuidedBtn = document.getElementById("continueGuidedBtn");
    const editModeBtn = document.getElementById("editModeBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    const srLive = document.getElementById("srLive");

    const modal = document.getElementById("modal");
    const modalBackdrop = document.getElementById("modalBackdrop");
    const modalTitle = document.getElementById("modalTitle");
    const modalQuestion = document.getElementById("modalQuestion");
    const modalSuggestion = document.getElementById("modalSuggestion");
    const useSuggestionBtn = document.getElementById("useSuggestionBtn");
    const modalInput = document.getElementById("modalInput");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const modalChecksWrap = document.getElementById("modalChecksWrap");
    const modalFieldWrap = document.getElementById("modalFieldWrap");

    const nameModal = document.getElementById("nameModal");
    const bizNameInput = document.getElementById("bizNameInput");
    const userNameInput = document.getElementById("userNameInput");
    const finishBtn = document.getElementById("finishBtn");
    const nameCancelBtn = document.getElementById("nameCancelBtn");

    const bizNameTop = document.getElementById("bizNameTop");
    const userNameTop = document.getElementById("userNameTop");

    const confetti = document.getElementById("confetti");

    // print
    const printArea = document.getElementById("printArea");
    const printBizName = document.getElementById("printBizName");
    const printUserName = document.getElementById("printUserName");
    const printDate = document.getElementById("printDate");
    const printGrid = document.getElementById("printGrid");

    // -----------------------------
    // State
    // -----------------------------
    let bmc = {
        boxes: {},           // {boxId: string | string[]}
        businessName: "",
        userName: ""
    };

    let guidedIndex = 0;
    let guidedActive = false;
    let editMode = false;

    // -----------------------------
    // Helpers
    // -----------------------------
    function showScreen(which) {
        screenIntro.classList.remove("is-active");
        screenCanvas.classList.remove("is-active");
        which.classList.add("is-active");
    }

    function announce(text) {
        srLive.textContent = text;
    }

    function safeParseJSON(text, fallback) {
        try { return JSON.parse(text); } catch { return fallback; }
    }

    function loadSavedBMC() {
        const raw = localStorage.getItem(KEY_BMC);
        if (!raw) return false;
        const saved = safeParseJSON(raw, null);
        if (!saved || typeof saved !== "object") return false;
        bmc = {
            boxes: saved.boxes || {},
            businessName: saved.businessName || "",
            userName: saved.userName || ""
        };
        return true;
    }

    function saveBMC() {
        localStorage.setItem(KEY_BMC, JSON.stringify(bmc));
    }

    function resetBMC() {
        localStorage.removeItem(KEY_BMC);
        bmc = { boxes: {}, businessName: "", userName: "" };
        guidedIndex = 0;
        guidedActive = false;
        editMode = false;
        renderCanvas();
        updateProgress();
    }

    function countFilled() {
        return BOXES.reduce((acc, box) => {
            const val = bmc.boxes[box.id];
            if (Array.isArray(val)) return acc + (val.length > 0 ? 1 : 0);
            return acc + (val && String(val).trim().length ? 1 : 0);
        }, 0);
    }

    function updateProgress() {
        const filled = countFilled();
        progressText.textContent = `${filled}/9`;
        downloadBtn.disabled = filled < 9 || !bmc.businessName;
    }

    function setTopNames() {
        bizNameTop.textContent = bmc.businessName || "—";
        userNameTop.textContent = bmc.userName || "—";
    }

    function boxEl(id) {
        return document.querySelector(`[data-box="${id}"]`);
    }

    function boxBodyEl(id) {
        return document.getElementById(`box_${id}`);
    }

    function formatBoxValue(val) {
        if (Array.isArray(val)) return val.join("\n");
        return String(val || "");
    }

    // -----------------------------
    // Suggestions (integrate previous activities)
    // -----------------------------
    function suggestionFor(boxId) {
        // Default fallback: examples
        const box = BOXES.find(b => b.id === boxId);
        const fallback = box ? box.examples : "";

        // Customer segments: from match mode
        if (boxId === "segments") {
            const mode = localStorage.getItem(KEY_MATCH_MODE);
            if (mode === "rice") return "Market traders\nHotel/Restaurants\nRice mill\nSupermarket";
            if (mode === "fish") return "Pepper soup joint\nRestaurant\nMarket seller\nFish processor";
            return fallback;
        }

        // Revenue streams: from selling price
        if (boxId === "revenue") {
            const price = Number(localStorage.getItem(KEY_SELL_PRICE) || 0);
            if (price > 0) return `₦${price.toLocaleString("en-NG")} per unit, cash on delivery`;
            return fallback;
        }

        // Cost structure: from selected costs + total
        if (boxId === "costs") {
            const total = Number(localStorage.getItem(KEY_COSTS_TOTAL) || 0);
            const mode = localStorage.getItem(KEY_COSTS_MODE);
            const selectedRaw = localStorage.getItem(KEY_COSTS_SELECTED);
            const selected = safeParseJSON(selectedRaw || "[]", []);

            // We can’t reliably reconstruct names unless you used the same list here.
            // So we present a helpful total + instruction.
            if (total > 0) {
                const prefix = mode === "fish" ? "Main costs: feed, fingerlings, labor, electricity" : "Main costs: seeds, fertilizer, labor, transport";
                return `${prefix}\nTotal: ₦${total.toLocaleString("en-NG")}`;
            }
            return fallback;
        }

        return fallback;
    }

    // -----------------------------
    // Rendering
    // -----------------------------
    function renderCanvas() {
        BOXES.forEach(b => {
            const val = bmc.boxes[b.id];
            const body = boxBodyEl(b.id);
            const box = boxEl(b.id);

            const text = formatBoxValue(val).trim();
            body.textContent = text || "Click to add…";
            box.classList.toggle("empty", !text);
            box.classList.toggle("filled", !!text);

            // add check tag
            let tag = box.querySelector(".tag");
            if (!tag) {
                tag = document.createElement("div");
                tag.className = "tag";
                tag.textContent = "✓";
                box.appendChild(tag);
            }
        });

        setTopNames();
        updateProgress();
    }

    function clearHighlights() {
        BOXES.forEach(b => boxEl(b.id)?.classList.remove("highlight"));
    }

    function highlightCurrent() {
        clearHighlights();
        const current = BOXES[guidedIndex];
        if (!current) return;
        boxEl(current.id)?.classList.add("highlight");
    }

    // -----------------------------
    // Modal logic
    // -----------------------------
    let activeBoxId = null;

    function openModalFor(boxId) {
        activeBoxId = boxId;
        const box = BOXES.find(b => b.id === boxId);
        if (!box) return;

        modalTitle.textContent = box.title;
        modalQuestion.textContent = box.question;

        const suggestion = suggestionFor(boxId);
        modalSuggestion.textContent = suggestion || "—";

        // Prepare field types
        if (box.type === "checks") {
            modalChecksWrap.hidden = false;
            modalFieldWrap.hidden = true;

            const current = bmc.boxes[boxId];
            const currentArr = Array.isArray(current) ? current : [];

            modalChecksWrap.innerHTML = box.options.map(opt => {
                const checked = currentArr.includes(opt) ? "checked" : "";
                return `
                    <div class="check-item">
                        <input type="checkbox" id="chk_${cssSafe(opt)}" value="${escapeHtml(opt)}" ${checked} />
                        <label for="chk_${cssSafe(opt)}">${escapeHtml(opt)}</label>
                    </div>
                `;
            }).join("");
        } else {
            modalChecksWrap.hidden = true;
            modalFieldWrap.hidden = false;

            const current = bmc.boxes[boxId];
            modalInput.value = typeof current === "string" ? current : "";
        }

        modalBackdrop.classList.add("show");
        modal.showModal();
        announce(`Editing ${box.title}.`);
    }

    function closeModal() {
        modal.close();
        modalBackdrop.classList.remove("show");
        activeBoxId = null;
    }

    useSuggestionBtn.addEventListener("click", () => {
        if (!activeBoxId) return;
        const box = BOXES.find(b => b.id === activeBoxId);
        const suggestion = suggestionFor(activeBoxId);

        if (box && box.type === "checks") {
            // Try to auto-check options that appear in suggestion
            const checks = Array.from(modalChecksWrap.querySelectorAll("input[type='checkbox']"));
            checks.forEach(chk => {
                const v = chk.value;
                chk.checked = suggestion.toLowerCase().includes(v.toLowerCase());
            });
        } else {
            modalInput.value = suggestion;
        }
    });

    saveBtn.addEventListener("click", () => {
        if (!activeBoxId) return;
        const box = BOXES.find(b => b.id === activeBoxId);
        if (!box) return;

        if (box.type === "checks") {
            const selected = Array.from(modalChecksWrap.querySelectorAll("input[type='checkbox']"))
                .filter(i => i.checked)
                .map(i => i.value);

            bmc.boxes[activeBoxId] = selected;
        } else {
            bmc.boxes[activeBoxId] = modalInput.value.trim();
        }

        saveBMC();
        renderCanvas();

        // Guided step: move next
        if (guidedActive && !editMode) {
            guidedIndex = Math.min(guidedIndex + 1, BOXES.length);
        }

        closeModal();

        if (guidedActive && !editMode) {
            if (guidedIndex >= BOXES.length) {
                // done with 9 boxes -> name business
                openNameModal();
            } else {
                highlightCurrent();
                openModalFor(BOXES[guidedIndex].id);
            }
        }
    });

    cancelBtn.addEventListener("click", () => closeModal());
    modalBackdrop.addEventListener("click", () => closeModal());

    // Click boxes to edit anytime
    document.getElementById("bmc").addEventListener("click", (e) => {
        const target = e.target.closest(".box");
        if (!target) return;

        const id = target.getAttribute("data-box");
        if (!id) return;

        // If guided is active and we’re not in editMode, only allow current box
        if (guidedActive && !editMode) {
            const current = BOXES[guidedIndex]?.id;
            if (id !== current) return;
        }

        openModalFor(id);
    });

    // -----------------------------
    // Name business + badge + confetti
    // -----------------------------
    function openNameModal() {
        bizNameInput.value = bmc.businessName || "";
        userNameInput.value = bmc.userName || "";

        modalBackdrop.classList.add("show");
        nameModal.showModal();
        announce("Name your business to finish.");
    }

    function closeNameModal() {
        nameModal.close();
        modalBackdrop.classList.remove("show");
    }

    finishBtn.addEventListener("click", () => {
        const biz = (bizNameInput.value || "").trim();
        const user = (userNameInput.value || "").trim();

        if (!biz) {
            announce("Please enter a business name.");
            bizNameInput.focus();
            return;
        }

        bmc.businessName = biz;
        bmc.userName = user || bmc.userName || "—";
        saveBMC();

        setTopNames();
        updateProgress();
        closeNameModal();

        unlockBadge();
        runConfetti();
        announce("Congratulations! Canvas completed and badge unlocked.");
    });

    nameCancelBtn.addEventListener("click", () => closeNameModal());

    function unlockBadge() {
        const raw = localStorage.getItem(KEY_BADGES);
        const badges = safeParseJSON(raw || "[]", []);
        if (!badges.includes("im_an_agripreneur")) badges.push("im_an_agripreneur");
        localStorage.setItem(KEY_BADGES, JSON.stringify(badges));

        // also store to a simple profile object
        const profileRaw = localStorage.getItem(KEY_PROFILE);
        const profile = safeParseJSON(profileRaw || "{}", {});
        profile.badges = badges;
        profile.lastCompleted = new Date().toISOString();
        localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
    }

    // -----------------------------
    // Confetti (no external library, offline)
    // -----------------------------
    function runConfetti() {
        const canvas = confetti;
        const ctx = canvas.getContext("2d");
        confetti.classList.add("show");

        const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const colors = ["#5eead4", "#2dd4bf", "#34d399", "#e9fffb", "#0f766e"];
        const pieces = Array.from({ length: 140 }, () => ({
            x: Math.random() * W,
            y: -20 - Math.random() * H,
            r: 3 + Math.random() * 6,
            vx: -1.8 + Math.random() * 3.6,
            vy: 2.5 + Math.random() * 4.2,
            rot: Math.random() * Math.PI,
            vr: -0.12 + Math.random() * 0.24,
            c: colors[Math.floor(Math.random() * colors.length)]
        }));

        const start = performance.now();
        const duration = 2200;

        function tick(t) {
            const elapsed = t - start;
            ctx.clearRect(0, 0, W, H);

            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                ctx.restore();
            });

            if (elapsed < duration) {
                requestAnimationFrame(tick);
            } else {
                confetti.classList.remove("show");
                ctx.clearRect(0, 0, W, H);
            }
        }

        requestAnimationFrame(tick);
    }

    // -----------------------------
    // Guided build controls
    // -----------------------------
    function startGuided() {
        guidedActive = true;
        editMode = false;
        guidedIndex = 0;

        showScreen(screenCanvas);
        renderCanvas();
        highlightCurrent();
        openModalFor(BOXES[guidedIndex].id);
    }

    function continueGuided() {
        guidedActive = true;
        editMode = false;

        // find first empty box if any
        const firstEmpty = BOXES.findIndex(b => {
            const v = bmc.boxes[b.id];
            if (Array.isArray(v)) return v.length === 0;
            return !v || !String(v).trim();
        });

        guidedIndex = firstEmpty >= 0 ? firstEmpty : BOXES.length;

        showScreen(screenCanvas);
        renderCanvas();

        if (guidedIndex >= BOXES.length) {
            openNameModal();
            return;
        }

        highlightCurrent();
        openModalFor(BOXES[guidedIndex].id);
    }

    function enableEditMode() {
        guidedActive = true;   // still allow editing
        editMode = true;
        clearHighlights();
        announce("Edit mode enabled. Click any box to edit.");
    }

    // -----------------------------
    // Download PDF (print)
    // -----------------------------
    function buildPrintGrid() {
        const order = [
            { id: "partners", area: "partners" },
            { id: "activities", area: "activities" },
            { id: "value", area: "value" },
            { id: "relationships", area: "relationships" },
            { id: "segments", area: "segments" },
            { id: "resources", area: "resources" },
            { id: "channels", area: "channels" },
            { id: "costs", area: "costs" },
            { id: "revenue", area: "revenue" }
        ];

        const areaClass = (area) => `print-box area-${area}`;

        printGrid.innerHTML = order.map(o => {
            const box = BOXES.find(b => b.id === o.id);
            const title = box ? box.title : o.id.toUpperCase();
            const body = formatBoxValue(bmc.boxes[o.id]).trim();

            return `
                <div class="print-box" style="grid-area:${o.area};">
                    <div class="print-title">${escapeHtml(title)}</div>
                    <div class="print-body">${escapeHtml(body || "—")}</div>
                </div>
            `;
        }).join("");
    }

    function downloadPDF() {
        if (countFilled() < 9 || !bmc.businessName) {
            announce("Complete all boxes and add a business name before downloading.");
            return;
        }

        printBizName.textContent = bmc.businessName;
        printUserName.textContent = bmc.userName || "—";
        printDate.textContent = new Date().toLocaleDateString();

        buildPrintGrid();
        window.print();
    }

    // -----------------------------
    // Tiny helpers for safety
    // -----------------------------
    function escapeHtml(str) {
        return String(str || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function cssSafe(str) {
        return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "_");
    }

    // -----------------------------
    // Events
    // -----------------------------
    startBtn.addEventListener("click", startGuided);
    startBtn2.addEventListener("click", startGuided);
    continueGuidedBtn.addEventListener("click", continueGuided);
    editModeBtn.addEventListener("click", enableEditMode);

    downloadBtn.addEventListener("click", downloadPDF);

    loadBtn.addEventListener("click", () => {
        const ok = loadSavedBMC();
        showScreen(screenCanvas);
        renderCanvas();
        announce(ok ? "Saved canvas loaded." : "No saved canvas found. Start building.");
    });

    resetAllBtn.addEventListener("click", () => {
        resetBMC();
        showScreen(screenIntro);
        announce("Canvas reset.");
    });

    // Initial load
    loadSavedBMC();
    renderCanvas();
    showScreen(screenIntro);
    updateProgress();
})();
