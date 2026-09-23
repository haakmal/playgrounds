(function () {
  "use strict";

  const STORAGE_KEY = "ddes1150-enchantment-v2";
  const CONTENT = window.ENCHANTMENT_CONTENT || {};
  const SETTINGS = CONTENT.settings || {};
  const DESIRES = CONTENT.desires || [];
  const POWERS = CONTENT.powers || [];
  const INGREDIENTS = CONTENT.ingredients || [];
  const ETHER = CONTENT.ether || [];
  const BALL_READINGS = CONTENT.ballReadings || [];

  const app = {
    workspace: null,
    currentStage: "welcome",
    currentSpellId: null,
    currentIngredientId: null,
    currentPair: null,
    pendingEther: null,
    journeyOpen: false,
    menuOpen: false,
    ballIndex: 0,
    etherIndex: 0,
    drawnDesire: false,
    drawnPower: false,
    ballComplete: false,
    savingTimer: null,
    transitionTimer: null,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[ch],
    );

  const el = {
    stage: $("#stage"),
    promptCopy: $("#promptCopy"),
    promptAction: $("#promptAction"),
    tools: $("#toolsDrawer"),
    book: $("#bookDrawer"),
    bookContent: $("#bookContent"),
    save: $("#saveState"),
    sessionsModal: $("#sessionsModal"),
    sessionsList: $("#sessionsList"),
    helpModal: $("#helpModal"),
    importInput: $("#importInput"),
  };

  function uid(prefix = "ench") {
    return (
      prefix +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }
  function activeSession() {
    return (
      app.workspace.sessions.find((s) => s.id === app.workspace.activeId) ||
      app.workspace.sessions[0]
    );
  }
  function activeSpell() {
    const s = activeSession();
    return s?.spells.find((x) => x.id === app.currentSpellId) || null;
  }
  function now() {
    return Date.now();
  }

  function blankSession(name = "The Untitled Grimoire") {
    return {
      id: uid("session"),
      name,
      interaction: "",
      context: "",
      ingredients: [],
      spells: [],
      tableUnlocked: false,
      created: now(),
      updated: now(),
      status: "active",
    };
  }

  function defaultWorkspace() {
    const session = blankSession("The Untitled Grimoire");
    return { activeId: session.id, sessions: [session] };
  }

  function normaliseWorkspace(data) {
    if (!data || !Array.isArray(data.sessions) || !data.sessions.length)
      return null;
    const sessions = data.sessions.map((raw) => {
      const base = blankSession(raw.name || "The Untitled Grimoire");
      Object.assign(base, raw);
      base.tableUnlocked = Boolean(
        raw.tableUnlocked ??
        (Array.isArray(raw.spells) && raw.spells.length > 0),
      );
      base.id = raw.id || base.id;
      base.ingredients = Array.isArray(raw.ingredients)
        ? raw.ingredients.map((i) => ({
            id: i.id || uid("ingredient"),
            type: i.type || "",
            label: i.label || "",
            value: i.value || "",
          }))
        : [];
      base.spells = Array.isArray(raw.spells)
        ? raw.spells.map((spell) => ({
            id: spell.id || uid("spell"),
            name: spell.name || "Unnamed spell",
            desire: spell.desire || null,
            power: spell.power || null,
            ingredient: spell.ingredient || null,
            idea: spell.idea || "",
            variations: Array.isArray(spell.variations)
              ? spell.variations.map((v) => ({
                  id: v.id || uid("variation"),
                  ether: v.ether || null,
                  response: v.response || "",
                  created: v.created || now(),
                }))
              : [],
            created: spell.created || now(),
            updated: spell.updated || now(),
          }))
        : [];
      return base;
    });
    return {
      activeId: sessions.some((s) => s.id === data.activeId)
        ? data.activeId
        : sessions[0].id,
      sessions,
    };
  }

  function save() {
    try {
      activeSession().updated = now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(app.workspace));
      el.save.textContent = "Saved locally";
    } catch (_) {}
  }

  function scheduleSave() {
    el.save.textContent = "Saving…";
    clearTimeout(app.savingTimer);
    app.savingTimer = setTimeout(save, 250);
  }

  function transition(renderFn) {
    clearTimeout(app.transitionTimer);
    el.stage.classList.remove("is-entering");
    el.stage.classList.add("is-leaving");
    app.transitionTimer = setTimeout(() => {
      renderFn();
      el.stage.classList.remove("is-leaving");
      void el.stage.offsetWidth;
      el.stage.classList.add("is-entering");
      renderBook();
    }, 680);
  }

  function setPrompt(copy, actionHtml = "", feedback = "") {
    el.promptCopy.innerHTML = `${copy || ""}${feedback ? `<span class=\"prompt-feedback\">${esc(feedback)}</span>` : ""}`;
    el.promptAction.innerHTML = actionHtml || "";
  }

  function setPromptFeedback(message) {
    const existing = el.promptCopy.querySelector(".prompt-feedback");
    if (existing) existing.remove();
    if (!message) return;
    const note = document.createElement("span");
    note.className = "prompt-feedback";
    note.textContent = message;
    el.promptCopy.appendChild(note);
  }

  function openDrawer(which) {
    if (which === "tools") {
      el.tools.classList.add("is-open");
      el.tools.setAttribute("aria-hidden", "false");
    } else {
      el.book.classList.add("is-open");
      el.book.setAttribute("aria-hidden", "false");
      renderBook();
    }
  }
  function closeDrawers() {
    [el.tools, el.book].forEach((d) => {
      d.classList.remove("is-open");
      d.setAttribute("aria-hidden", "true");
    });
  }
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add("is-open");
      m.setAttribute("aria-hidden", "false");
    }
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
    }
  }

  function chooseRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  function chooseUnusedPair() {
    const session = activeSession();
    const used = new Set(
      session.spells.map((s) => `${s.desire?.name}|${s.power?.name}`),
    );
    let pair = null;
    for (let i = 0; i < 40; i++) {
      const desire = chooseRandom(DESIRES),
        power = chooseRandom(POWERS);
      if (!used.has(`${desire.name}|${power.name}`) || i === 39) {
        pair = { desire, power };
        break;
      }
    }
    return pair;
  }
  function chooseUnusedIngredient() {
    const session = activeSession();
    const selected = new Set(
      session.spells.map((s) => s.ingredient?.id).filter(Boolean),
    );
    const available = INGREDIENTS.filter((i) => !selected.has(i.id));
    return chooseRandom(available.length ? available : INGREDIENTS);
  }

  function renderWelcome() {
    app.currentStage = "welcome";
    setPrompt(
      "The table is quiet. Bring something with you.",
      '<button class="button button-primary" id="approachButton">Approach the table</button>',
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <div class="seer-mark" aria-hidden="true">✦</div>
          <p class="kicker">The Seer</p>
          <h1 class="title">There is another<br>way to see it.</h1>
          <p class="subtitle">${esc((CONTENT.openingLines || [])[0] || "You have brought an interaction that needs another possibility.")}</p>
        </div>`;
      $("#approachButton").addEventListener("click", renderQuandary);
    });
  }

  function renderQuandary() {
    app.currentStage = "quandary";
    const s = activeSession();
    setPrompt(
      "Tell the Seer what brought you here. No solution required yet.",
      '<button class="button button-primary" id="quandaryNext">Bring it to the table</button>',
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene narrow">
          <p class="kicker">Bring your quandary</p>
          <h2 class="title" style="font-size:clamp(40px,6vw,68px)">What interaction<br>needs another possibility?</h2>
          <div class="form-card">
            <label class="field"><span>Your interaction</span><textarea id="interactionInput" rows="5" placeholder="e.g. Finding an available place to study on campus">${esc(s.interaction)}</textarea></label>
            <label class="field"><span>Where or when does it happen? <em>(optional)</em></span><input id="contextInput" value="${esc(s.context)}" placeholder="e.g. Between classes, around lunchtime, in the library"></label>
            <p class="edit-hint">You can edit this later from the Spell Book.</p>
          </div>
        </div>`;
      const input = $("#interactionInput"),
        context = $("#contextInput");
      [input, context].forEach((node) =>
        node.addEventListener("input", () => {
          s.interaction = input.value;
          s.context = context.value;
          scheduleSave();
          renderBook();
          gateQuandary();
        }),
      );
      $("#quandaryNext").addEventListener("click", () => {
        if (!canContinue(s.interaction, SETTINGS.minInteractionLength || 12))
          return softNudge(
            "quandaryNext",
            "Give the Seer a little more to work with.",
          );
        renderIngredients();
      });
      gateQuandary();
      input.focus();
    });
  }

  function gateQuandary() {}

  function renderIngredients(openType = null) {
    app.currentStage = "ingredients";
    const s = activeSession();
    setPrompt(
      "Choose a few things that shape the interaction. You do not need everything.",
      '<button class="button button-primary" id="ingredientsDone">Let the Seer look closer</button>',
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <p class="kicker">Gather your ingredients</p>
          <h2 class="title" style="font-size:clamp(38px,5.8vw,66px)">What matters here?</h2>
          <p class="subtitle">Pick a few lenses. The Seer will help you start but you must fill in what each one changes.</p>
          <div class="ingredient-grid" id="ingredientGrid">${INGREDIENTS.map(
            (item) => `
            <button type="button" class="ingredient-card ${s.ingredients.some((i) => i.type === item.id) ? "is-selected" : ""}" data-ingredient="${esc(item.id)}">
              <strong>${esc(item.label)}</strong>
              <small>${esc(item.question)}</small>
            </button>`,
          ).join("")}</div>
          <div id="factorEditor"></div>
        </div>`;
      $$(".ingredient-card").forEach((card) =>
        card.addEventListener("click", () =>
          editIngredient(card.dataset.ingredient),
        ),
      );
      $("#ingredientsDone").addEventListener("click", () => {
        if (s.ingredients.length < Number(SETTINGS.minIngredients || 2))
          return softNudge(
            "ingredientsDone",
            "A couple of useful ingredients are enough to begin. Choose at least two.",
          );
        beginSpell();
      });
      const typeToOpen = openType || s.ingredients[0]?.type;
      if (typeToOpen) editIngredient(typeToOpen, false);
      updateIngredientGate();
    });
  }

  function editIngredient(type, autofocus = true) {
    const item = INGREDIENTS.find((x) => x.id === type);
    if (!item) return;
    const s = activeSession();
    let record = s.ingredients.find((x) => x.type === type);
    if (!record) {
      if (s.ingredients.length >= Number(SETTINGS.maxIngredientSelections || 5))
        return softNudge(
          "ingredientsDone",
          "That is enough ingredients for now. Let the Seer work with them.",
        );
      record = { id: uid("ingredient"), type, label: item.label, value: "" };
      s.ingredients.push(record);
      scheduleSave();
    }
    const editor = $("#factorEditor");
    editor.innerHTML = `
      <div class="factor-editor">
        <h3>${esc(item.label)}</h3>
        <p>${esc(item.guidance)}</p>
        <label class="field"><span>Your interaction</span><input id="factorInput" value="${esc(record.value)}" placeholder="What is true here? Update this if needed."></label>
      </div>`;
    $("#factorInput").addEventListener("input", (e) => {
      record.value = e.target.value;
      scheduleSave();
      renderBook();
    });
    if (autofocus) setTimeout(() => $("#factorInput")?.focus(), 60);
    $$(".ingredient-card").forEach((c) =>
      c.classList.toggle("is-selected", c.dataset.ingredient === type),
    );
    updateIngredientGate();
  }

  function updateIngredientGate() {}

  function beginSpell() {
    const s = activeSession();
    if (!s) return;

    s.tableUnlocked = true;
    scheduleSave();

    app.currentPair = chooseUnusedPair();
    app.currentIngredientId =
      chooseRandom(activeSession().ingredients)?.id ||
      activeSession().ingredients[0]?.type ||
      null;
    app.drawnDesire = false;
    app.drawnPower = false;
    app.ballComplete = false;
    app.ballHasReading = false;
    app.currentSpellDraft = "";
    app.currentSpellName = "";
    renderSpellTable();
  }

  function renderSpellTable() {
    app.currentStage = "spell-table";
    const s = activeSession();
    const pair = app.currentPair;
    const ingredient =
      s.ingredients.find((i) => i.id === app.currentIngredientId) ||
      s.ingredients[0];
    const ingredientDef = INGREDIENTS.find((i) => i.id === ingredient?.type);
    setPrompt(
      "The Seer has laid the tools before you. Begin with the cards, then read the crystal ball, then shape your spell.",
      "",
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene spell-table-scene">
          <p class="kicker">The Seer’s table</p>
          <h2 class="table-title">Craft the enchantment.</h2>
          <div class="spell-steps" aria-label="Spellcraft steps">
            <div class="spell-step is-active" data-step="1"><span>1</span><strong>Draw</strong><small>the cards</small></div>
            <div class="spell-step" data-step="2"><span>2</span><strong>Read</strong><small>the crystal</small></div>
            <div class="spell-step" data-step="3"><span>3</span><strong>Craft</strong><small>the spell</small></div>
          </div>
          <div class="spell-table">
            <section class="table-panel table-cards" aria-label="Spell cards">
              <p class="table-label">Cards</p>
              <div class="draw-stack">
                <button class="draw-card ${app.drawnDesire ? "is-drawn" : ""}" id="desireCard" type="button" aria-label="Draw desire card">
                  <span class="card-face-back">Desire</span>
                  <span class="card-face-result"></span>
                </button>
                <button class="draw-card ${app.drawnPower ? "is-drawn" : ""}" id="powerCard" type="button" aria-label="Draw power card">
                  <span class="card-face-back">Power</span>
                  <span class="card-face-result"></span>
                </button>
              </div>
              <p class="table-hint">The cards decide where to look. The idea is yours.</p>
            </section>

            <section class="table-panel table-ball" aria-label="Crystal ball">
              <p class="table-label">Crystal ball</p>
              <div class="ball-shell" id="ballShell">
                <div class="ball" id="crystalBall">
                  <span class="ball-ring r1"></span><span class="ball-ring r2"></span><span class="ball-ring r3"></span><span class="ball-ring r4"></span>
                  <div class="ball-core" id="ballCore">Awaiting the spell</div>
                  <div class="ball-reading" id="ballReading"></div>
                </div>
              </div>
            </section>

            <section class="table-panel table-craft" aria-label="Spell crafting">
              <p class="table-label">Your spell</p>
              <div id="craftPanel" class="craft-panel-empty">
                <p>The spell will take shape here.</p>
                <small>Draw both cards and let the Seer look into the crystal ball.</small>
              </div>
            </section>
          </div>
        </div>`;
      $("#desireCard").addEventListener("click", () => dealCard("desire"));
      $("#powerCard").addEventListener("click", () => dealCard("power"));
      updateSpellSteps();
      if (app.drawnDesire) revealCardVisual("desire");
      if (app.drawnPower) revealCardVisual("power");
      if (app.drawnDesire && app.drawnPower && !app.ballComplete)
        startCrystalReading();
    });
  }

  function dealCard(type) {
    if (type === "desire" && app.drawnDesire) return;
    if (type === "power" && app.drawnPower) return;
    const button = type === "desire" ? $("#desireCard") : $("#powerCard");
    if (!button) return;
    button.classList.add("is-flipping");
    setPrompt(
      type === "desire"
        ? "The first card turns. Let it change how you see the interaction."
        : "The second card turns. Notice what happens when these two forces meet.",
      "",
    );
    setTimeout(() => {
      if (type === "desire") app.drawnDesire = true;
      if (type === "power") app.drawnPower = true;
      revealCardVisual(type);
      updateSpellSteps();
      button.classList.remove("is-flipping");
      if (app.drawnDesire && app.drawnPower)
        setTimeout(startCrystalReading, 520);
      else setPrompt("One card has spoken. Draw the other.", "");
    }, 820);
  }

  function revealCardVisual(type) {
    const pair = app.currentPair;
    const button = type === "desire" ? $("#desireCard") : $("#powerCard");
    if (!button || !pair) return;
    const item = type === "desire" ? pair.desire : pair.power;
    const result = $(".card-face-result", button);
    $(".card-face-back", button)?.classList.add("is-hidden");
    if (result)
      result.innerHTML = `<strong>${esc(item.name)}</strong><small>${esc(type === "desire" ? item.description : item.nudge)}</small>`;
    button.classList.add("is-drawn");
  }

  function updateSpellSteps() {
    const root = $(".spell-steps");
    if (!root) return;
    let current = 1;
    if (app.drawnDesire && app.drawnPower) current = app.ballComplete ? 3 : 2;
    $$("[data-step]", root).forEach((step) => {
      const n = Number(step.dataset.step);
      step.classList.toggle("is-active", n === current);
      step.classList.toggle("is-complete", n < current);
    });
  }

  function startCrystalReading() {
    if (app.ballComplete) return;
    app.currentStage = "crystal-reading";
    const s = activeSession();
    const ingredient =
      s.ingredients.find((i) => i.id === app.currentIngredientId) ||
      s.ingredients[0];
    const data =
      INGREDIENTS.find((i) => i.id === ingredient?.type) || INGREDIENTS[0];
    const reading =
      BALL_READINGS[app.ballIndex++ % Math.max(BALL_READINGS.length, 1)] ||
      "Look at the interaction through this lens.";
    const ball = $("#crystalBall");
    const core = $("#ballCore");
    const read = $("#ballReading");
    const craft = $("#craftPanel");
    if (!ball || !core || !read || !craft) return;

    setPrompt(
      "The cards have met. The Seer is looking for something from the world you brought in.",
      "",
    );
    $(".table-ball")?.classList.add("is-active-reading");
    core.textContent = "";
    read.innerHTML = `<em>${esc(data.label)}</em><strong>${esc(reading)}</strong><span>${esc(ingredient?.value || "This part of the situation has not been described yet.")}</span>`;
    read.classList.remove("is-visible");
    craft.innerHTML = `
      <div class="craft-context">
        <div class="craft-combination"><span>${esc(app.currentPair.desire.name)}</span><b>+</b><span>${esc(app.currentPair.power.name)}</span></div>
        <div class="craft-lens"><span>seen through</span><strong>${esc(data.label)}</strong></div>
        <label class="field"><span>What did you imagine?</span><textarea id="ideaInput" rows="7" placeholder="Describe what the person does, what changes, and what happens next..."></textarea></label>
        <label class="field"><span>Name your spell <em>(optional)</em></span><input id="spellName" placeholder="The Whispering Table"></label>
      </div>`;
    $("#ideaInput").addEventListener("input", (e) => {
      app.currentSpellDraft = e.target.value;
      setPromptFeedback("");
      scheduleSave();
    });
    $("#spellName").addEventListener("input", (e) => {
      app.currentSpellName = e.target.value;
      scheduleSave();
    });
    setTimeout(() => ball.classList.add("is-reading"), 80);
    setTimeout(() => {
      updateSpellSteps();
    }, 1250);
    setTimeout(() => core.classList.add("is-visible"), 1550);
    setTimeout(() => {
      read.classList.add("is-visible");
      ball.classList.add("has-reading");
      core.classList.remove("is-visible");
    }, 2850);
    setTimeout(() => {
      app.ballComplete = true;
      updateSpellSteps();
      $(".table-ball")?.classList.remove("is-active-reading");
      setPrompt(
        "The crystal ball has found its lens. Now give the spell a form of your own.",
        '<button class="button button-primary" id="saveSpell">Place the spell in the grimoire</button>',
      );
      $("#ideaInput")?.focus();
      $("#saveSpell")?.addEventListener("click", saveSpellDraft);
    }, 3900);
  }

  function saveSpellDraft() {
    const text = $("#ideaInput")?.value.trim() || app.currentSpellDraft || "";
    if (!canContinue(text, SETTINGS.minIdeaLength || 20))
      return softNudge(
        "saveSpell",
        "The Seer is waiting for the idea itself. Give the interaction a little more shape.",
      );
    const s = activeSession();
    const name =
      $("#spellName")?.value.trim() || "" || `Spell ${s.spells.length + 1}`;
    const ingredient =
      s.ingredients.find((i) => i.id === app.currentIngredientId) ||
      s.ingredients[0];
    const spell = {
      id: uid("spell"),
      name,
      desire: app.currentPair.desire,
      power: app.currentPair.power,
      ingredient: {
        id: ingredient?.id || "",
        type: ingredient?.type || "",
        value: ingredient?.value || "",
      },
      idea: text,
      variations: [],
      created: now(),
      updated: now(),
    };
    s.spells.push(spell);
    app.currentSpellId = spell.id;
    scheduleSave();
    app.currentPair = null;
    app.currentIngredientId = null;
    app.currentSpellDraft = "";
    app.currentSpellName = "";
    renderCraftedSpell(spell);
  }

  function renderCraftedSpell(spell) {
    const ingredientDef = INGREDIENTS.find(
      (i) => i.id === spell.ingredient?.type,
    );
    setPrompt(
      "The spell is now written in your grimoire. You can disturb it or return to the Seer’s table.",
      '<button class="button button-secondary" id="disturbSpell">Pull from the Ether</button><button class="button button-primary" id="anotherSpell">Return to the Seer’s table</button>',
    );
    const craft = $("#craftPanel");
    if (craft) {
      craft.innerHTML = `
        <article class="crafted-spell-card">
          <span class="crafted-badge">Written in ${esc(activeSession().name)}</span>
          <h3>${esc(spell.name)}</h3>
          <p>${esc(spell.idea)}</p>
          <div class="crafted-meta"><strong>${esc(spell.desire.name)} + ${esc(spell.power.name)}</strong><span>through ${esc(ingredientDef?.label || "your context")}</span></div>
        </article>`;
    }
    $("#disturbSpell").addEventListener("click", renderEther);
    $("#anotherSpell").addEventListener("click", beginSpell);
    const stage = $("#craftPanel")?.closest(".spell-table-scene");
    if (stage) stage.classList.add("spell-written");
    renderBook();
  }

  function renderSpellBookFull() {
    openDrawer("book");
  }

  function renderBook() {
    const s = activeSession();
    if (!s) {
      el.bookContent.innerHTML = "";
      return;
    }
    const ingredients = s.ingredients
      .map(
        (i) =>
          `<li><strong>${esc((INGREDIENTS.find((x) => x.id === i.type) || {}).label || i.label)}</strong> — ${esc(i.value || "Not described yet")}</li>`,
      )
      .join("");
    const spells = s.spells
      .map(
        (sp, i) => `
      <article class="book-card" data-open-spell="${esc(sp.id)}"><h3>${esc(sp.name)}</h3><p>${esc(sp.idea)}</p><div class="book-meta">${esc(sp.desire.name)} + ${esc(sp.power.name)} · ${sp.variations.length} variation${sp.variations.length === 1 ? "" : "s"}</div></article>`,
      )
      .join("");
    const returnToTable = s.tableUnlocked
      ? '<button class="drawer-action" id="returnTableFromBook" type="button">Return to the Seer’s table</button>'
      : "";
    el.bookContent.innerHTML = `
      <section class="spell-section"><p class="book-title"><button class="drawer-action" id="renameFromBook" type="button">${esc(s.name)}</button></p>
      ${returnToTable}
      </section>
      <section class="spell-section"><h3>Your quandary</h3><p>${esc(s.interaction || "Not started yet.")}</p></section>
      <section class="spell-section"><h3>Ingredients</h3><div class="book-ingredients">${s.ingredients.map((i) => `<button type="button" class="book-ingredient" data-edit-ingredient="${esc(i.type)}"><strong>${esc((INGREDIENTS.find((x) => x.id === i.type) || {}).label || i.label)}</strong><span>${esc(i.value || "Add a detail")}</span></button>`).join("") || '<p style="color:var(--muted)">No ingredients yet.</p>'}</div><button class="drawer-action" id="editIngredientsFromBook" type="button">Edit ingredients</button></section>
      <section class="spell-section"><h3>Spells</h3><div class="spellbook-list">${spells || '<p style="color:var(--muted)">Your first spell will appear here.</p>'}</div></section>`;
    $("#renameFromBook")?.addEventListener("click", renameSession);
    $("#returnTableFromBook")?.addEventListener("click", () => {
      closeDrawers();
      beginSpell();
    });
    $("#editIngredientsFromBook")?.addEventListener("click", () => {
      closeDrawers();
      renderIngredients();
    });
    $$("[data-edit-ingredient]").forEach((card) =>
      card.addEventListener("click", () => {
        const type = card.dataset.editIngredient;
        closeDrawers();
        renderIngredients(type);
      }),
    );
    $$("[data-open-spell]").forEach((card) =>
      card.addEventListener("click", () =>
        openSavedSpell(card.dataset.openSpell),
      ),
    );
  }

  function openSavedSpell(id) {
    const s = activeSession();
    const spell = s.spells.find((x) => x.id === id);
    if (!spell) return;
    app.currentSpellId = id;
    closeDrawers();
    setPrompt(
      "This spell is still yours to disturb. Return to the Seer whenever you want to craft another.",
      `<button class="button button-secondary" id="backToBook">Grimoire</button><button class="button button-secondary" id="returnToTableFromSpell">Seer’s table</button><button class="button button-primary" id="disturbSaved">Pull from the Ether</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `<div class="scene narrow"><p class="kicker">From the spell book</p><h2 class="title" style="font-size:clamp(40px,6vw,72px)">${esc(spell.name)}</h2><p class="subtitle">${esc(spell.idea)}</p><div class="preview-grid" style="grid-template-columns:1fr;margin-top:28px"><article class="idea-tile is-selected"><small>${esc(spell.desire.name)} + ${esc(spell.power.name)}</small><h3>Original spell</h3><p>${esc(spell.idea)}</p></article>${spell.variations.map((v) => `<article class="idea-tile"><small>Ether</small><h3>${esc(v.ether?.text || "Variation")}</h3><p>${esc(v.response || "No response recorded yet.")}</p></article>`).join("")}</div></div>`;
      $("#backToBook").addEventListener("click", () => openDrawer("book"));
      $("#returnToTableFromSpell").addEventListener("click", () =>
        beginSpell(),
      );
      $("#disturbSaved").addEventListener("click", renderEther);
    });
  }

  function renderEther() {
    const spell = activeSpell();
    if (!spell) return;
    app.currentStage = "ether";
    setPrompt(
      "The Ether is stirring around this spell. Watch for what changes.",
      "",
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene ether-wrap">
          <p class="kicker">The Ether</p>
          <h2 class="title" style="font-size:clamp(38px,5.5vw,65px)">${esc(spell.name)}</h2>
          <div class="ether-source"><span>${esc(spell.idea)}</span></div>
          <div class="ether-window" id="etherWindow"><div class="ether-line" id="etherLine">…</div></div>
          <p class="ether-nudge" id="etherNudge">The spell is never quite finished.</p>
        </div>`;
      setTimeout(spinEther, 520);
    });
  }

  function spinEther() {
    const line = $("#etherLine");
    if (!line || !ETHER.length) return;
    line.classList.add("is-spinning");
    let i = 0;
    const interval = setInterval(() => {
      line.textContent = ETHER[i % ETHER.length].text;
      i++;
    }, 120);
    setTimeout(() => {
      clearInterval(interval);
      const choice = chooseRandom(ETHER);
      line.textContent = choice.text;
      line.classList.remove("is-spinning");
      line.classList.add("is-settled");
      app.pendingEther = choice;
      setTimeout(revealEtherCapture, 850);
    }, 2100);
  }

  function revealEtherCapture() {
    const spell = activeSpell(),
      choice = app.pendingEther;
    if (!spell || !choice) return;
    const wrap = $(".ether-wrap");
    if (!wrap) return;
    const nudge = $("#etherNudge");
    if (nudge) nudge.textContent = choice.nudge;
    const line = $("#etherLine");
    if (line) line.classList.add("is-quiet");
    setPrompt(
      "The Ether has altered one condition. Follow that change and give the variation a form.",
      '<button class="button button-primary" id="saveVariation">Write the variation</button>',
    );
    const capture = document.createElement("div");
    capture.className = "ether-capture";
    capture.innerHTML = `
      <div class="variation-rule"><strong>${esc(choice.text)}</strong><span>${esc(choice.nudge)}</span></div>
      <label class="field"><span>What changed?</span><textarea id="variationInput" rows="6" placeholder="Describe the revised interaction..."></textarea></label>`;
    wrap.appendChild(capture);
    $("#saveVariation").addEventListener("click", saveVariation);
    $("#variationInput")?.focus();
  }

  function saveVariation() {
    const text = $("#variationInput")?.value.trim() || "";
    if (!canContinue(text, SETTINGS.minIdeaLength || 20))
      return softNudge(
        "saveVariation",
        "The Ether changed the spell. Give the variation enough shape that you can recognise it later.",
      );
    const spell = activeSpell();
    spell.variations.push({
      id: uid("variation"),
      ether: app.pendingEther,
      response: text,
      created: now(),
    });
    spell.updated = now();
    app.pendingEther = null;
    scheduleSave();
    renderVariationSaved(spell);
  }

  function renderVariationSaved(spell) {
    const last = spell.variations.at(-1);
    setPrompt(
      "The variation is written in the grimoire. You can disturb this spell again, return to the book, or return to the Seer’s table.",
      '<button class="button button-secondary" id="bookAfterVariation">Grimoire</button><button class="button button-secondary" id="againAfterVariation">Disturb again</button><button class="button button-primary" id="tableAfterVariation">Return to the Seer’s table</button>',
    );
    const wrap = $(".ether-wrap");
    if (!wrap) return;
    const capture = $(".ether-capture");
    if (capture)
      capture.innerHTML = `<div class="variation-saved"><span class="crafted-badge">Variation written</span><h3>${esc(last.ether.text)}</h3><p>${esc(last.response)}</p></div>`;
    $("#bookAfterVariation").addEventListener("click", () =>
      openDrawer("book"),
    );
    $("#againAfterVariation").addEventListener("click", renderEther);
    $("#tableAfterVariation").addEventListener("click", beginSpell);
    renderBook();
  }

  function canContinue(text, min) {
    return String(text || "").trim().length >= Number(min);
  }

  function softNudge(buttonId, message) {
    const button = document.getElementById(buttonId);
    const field = button?.closest(".prompt-rail")
      ? null
      : document.querySelector(".field input:focus, .field textarea:focus");
    setPromptFeedback(message);
    button?.classList.add("is-jiggling");
    setTimeout(() => button?.classList.remove("is-jiggling"), 420);
    if (field) {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
      setTimeout(() => field.classList.remove("is-invalid"), 1200);
    }
  }

  function renameSession() {
    const s = activeSession();
    const value = window.prompt(
      "Name your grimoire",
      s.name || "The Untitled Grimoire",
    );
    if (value === null) return;
    s.name = value.trim() || "The Untitled Grimoire";
    scheduleSave();
    renderBook();
    closeDrawers();
  }

  function openSessions() {
    closeDrawers();
    renderSessions();
    openModal("sessionsModal");
  }
  function renderSessions() {
    el.sessionsList.innerHTML = app.workspace.sessions
      .map(
        (s) =>
          `<div class="session-row"><div><strong>${esc(s.name)}</strong><small>${s.spells.length} spell${s.spells.length === 1 ? "" : "s"}</small></div><div class="session-actions"><button data-open-session="${esc(s.id)}">Open</button><button data-duplicate-session="${esc(s.id)}">Duplicate</button><button data-delete-session="${esc(s.id)}">Delete</button></div></div>`,
      )
      .join("");
    $$("[data-open-session]").forEach((b) =>
      b.addEventListener("click", () => {
        app.workspace.activeId = b.dataset.openSession;
        save();
        closeModal("sessionsModal");
        renderWelcome();
      }),
    );
    $$("[data-duplicate-session]").forEach((b) =>
      b.addEventListener("click", () => {
        const source = app.workspace.sessions.find(
          (x) => x.id === b.dataset.duplicateSession,
        );
        const copy = JSON.parse(JSON.stringify(source));
        copy.id = uid("session");
        copy.name = source.name + " — copy";
        copy.spells.forEach((sp) => {
          sp.id = uid("spell");
          sp.variations.forEach((v) => (v.id = uid("variation")));
        });
        app.workspace.sessions.push(copy);
        app.workspace.activeId = copy.id;
        save();
        renderSessions();
      }),
    );
    $$("[data-delete-session]").forEach((b) =>
      b.addEventListener("click", () => {
        if (app.workspace.sessions.length === 1) return;
        if (!confirm("Delete this spell book?")) return;
        app.workspace.sessions = app.workspace.sessions.filter(
          (x) => x.id !== b.dataset.deleteSession,
        );
        if (
          !app.workspace.sessions.some((x) => x.id === app.workspace.activeId)
        )
          app.workspace.activeId = app.workspace.sessions[0].id;
        save();
        renderSessions();
        renderWelcome();
      }),
    );
  }

  function exportWorkspace() {
    save();
    const blob = new Blob([JSON.stringify(app.workspace, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "enchantment-spell-book.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importWorkspace() {
    el.importInput.click();
  }
  el.importInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const data = normaliseWorkspace(json);
      if (!data) throw new Error("Invalid spell book");
      app.workspace = data;
      save();
      closeDrawers();
      renderWelcome();
    } catch (_) {
      alert("That file does not look like an Enchantment spell book.");
    }
    e.target.value = "";
  });

  function printRecord() {
    const s = activeSession();
    const ingredientLabel = (item) =>
      (INGREDIENTS.find((x) => x.id === item?.type) || {}).label ||
      item?.label ||
      "";
    const rows = s.spells
      .map(
        (sp, i) => `<article>
      <h2>${i + 1}. ${esc(sp.name)}</h2>
      <p><strong>Ideation direction:</strong> ${esc(sp.desire.name)} + ${esc(sp.power.name)}</p>
      <p><strong>Contextual lens:</strong> ${esc(ingredientLabel(sp.ingredient))}</p>
      <p><strong>Concept:</strong> ${esc(sp.idea)}</p>
      ${sp.variations.map((v, vi) => `<section class="variation"><p><strong>Provocation ${vi + 1}:</strong> ${esc(v.ether.text)}</p><p><strong>Revised interaction:</strong> ${esc(v.response)}</p></section>`).join("")}
    </article>`,
      )
      .join("");
    const contextualFactors = s.ingredients
      .map(ingredientLabel)
      .filter(Boolean)
      .join(" · ");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(s.name)}</title><style>body{font-family:Arial,Helvetica,sans-serif;max-width:820px;margin:42px auto;color:#111;line-height:1.55}h1{font:400 38px Georgia,serif;margin:8px 0 22px}h2{font:400 24px Georgia,serif;border-top:1px solid #ccc;padding-top:20px;margin:28px 0 12px}h3{font:400 18px Georgia,serif}small{color:#666;text-transform:uppercase;letter-spacing:.08em}article{break-inside:avoid}.variation{margin:14px 0 0;padding:12px 0 0 16px;border-left:2px solid #ddd}p{margin:8px 0}.meta{color:#555}</style></head><body><small>INTERACTION DESIGN IDEATION RECORD</small><h1>${esc(s.name)}</h1><p><strong>Interaction / design opportunity:</strong> ${esc(s.interaction)}</p><p class="meta"><strong>Contextual factors considered:</strong> ${esc(contextualFactors || "None recorded")}</p><h2>Ideation explorations</h2>${rows || "<p>No concepts recorded yet.</p>"}<p class="meta">This record documents an exploratory ideation activity. Concepts are student-generated and were developed through contextual prompts and iterative provocations.</p></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  function init() {
    try {
      app.workspace =
        normaliseWorkspace(JSON.parse(localStorage.getItem(STORAGE_KEY))) ||
        defaultWorkspace();
    } catch (_) {
      app.workspace = defaultWorkspace();
    }
    $("#menuButton").addEventListener("click", () => openDrawer("tools"));
    $("#bookButton").addEventListener("click", () => openDrawer("book"));
    $("#closeTools").addEventListener("click", closeDrawers);
    $("#closeBook").addEventListener("click", closeDrawers);
    $("#renameSession").addEventListener("click", renameSession);
    $("#sessionsButton").addEventListener("click", openSessions);
    $("#exportButton").addEventListener("click", exportWorkspace);
    $("#importButton").addEventListener("click", importWorkspace);
    $("#printButton").addEventListener("click", printRecord);
    $("#helpButton").addEventListener("click", () => {
      closeDrawers();
      openModal("helpModal");
    });
    $("#newSessionButton").addEventListener("click", () => {
      const name = window.prompt("Name this grimoire", "The Necronomicon");
      if (name === null) return;
      const s = blankSession(name.trim() || "The Untitled Grimoire");
      app.workspace.sessions.push(s);
      app.workspace.activeId = s.id;
      save();
      closeModal("sessionsModal");
      renderWelcome();
    });
    $$("[data-close-modal]").forEach((b) =>
      b.addEventListener("click", () => closeModal(b.dataset.closeModal)),
    );
    $$(".modal").forEach((m) =>
      m.addEventListener("click", (e) => {
        if (e.target === m) closeModal(m.id);
      }),
    );
    renderWelcome();
    renderBook();
  }

  init();
})();
