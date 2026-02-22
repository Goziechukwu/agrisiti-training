(() => {
    "use strict";

    // =========================
    // Data (10 statements)
    // =========================
    const ITEMS = [
        {
            text: "Checks market prices before planting",
            correct: "AGRIPRENEUR",
            explain: "Agripreneurs research before they plant"
        },
        {
            text: "Plants the same crop every year without checking demand",
            correct: "FARMER",
            explain: "Agripreneurs check what customers want first"
        },
        {
            text: "Writes down all expenses in a notebook",
            correct: "AGRIPRENEUR",
            explain: "Tracking costs is key to knowing your profit"
        },
        {
            text: "Sells to whoever shows up at the farm",
            correct: "FARMER",
            explain: "Agripreneurs find customers before harvesting"
        },
        {
            text: "Calculates expected profit before starting",
            correct: "AGRIPRENEUR",
            explain: "Planning for profit is business thinking"
        },
        {
            text: "Hopes for a good price at harvest time",
            correct: "FARMER",
            explain: "Agripreneurs know their price in advance"
        },
        {
            text: "Tries new methods to improve production",
            correct: "AGRIPRENEUR",
            explain: "Agripreneurs always learn and improve"
        },
        {
            text: "Does farming the same way as parents did",
            correct: "FARMER",
            explain: "Learning new methods helps you grow"
        },
        {
            text: "Has a list of customers ready before planting",
            correct: "AGRIPRENEUR",
            explain: "Know your buyers before you grow"
        },
        {
            text: "Thinks of the farm as a business",
            correct: "AGRIPRENEUR",
            explain: "This is the agripreneur mindset!"
        }
    ];

    const RESULT_MESSAGES = [
        { min: 10, max: 10, msg: "Amazing! You already think like an agripreneur!" },
        { min: 7, max: 9, msg: "Great job! You're well on your way to agripreneur thinking!" },
        { min: 4, max: 6, msg: "Good start! Keep learning and your mindset will transform!" },
        { min: 0, max: 3, msg: "Don't worry! This module will help you think like an agripreneur. Try again!" }
    ];

    // =========================
    // Elements
    // =========================
    const screenIntro = document.getElementById("screenIntro");
    const screenQuiz = document.getElementById("screenQuiz");
    const screenResults = document.getElementById("screenResults");

    const startBtn = document.getElementById("startBtn");
    const tryAgainBtn = document.getElementById("tryAgainBtn");

    const soundToggle = document.getElementById("soundToggle");
    const srLive = document.getElementById("srLive");

    const statementText = document.getElementById("statementText");
    const btnFarmer = document.getElementById("btnFarmer");
    const btnAgripreneur = document.getElementById("btnAgripreneur");

    const feedback = document.getElementById("feedback");
    const feedbackIcon = document.getElementById("feedbackIcon");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const feedbackExplain = document.getElementById("feedbackExplain");

    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const scoreValue = document.getElementById("scoreValue");

    const finalScore = document.getElementById("finalScore");
    const resultsMessage = document.getElementById("resultsMessage");

    // =========================
    // State
    // =========================
    let index = 0;
    let score = 0;
    let locked = false;
    let autoNextTimer = null;

    // =========================
    // Helpers
    // =========================
    function showScreen(which) {
        screenIntro.classList.remove("is-active");
        screenQuiz.classList.remove("is-active");
        screenResults.classList.remove("is-active");
        which.classList.add("is-active");
    }

    function setProgress(currentIndex) {
        const total = ITEMS.length;
        const answered = Math.min(currentIndex, total);
        const percent = (answered / total) * 100;

        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${answered}/${total}`;

        const bar = document.querySelector(".progress-bar");
        if (bar) bar.setAttribute("aria-valuenow", String(answered));
    }

    function setScore(value) {
        scoreValue.textContent = String(value);
    }

    function announce(text) {
        // Helps screen readers
        srLive.textContent = text;
    }

    function setButtonsEnabled(enabled) {
        btnFarmer.disabled = !enabled;
        btnAgripreneur.disabled = !enabled;
    }

    function clearAutoNext() {
        if (autoNextTimer) {
            clearTimeout(autoNextTimer);
            autoNextTimer = null;
        }
    }

    // Simple sound without external files (works offline)
    function playTone(type) {
        if (!soundToggle.checked) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.value = type === "good" ? 880 : 220;

            gain.gain.value = 0.04;

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();

            setTimeout(() => {
                osc.stop();
                ctx.close().catch(() => {});
            }, 140);
        } catch (e) {
            // If audio is blocked, fail silently
        }
    }

    // =========================
    // Quiz Logic
    // =========================
    function startQuiz() {
        index = 0;
        score = 0;
        locked = false;

        setScore(score);
        setProgress(0);
        hideFeedback();

        showScreen(screenQuiz);
        renderItem();
    }

    function renderItem() {
        clearAutoNext();
        hideFeedback();
        locked = false;
        setButtonsEnabled(true);

        const item = ITEMS[index];
        statementText.textContent = item.text;

        // Move focus to the statement for accessibility
        statementText.focus();

        announce(`Statement ${index + 1} of ${ITEMS.length}.`);
    }

    function hideFeedback() {
        feedback.classList.remove("show", "good", "bad");
        feedbackIcon.textContent = "";
        feedbackTitle.textContent = "";
        feedbackExplain.textContent = "";
    }

    function showFeedback(isCorrect, explain, correctLabel) {
        feedback.classList.add("show");
        feedback.classList.toggle("good", isCorrect);
        feedback.classList.toggle("bad", !isCorrect);

        feedbackIcon.textContent = isCorrect ? "✓" : "✕";
        feedbackTitle.textContent = isCorrect ? "Correct!" : "Not quite";
        feedbackExplain.textContent = !isCorrect
            ? `${explain} (Correct: ${correctLabel})`
            : explain;
    }

    function handleChoice(choice) {
        if (locked) return;
        locked = true;
        setButtonsEnabled(false);

        const item = ITEMS[index];
        const isCorrect = choice === item.correct;

        if (isCorrect) score += 1;
        setScore(score);

        showFeedback(isCorrect, item.explain, item.correct);
        announce(isCorrect ? "Correct." : `Not quite. Correct answer is ${item.correct}.`);
        playTone(isCorrect ? "good" : "bad");

        // Mark this as answered for progress indicator:
        setProgress(index + 1);

        // Auto-advance after 2 seconds
        autoNextTimer = setTimeout(() => {
            index += 1;
            if (index < ITEMS.length) {
                renderItem();
            } else {
                finishQuiz();
            }
        }, 2000);
    }

    function finishQuiz() {
        clearAutoNext();
        showScreen(screenResults);

        finalScore.textContent = `${score}/${ITEMS.length}`;
        resultsMessage.textContent = pickResultMessage(score);

        announce(`Quiz finished. Your score is ${score} out of ${ITEMS.length}.`);
    }

    function pickResultMessage(s) {
        const hit = RESULT_MESSAGES.find(r => s >= r.min && s <= r.max);
        return hit ? hit.msg : "Nice work!";
    }

    // =========================
    // Events
    // =========================
    startBtn.addEventListener("click", startQuiz);
    tryAgainBtn.addEventListener("click", () => {
        showScreen(screenIntro);
        announce("Intro screen. Ready to start again.");
    });

    btnFarmer.addEventListener("click", () => handleChoice("FARMER"));
    btnAgripreneur.addEventListener("click", () => handleChoice("AGRIPRENEUR"));

    // Keyboard support: F = Farmer, A = Agripreneur
    document.addEventListener("keydown", (e) => {
        if (!screenQuiz.classList.contains("is-active")) return;
        if (locked) return;

        const key = e.key.toLowerCase();
        if (key === "f") handleChoice("FARMER");
        if (key === "a") handleChoice("AGRIPRENEUR");
    });

    // Default view
    showScreen(screenIntro);
    setProgress(0);
    setScore(0);
})();
