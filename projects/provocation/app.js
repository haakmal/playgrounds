(() => {
  const INTRO_ENABLED = true;
  const INTRO_COPY = {
    //eyebrow: "A SPACE FOR POSSIBILITY",
    eyebrow: "",
    title: "Welcome to the",
    emphasis: "Possibility Engine",
    //description: "Small shifts in perspective\\nfor making new things possible",
    description: "",
  };
  const INTRO_TIMING = { glyphsAppear: 1200, textOut: 3000, accelerate: 50, exit: 3200, complete: 4000 };
  const INTRO_GLYPHS = { count: 200, minSize: 12, maxSize: 16 };
  const $ = (selector) => document.querySelector(selector);
  let data;
  let modeIndex = 0;
  let current = 0;
  let spinTimer;
  let landingTimer;

  const themes = {
    thinking: [
      ["#65c7c0", "#f0a07d"],
      ["#7c9de5", "#dfc46f"],
      ["#c77bd8", "#76c7c3"],
    ],
    doing: [
      ["#e5a348", "#e56b6b"],
      ["#d687ba", "#f0c467"],
      ["#6cbf8c", "#e3d463"],
    ],
    noticing: [
      ["#56b9b0", "#7fa9e8"],
      ["#6da3d6", "#d8a6d2"],
      ["#83bd86", "#dfc269"],
    ],
    challenging: [
      ["#ea777d", "#c893e6"],
      ["#e8a34c", "#6d9fe0"],
      ["#d36eaa", "#d8c45e"],
    ],
    imagining: [
      ["#ad7de4", "#e77fba"],
      ["#67c4a4", "#7799e8"],
      ["#dd7d7d", "#e4b759"],
    ],
  };

  const fallback = {
    modes: [
      {
        id: "thinking",
        label: "Thinking",
        cards: [
          {
            title: "Design for Breakdowns",
            body: "Observe the opportunity in front of you and intentionally design how it would go wrong.",
            note: "Focus on errors, misunderstandings, misuse, and opportunities of abandonment.",
          },
        ],
      },
      {
        id: "doing",
        label: "Doing",
        cards: [
          {
            title: "Make a Rough Version",
            body: "Turn the thought into something you can see, hear, touch, or walk through in the next ten minutes.",
            note: "It can be incomplete, awkward, or made from whatever is nearby.",
          },
        ],
      },
      {
        id: "noticing",
        label: "Noticing",
        cards: [
          {
            title: "Look at the Edge",
            body: "Focus on the person, condition, or context furthest from the assumed centre. What does it reveal?",
            note: "Treat the edge as a source of insight, not an exception.",
          },
        ],
      },
      {
        id: "challenging",
        label: "Challenging",
        cards: [
          {
            title: "Argue the Opposite",
            body: "Make the strongest case for the opposite of your current direction. What becomes visible when you reverse your position?",
            note: "You do not have to agree with the argument.",
          },
        ],
      },
      {
        id: "imagining",
        label: "Imagining",
        cards: [
          {
            title: "Jump Ten Years",
            body: "Imagine the opportunity has become ordinary ten years from now. What does a normal day look and feel like?",
            note: "Describe one small detail that makes the future believable.",
          },
        ],
      },
    ],
  };

  const activeMode = () => data.modes[modeIndex];
  const activeCards = () => activeMode().cards;
  const randomPosition = () => `${Math.round(-18 + Math.random() * 118)}vw`;

  function setTheme() {
    const palette = themes[activeMode().id] || themes.thinking;
    const colours = palette[Math.floor(Math.random() * palette.length)];
    document.body.style.setProperty("--accent", colours[0]);
    document.body.style.setProperty("--accent-soft", colours[1]);
    document.body.style.setProperty("--blob1-x", randomPosition());
    document.body.style.setProperty("--blob1-y", `${Math.round(5 + Math.random() * 68)}vh`);
    document.body.style.setProperty("--blob2-x", randomPosition());
    document.body.style.setProperty("--blob2-y", `${Math.round(42 + Math.random() * 60)}vh`);
  }

  function renderPrompt(prompt, animate = true) {
    const display = $("#display");
    clearTimeout(landingTimer);
    display.classList.remove("rolling", "land");
    if (animate) {
      void display.offsetWidth;
      display.classList.add("land");
      landingTimer = setTimeout(() => display.classList.remove("land"), 1000);
    }
    $("#promptTitle").textContent = prompt.title;
    $("#promptBody").textContent = prompt.body;
    $("#promptNote").textContent = prompt.note || "";
  }

  function renderModes() {
    const select = $("#modeSelect");
    select.innerHTML = "";
    data.modes.forEach((mode, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = mode.label;
      select.append(option);
    });
    select.value = modeIndex;
  }

  function setSpinning(locked) {
    $("#modeSelect").disabled = locked;
    $("#statusLabel").textContent = locked ? "Finding an angle" : "Ready to shift perspective";
    document.body.classList.toggle("spinning", locked);
  }

  function spin() {
    const pool = activeCards();
    if (!pool.length || $("#spinButton").disabled) return;
    $("#spinButton").disabled = true;
    $("#display").classList.remove("land");
    $("#display").classList.add("rolling");
    setSpinning(true);
    const started = performance.now();
    const duration = 3000;

    const tick = () => {
      const elapsed = performance.now() - started;
      current = Math.floor(Math.random() * pool.length);
      renderPrompt(pool[current], false);
      $("#display").classList.add("rolling");
      if (elapsed >= duration) {
        clearTimeout(spinTimer);
        renderPrompt(pool[current]);
        setSpinning(false);
        $("#spinButton").disabled = false;
        return;
      }
      const progress = elapsed / duration;
      spinTimer = setTimeout(tick, 42 + Math.pow(progress, 2.4) * 255);
    };
    tick();
  }

  function startIntro() {
    const screen = $("#intro");
    const field = $(".intro-field");
    $("#introEyebrow").textContent = INTRO_COPY.eyebrow;
    $("#introTitle").textContent = INTRO_COPY.title;
    $("#introEmphasis").textContent = INTRO_COPY.emphasis;
    $("#introDescription").innerHTML = INTRO_COPY.description.replace("\\n", "<br>");

    if (!INTRO_ENABLED) {
      screen.remove();
      document.body.classList.remove("intro-pending");
      document.body.classList.add("intro-complete");
      return;
    }

    const glyphSet = "●○◆◇✦✧＋⬡△□◌";
    for (let index = 0; index < INTRO_GLYPHS.count; index++) {
      const glyph = document.createElement("span");
      glyph.className = "intro-glyph";
      glyph.textContent = glyphSet[Math.floor(Math.random() * glyphSet.length)];
      glyph.style.setProperty("--x", `${Math.round(Math.random() * 100)}vw`);
      glyph.style.setProperty("--y", `${Math.round(Math.random() * 100)}vh`);
      glyph.style.setProperty(
        "--size",
        `${Math.round(INTRO_GLYPHS.minSize + Math.random() * (INTRO_GLYPHS.maxSize - INTRO_GLYPHS.minSize))}px`,
      );
      glyph.style.setProperty("--delay", `${Math.round(Math.random() * 1200)}ms`);
      glyph.style.setProperty("--speed", `${Math.round(4 + Math.random() * 5)}s`);
      field.append(glyph);
    }

    document.body.classList.add("intro-active");
    requestAnimationFrame(() => screen.classList.add("show"));
    setTimeout(() => screen.classList.add("show-glyphs"), INTRO_TIMING.glyphsAppear);
    setTimeout(() => screen.classList.add("text-out"), INTRO_TIMING.textOut);
    setTimeout(() => screen.classList.add("accelerate"), INTRO_TIMING.accelerate);
    setTimeout(() => screen.classList.add("exit"), INTRO_TIMING.exit);
    setTimeout(() => {
      screen.remove();
      document.body.classList.remove("intro-active", "intro-pending");
      document.body.classList.add("intro-complete");
    }, INTRO_TIMING.complete);
  }

  function init(payload) {
    data = payload && payload.modes ? payload : fallback;
    data.modes = data.modes.filter((mode) => mode.id && mode.label && mode.cards?.length);
    renderModes();
    setTheme();
    renderPrompt(activeCards()[0], false);
    startIntro();
  }

  $("#modeSelect").onchange = (event) => {
    if ($("#spinButton").disabled) {
      event.target.value = modeIndex;
      return;
    }
    modeIndex = Number(event.target.value);
    current = 0;
    setTheme();
    renderPrompt(activeCards()[0]);
  };
  $("#spinButton").onclick = spin;
  fetch("prompts.json")
    .then((response) => response.json())
    .then(init)
    .catch(() => init(fallback));
})();
