(() => {
    "use strict";

    // -----------------------------
    // Data
    // -----------------------------
    const COSTS = {
        rice: {
            label: "Rice Farming Costs",
            items: [
                { name: "Land preparation", value: 30000 },
                { name: "Seeds", value: 15000 },
                { name: "Fertilizer", value: 24000 },
                { name: "Herbicides/Pesticides", value: 12000 },
                { name: "Labor - Planting", value: 20000 },
                { name: "Labor - Weeding", value: 30000 },
                { name: "Labor - Harvesting", value: 25000 },
                { name: "Threshing", value: 15000 },
                { name: "Drying", value: 10000 },
                { name: "Transport", value: 12000 },
                { name: "Bags/Packaging", value: 6000 },
                { name: "Phone calls/Marketing", value: 3000 }
            ]
        },
        fish: {
            label: "Fish Farming Costs",
            items: [
                { name: "Pond construction/renovation", value: 50000 },
                { name: "Pond preparation", value: 15000 },
                { name: "Fingerlings (500 pieces)", value: 25000 },
                { name: "Feed - Starter (Month 1)", value: 40000 },
                { name: "Feed - Grower (Months 2-3)", value: 80000 },
                { name: "Feed - Finisher (Month 4)", value: 60000 },
                { name: "Medicine/Treatment", value: 8000 },
                { name: "Water pump/Electricity", value: 15000 },
                { name: "Labor - Feeding", value: 20000 },
                { name: "Labor - Harvesting", value: 15000 },
                { name: "Transport", value: 10000 },
                { name: "Phone calls/Marketing", value: 3000 }
            ]
        }
    };

    // -----------------------------
    // Elements
    // -----------------------------
    const screenIntro = document.getElementById("screenIntro");
    const screenSelect = document.getElementById("screenSelect");
    const screenCalc = document.getElementById("screenCalc");

    const riceBtn = document.getElementById("riceBtn");
    const fishBtn = document.getElementById("fishBtn");

    const resetBtn = document.getElementById("resetBtn");
    const calcBtn = document.getElementById("calcBtn");

    const versionLabel = document.getElementById("versionLabel");
    const costGrid = document.getElementById("costGrid");

    const totalValue = document.getElementById("totalValue");
    const soundToggle = document.getElementById("soundToggle");
    const srLive = document.getElementById("srLive");

    const priceInput = document.getElementById("priceInput");
    const runCalcBtn = document.getElementById("runCalcBtn");

    const resultTitle = document.getElementById("resultTitle");
    const resultText = document.getElementById("resultText");
    const barFill = document.getElementById("barFill");
    const barMarker = document.getElementById("barMarker");

    const tryNumbersBtn = document.getElementById("tryNumbersBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    // print fields
    const printArea = document.getElementById("printArea");
    const printVersion = document.getElementById("printVersion");
    const printTotal = document.getElementById("printTotal");
    const printPrice = document.getElementById("printPrice");
    const printUnits = document.getElementById("printUnits");
    const printList = document.getElementById("printList");

    // -----------------------------
    // State
    // -----------------------------
    let mode = null; // "rice" | "fish"
    let selected = new Set(); // indexes
    let total = 0;
    let lastPrice = 0;
    let lastUnits = 0;

    // -----------------------------
    // Helpers
    // -----------------------------
    function showScreen(which) {
        screenIntro.classList.remove("is-active");
        screenSelect.classList.remove("is-active");
        screenCalc.classList.remove("is-active");
        which.classList.add("is-active");
    }

    function announce(text) {
        srLive.textContent = text;
    }

    function formatNaira(amount) {
        const n = Number(amount) || 0;
        return "₦" + n.toLocaleString("en-NG");
    }

    function parseNumber(input) {
        if (!input) return 0;
        const cleaned = String(input).replace(/[^\d.]/g, "");
        const val = Number(cleaned);
        return Number.isFinite(val) ? val : 0;
    }

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
        } catch (e) {}
    }

    function recalcTotal() {
        total = 0;
        localStorage.setItem("agrisiti_costs_mode", mode);
        localStorage.setItem("agrisiti_costs_total", String(total));
        localStorage.setItem("agrisiti_costs_selected", JSON.stringify(Array.from(selected)));
        const items = COSTS[mode].items;

        selected.forEach(i => {
            total += items[i].value;
        });

        totalValue.textContent = formatNaira(total);
    }

    function render(modeKey) {
        mode = modeKey;
        selected = new Set();
        total = 0;
        lastPrice = 0;
        lastUnits = 0;

        versionLabel.textContent = COSTS[mode].label;
        totalValue.textContent = formatNaira(0);

        costGrid.innerHTML = COSTS[mode].items.map((it, idx) => `
            <div class="cost-card" role="button" tabindex="0" data-index="${idx}" aria-pressed="false">
                <div class="check" aria-hidden="true">✓</div>
                <div class="cost-name">${it.name}</div>
                <div class="cost-amt">${formatNaira(it.value)}</div>
            </div>
        `).join("");

        bindCostCards();
        resetCalcUI();

        showScreen(screenSelect);
        announce(`${COSTS[mode].label} loaded. Select costs to build your total.`);
    }

    function resetCalcUI() {
        priceInput.value = "";
        resultTitle.textContent = "Ready when you are.";
        resultText.textContent = "Enter your selling price to see the break-even units.";
        barFill.style.width = "0%";
        barMarker.style.left = "0%";
        barMarker.style.opacity = "0";
    }

    function bindCostCards() {
        const cards = Array.from(document.querySelectorAll(".cost-card"));

        function toggleCard(card) {
            const idx = Number(card.getAttribute("data-index"));
            const isSelected = selected.has(idx);

            if (isSelected) {
                selected.delete(idx);
                card.classList.remove("selected");
                card.setAttribute("aria-pressed", "false");
                playTone("bad");
            } else {
                selected.add(idx);
                card.classList.add("selected");
                card.setAttribute("aria-pressed", "true");
                playTone("good");
            }

            recalcTotal();
        }

        cards.forEach(card => {
            card.addEventListener("click", () => toggleCard(card));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCard(card);
                }
            });
        });
    }

    function goToCalc() {
        showScreen(screenCalc);
        announce("Break-even calculator screen. Enter selling price per unit.");
        priceInput.focus();
    }

    function computeBreakEven() {
        const price = parseNumber(priceInput.value);

        if (total <= 0) {
            resultTitle.textContent = "Select some costs first.";
            resultText.textContent = "Your total costs are ₦0. Go back and select at least one cost item.";
            playTone("bad");
            return;
        }

        if (price <= 0) {
            resultTitle.textContent = "Enter a selling price.";
            resultText.textContent = "Selling price must be greater than ₦0.";
            playTone("bad");
            return;
        }

        const units = Math.ceil(total / price);

        lastPrice = price;
        lastUnits = units;

        localStorage.setItem("agrisiti_sell_price", String(lastPrice));
        localStorage.setItem("agrisiti_break_even_units", String(lastUnits));

        resultTitle.textContent = `Break-even: ${units.toLocaleString("en-NG")} units`;
        resultText.textContent = `You must sell at least ${units.toLocaleString("en-NG")} units to break even. After that, it's PROFIT!`;

        // Visual bar:
        // We show a simple scale where break-even is at 55% of the bar.
        // Left = "Costs", Right = "Profit zone".
        const markerPos = 55;
        barFill.style.width = `${markerPos}%`;
        barMarker.style.left = `${markerPos}%`;
        barMarker.style.opacity = "1";

        playTone("good");
        announce(`You must sell at least ${units} units to break even.`);
    }

    const continueBtn = document.getElementById("continueBtn");
    if (continueBtn) continueBtn.style.display = "inline-flex";


    function tryDifferentNumbers() {
        resetCalcUI();
        announce("You can try a new selling price.");
        priceInput.focus();
    }

    function downloadSummary() {
        // Build printable content
        printVersion.textContent = COSTS[mode].label;
        printTotal.textContent = formatNaira(total);
        printPrice.textContent = formatNaira(lastPrice || parseNumber(priceInput.value));
        printUnits.textContent = (lastUnits ? lastUnits.toLocaleString("en-NG") : "—");

        printList.innerHTML = "";
        const items = COSTS[mode].items;

        const selectedItems = Array.from(selected).sort((a, b) => a - b).map(i => items[i]);
        selectedItems.forEach(it => {
            const li = document.createElement("li");
            li.textContent = `${it.name} — ${formatNaira(it.value)}`;
            printList.appendChild(li);
        });

        // Trigger browser print dialog (user can "Save as PDF")
        window.print();
    }

    // -----------------------------
    // Events
    // -----------------------------
    riceBtn.addEventListener("click", () => render("rice"));
    fishBtn.addEventListener("click", () => render("fish"));

    resetBtn.addEventListener("click", () => {
        if (!mode) return;
        render(mode);
    });

    calcBtn.addEventListener("click", goToCalc);

    runCalcBtn.addEventListener("click", computeBreakEven);

    // Calculate on Enter
    priceInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") computeBreakEven();
    });

    // gentle formatting on blur
    priceInput.addEventListener("blur", () => {
        const price = parseNumber(priceInput.value);
        if (price > 0) priceInput.value = price.toLocaleString("en-NG");
    });

    // and unformat while editing
    priceInput.addEventListener("focus", () => {
        const price = parseNumber(priceInput.value);
        priceInput.value = price ? String(price) : "";
    });

    tryNumbersBtn.addEventListener("click", tryDifferentNumbers);
    downloadBtn.addEventListener("click", () => {
        // Make sure calculation exists; if not, compute once
        if (!lastUnits) computeBreakEven();
        downloadSummary();
    });

    // Default
    showScreen(screenIntro);
})();
