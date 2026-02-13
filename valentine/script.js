(() => {
  const state = {
    noCount: 0,
    maxTease: 3,
    phase: "intro",
    chaseMoves: 0,
  };

  const INTRO_LINE = "booting romance engine...";
  const DEFAULT_SUBLINE = "Choose wisely. The UI is emotionally persuasive.";

  const teaseLines = [
    "Bold choice. Let's try that again 😇",
    "The 'No' button is feeling unromantic today.",
    "Achievement progress: 3...2...1... 💘",
  ];
  const teaseImages = ["assets/tease1.png", "assets/tease2.png", "assets/tease3.png"];

  const chaseSublines = [
    "Interesting.",
    "Are you sure?",
    "That button is getting shy...",
    "Okay, now you're just speedrunning.",
  ];

  const heartColors = ["#ff4f73", "#ff87a3", "#ffd166", "#ff6b8f", "#ffcf9d"];
  const sadSymbols = ["😢", "😭", "🥺", "☹️", "💔"];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const introView = document.getElementById("introView");
  const askView = document.getElementById("askView");
  const successView = document.getElementById("successView");
  const introText = document.getElementById("introText");
  const subline = document.getElementById("subline");

  const btnArea = document.getElementById("btnArea");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const replayBtn = document.getElementById("replayBtn");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const teaseImg = document.getElementById("teaseImg");
  const teaseText = document.getElementById("teaseText");
  const askAgainBtn = document.getElementById("askAgainBtn");

  const finePrintLink = document.getElementById("finePrintLink");
  const finePrintPanel = document.getElementById("finePrintPanel");
  const achievementToast = document.getElementById("achievementToast");

  const heartTemplate = document.getElementById("heartTemplate");

  if (
    !introView ||
    !askView ||
    !successView ||
    !introText ||
    !subline ||
    !btnArea ||
    !yesBtn ||
    !noBtn ||
    !replayBtn ||
    !modalBackdrop ||
    !teaseImg ||
    !teaseText ||
    !askAgainBtn ||
    !finePrintLink ||
    !finePrintPanel ||
    !achievementToast ||
    !heartTemplate
  ) {
    return;
  }

  let introIntervalId = null;
  let introTimeoutId = null;
  let toastTimeoutId = null;
  let sparkleTimeoutId = null;
  let yesHoverBurstTimestamp = 0;
  let noHoverBurstTimestamp = 0;

  teaseImages.forEach((src) => {
    const preloadImage = new Image();
    preloadImage.src = src;
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clearIntroTimers() {
    if (introIntervalId) {
      clearInterval(introIntervalId);
      introIntervalId = null;
    }

    if (introTimeoutId) {
      clearTimeout(introTimeoutId);
      introTimeoutId = null;
    }
  }

  function runIntro() {
    clearIntroTimers();
    state.phase = "intro";

    introView.classList.remove("is-hidden");
    askView.classList.add("is-hidden");
    successView.classList.add("is-hidden");
    modalBackdrop.classList.add("is-hidden");

    introText.textContent = "";

    if (prefersReducedMotion.matches) {
      introText.textContent = INTRO_LINE;
      introTimeoutId = setTimeout(showAskView, 280);
      return;
    }

    let index = 0;
    introIntervalId = setInterval(() => {
      index += 1;
      introText.textContent = INTRO_LINE.slice(0, index);

      if (index >= INTRO_LINE.length) {
        clearIntroTimers();
        introTimeoutId = setTimeout(showAskView, 520);
      }
    }, 45);

    introTimeoutId = setTimeout(showAskView, 4200);
  }

  function showAskView() {
    clearIntroTimers();
    introView.classList.add("is-hidden");
    askView.classList.remove("is-hidden");
    successView.classList.add("is-hidden");
    state.phase = "ask";
    noBtn.focus({ preventScroll: true });
  }

  function showAchievementToast() {
    achievementToast.classList.add("show");

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    toastTimeoutId = setTimeout(() => {
      achievementToast.classList.remove("show");
    }, 4200);
  }

  function applyYesPower() {
    const scale = Math.min(1 + state.noCount * 0.09, 1.85);
    yesBtn.style.setProperty("--yes-scale", scale.toFixed(2));

    yesBtn.classList.remove("powered");
    void yesBtn.offsetWidth;
    yesBtn.classList.add("powered");

    if (sparkleTimeoutId) {
      clearTimeout(sparkleTimeoutId);
    }

    sparkleTimeoutId = setTimeout(() => {
      yesBtn.classList.remove("powered");
    }, 250);
  }

  function applyNoPenalty() {
    const scale = Math.max(1 - state.noCount * 0.08, 0.42);
    noBtn.style.setProperty("--no-scale", scale.toFixed(2));
  }

  function toggleFinePrint() {
    const isOpen = finePrintPanel.classList.toggle("is-open");
    finePrintLink.setAttribute("aria-expanded", String(isOpen));
    finePrintPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  function showTeaseModal() {
    const teaseIndex = clamp(state.noCount - 1, 0, teaseLines.length - 1);
    teaseImg.src = teaseImages[teaseIndex] || teaseImages[0];
    teaseImg.alt = `Playful teasing image ${teaseIndex + 1}`;
    teaseText.textContent = teaseLines[teaseIndex];
    modalBackdrop.classList.remove("is-hidden");
    state.phase = "tease";
    askAgainBtn.focus({ preventScroll: true });
  }

  function hideTeaseModal() {
    modalBackdrop.classList.add("is-hidden");
    state.phase = "ask";
    noBtn.focus({ preventScroll: true });
  }

  function updateChaseSubline() {
    const line = chaseSublines[(state.chaseMoves - 1) % chaseSublines.length];
    subline.textContent = line;
  }

  function moveNoRandomly() {
    const areaRect = btnArea.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();

    const yesCenter = {
      x: yesRect.left + yesRect.width / 2 - areaRect.left,
      y: yesRect.top + yesRect.height / 2 - areaRect.top,
    };

    const leftBound = Math.max(0, areaRect.width - noRect.width);
    const topBound = Math.max(0, areaRect.height - noRect.height);
    const minDistance = Math.max(42, yesRect.width * 0.4 - state.noCount * 3);

    let nextLeft = 0;
    let nextTop = 0;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidateLeft = Math.random() * leftBound;
      const candidateTop = Math.random() * topBound;
      const candidateCenterX = candidateLeft + noRect.width / 2;
      const candidateCenterY = candidateTop + noRect.height / 2;
      const distanceToYes = Math.hypot(candidateCenterX - yesCenter.x, candidateCenterY - yesCenter.y);

      nextLeft = candidateLeft;
      nextTop = candidateTop;

      if (distanceToYes >= minDistance) {
        break;
      }
    }

    noBtn.style.left = `${nextLeft.toFixed(1)}px`;
    noBtn.style.top = `${nextTop.toFixed(1)}px`;

    if (state.chaseMoves >= 3) {
      noBtn.classList.add("behind");
    }
  }

  function clampNoToBounds() {
    const currentLeft = Number.parseFloat(noBtn.style.left);
    const currentTop = Number.parseFloat(noBtn.style.top);

    if (Number.isNaN(currentLeft) || Number.isNaN(currentTop)) {
      return;
    }

    const areaRect = btnArea.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();

    const nextLeft = clamp(currentLeft, 0, areaRect.width - noRect.width);
    const nextTop = clamp(currentTop, 0, areaRect.height - noRect.height);

    noBtn.style.left = `${nextLeft}px`;
    noBtn.style.top = `${nextTop}px`;
  }

  function burstParticles(x, y, count, extraLift = 0, symbols = ["❤"]) {
    const budget = prefersReducedMotion.matches ? Math.max(4, Math.round(count / 3)) : count;

    for (let i = 0; i < budget; i += 1) {
      const particle = heartTemplate.content.firstElementChild.cloneNode(true);
      const angle = Math.random() * Math.PI * 2;
      const distance = prefersReducedMotion.matches
        ? 42 + Math.random() * 44
        : 86 + Math.random() * 148;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - (36 + Math.random() * 80 + extraLift);
      const duration = prefersReducedMotion.matches
        ? 520 + Math.random() * 260
        : 1400 + Math.random() * 900;
      const size = prefersReducedMotion.matches ? 16 + Math.random() * 10 : 22 + Math.random() * 24;
      const rotation = `${Math.round(Math.random() * 120 - 60)}deg`;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      particle.textContent = symbol;
      particle.style.setProperty("--x", `${x}px`);
      particle.style.setProperty("--y", `${y}px`);
      particle.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      particle.style.setProperty("--dy", `${dy.toFixed(1)}px`);
      particle.style.setProperty("--duration", `${duration.toFixed(0)}ms`);
      particle.style.setProperty("--size", `${size.toFixed(0)}px`);
      particle.style.setProperty("--rot", rotation);

      if (symbol === "❤") {
        particle.style.setProperty(
          "--heart-color",
          heartColors[Math.floor(Math.random() * heartColors.length)],
        );
      } else {
        particle.style.removeProperty("--heart-color");
      }

      document.body.appendChild(particle);

      particle.addEventListener(
        "animationend",
        () => {
          particle.remove();
        },
        { once: true },
      );

      setTimeout(() => {
        particle.remove();
      }, duration + 120);
    }
  }

  function burstFromElement(element, count, extraLift = 0, symbols = ["❤"]) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    burstParticles(x, y, count, extraLift, symbols);
  }

  function handleNoClick() {
    if (state.phase !== "ask") {
      return;
    }

    if (state.noCount < state.maxTease) {
      state.noCount += 1;
      applyYesPower();
      applyNoPenalty();
      moveNoRandomly();

      if (state.noCount === state.maxTease) {
        showAchievementToast();
      }

      showTeaseModal();
      return;
    }

    state.noCount += 1;
    state.chaseMoves += 1;

    applyYesPower();
    applyNoPenalty();
    updateChaseSubline();
    moveNoRandomly();
  }

  function transitionToSuccess() {
    state.phase = "success";
    askView.classList.add("is-hidden");
    modalBackdrop.classList.add("is-hidden");
    successView.classList.remove("is-hidden");

    burstParticles(window.innerWidth * 0.5, window.innerHeight * 0.45, 40, 70, ["❤"]);
    replayBtn.focus({ preventScroll: true });
  }

  function resetState() {
    state.noCount = 0;
    state.chaseMoves = 0;
    state.phase = "intro";

    subline.textContent = DEFAULT_SUBLINE;
    finePrintLink.setAttribute("aria-expanded", "false");
    finePrintPanel.classList.remove("is-open");
    finePrintPanel.setAttribute("aria-hidden", "true");

    noBtn.classList.remove("behind");
    noBtn.style.left = "";
    noBtn.style.top = "";
    noBtn.style.setProperty("--no-scale", "1");

    yesBtn.style.setProperty("--yes-scale", "1");
    yesBtn.classList.remove("powered");

    achievementToast.classList.remove("show");
    modalBackdrop.classList.add("is-hidden");
  }

  yesBtn.addEventListener("mouseenter", () => {
    const now = Date.now();
    if (now - yesHoverBurstTimestamp < 220) {
      return;
    }

    yesHoverBurstTimestamp = now;
    burstFromElement(yesBtn, 12, 20);
  });

  yesBtn.addEventListener(
    "touchstart",
    () => {
      burstFromElement(yesBtn, 10, 18);
    },
    { passive: true },
  );

  yesBtn.addEventListener("click", () => {
    if (state.phase !== "ask") {
      return;
    }

    burstFromElement(yesBtn, 24, 60);
    transitionToSuccess();
  });

  noBtn.addEventListener("mouseenter", () => {
    if (state.phase !== "ask") {
      return;
    }

    const now = Date.now();
    if (now - noHoverBurstTimestamp < 220) {
      return;
    }

    noHoverBurstTimestamp = now;
    burstFromElement(noBtn, 12, 14, sadSymbols);
  });

  noBtn.addEventListener(
    "touchstart",
    () => {
      if (state.phase !== "ask") {
        return;
      }

      burstFromElement(noBtn, 10, 10, sadSymbols);
    },
    { passive: true },
  );

  noBtn.addEventListener("click", handleNoClick);
  askAgainBtn.addEventListener("click", hideTeaseModal);

  finePrintLink.addEventListener("click", toggleFinePrint);

  replayBtn.addEventListener("click", () => {
    resetState();
    runIntro();
  });

  window.addEventListener("resize", clampNoToBounds);

  runIntro();
})();
