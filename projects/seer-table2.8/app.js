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

  const COPY = {
    seer: {
      toolsTitle: "The Seer’s Table",
      menuAria: "Open tools",
      bookLabel: "Grimoire",
      bookAria: "Open grimoire",
      rename: "Rename grimoire",
      sessions: "My grimoires",
      export: "Export spell book",
      import: "Import spell book",
      print: "Print / Save PDF",
      help: "How this works",
      quandary: "Quandary",
      editQuandary: "Edit quandary",
      set: "set",
      ingredients: "Ingredients",
      editIngredients: "Edit ingredients",
      spells: "Spells",
      returnTable: "Return to the Seer’s table",
      seerTable: "The Seer’s table",
      craft: "Craft the enchantment.",
      cards: "Cards",
      crystal: "Crystal ball",
      yourSpell: "Your spell",
      desireCard: "Desire",
      powerCard: "Power",
      draw: "Draw",
      read: "Read",
      craftStep: "Craft",
      theCards: "the cards",
      theCrystal: "the crystal",
      theSpell: "the spell",
      ether: "The Ether",
      disturb: "Pull from the Ether",
      editSpell: "Edit this spell",
      saveSpell: "Save changes",
      craftAnother: "Craft another spell",
      studioMode: "Studio",
      seerMode: "Seer’s Table",
      modeHint: "Experience mode",
      lockedTitle: "The Grimoire is already enchanted",
      lockedBody: ["Your spells have already been crafted from this quandary. Changing the starting point now would change the meaning of what you have explored.", "For a new direction, begin a new Grimoire. Your current Grimoire will remain safely in your collection."],
      newSession: "New Grimoire",
      sessionList: "My grimoires",
      deleteSession: "Delete this spell book?",
      keepLocked: "Keep this quandary",
      newLocked: "Start a new Grimoire",
    },
    studio: {
      toolsTitle: "Interaction Ideation",
      menuAria: "Open tools",
      bookLabel: "Ideation record",
      bookAria: "Open ideation record",
      rename: "Rename session",
      sessions: "My sessions",
      export: "Export ideation record",
      import: "Import ideation record",
      print: "Print / Save PDF",
      help: "How this works",
      quandary: "Interaction problem",
      editQuandary: "Edit interaction",
      set: "set",
      ingredients: "Contextual factors",
      editIngredients: "Edit contextual factors",
      spells: "Concepts",
      returnTable: "Return to ideation workspace",
      seerTable: "Ideation workspace",
      craft: "Develop the interaction.",
      cards: "Provocations",
      crystal: "Contextual lens",
      yourSpell: "Your concept",
      desireCard: "Human desire",
      powerCard: "Interaction capability",
      draw: "Generate",
      read: "Consider",
      craftStep: "Describe",
      theCards: "the provocations",
      theCrystal: "the context",
      theSpell: "the concept",
      ether: "Provocation",
      disturb: "Apply a What If?",
      editSpell: "Edit this concept",
      saveSpell: "Save changes",
      craftAnother: "Develop another concept",
      studioMode: "Studio",
      seerMode: "Seer’s Table",
      modeHint: "Experience mode",
      lockedTitle: "This interaction problem is already in use",
      lockedBody: ["You have already developed concepts from this starting point. Changing it now would make the existing ideation record inconsistent.", "For a different direction, begin a new session. Your current ideation record will remain safely in your collection."],
      newSession: "New session",
      sessionList: "My sessions",
      print: "Print / Save PDF",
      deleteSession: "Delete this ideation record?",
      keepLocked: "Keep this interaction problem",
      newLocked: "Start a new session",
    },
  };

  function copy(key) {
    const mode = app.workspace?.interfaceMode || "seer";
    return COPY[mode]?.[key] ?? COPY.seer[key] ?? key;
  }

  function currentMode() {
    return app.workspace?.interfaceMode || "seer";
  }

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
      quandaryLocked: false,
      created: now(),
      updated: now(),
      status: "active",
    };
  }

  function defaultWorkspace() {
    const session = blankSession("The Untitled Grimoire");
    return { activeId: session.id, interfaceMode: "seer", sessions: [session] };
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
      base.quandaryLocked = Boolean(
        raw.quandaryLocked ??
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
      interfaceMode: data.interfaceMode === "studio" ? "studio" : "seer",
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

  function setMode(mode) {
    app.workspace.interfaceMode = mode === "studio" ? "studio" : "seer";
    scheduleSave();
    updateModeControl();
    refreshCurrentView();
  }

  function updateModeControl() {
    const switcher = $("#modeSwitch");
    const toggle = $("#modeToggle");
    // const modeName = $("#modeName");
    const studio = currentMode() === "studio";
    if (switcher) {
      switcher.setAttribute(
        "aria-label",
        `Experience mode. Current mode: ${studio ? "Classroom Experience" : "Thematic Experience"}.`
      );
    }
    if (toggle) {
      toggle.setAttribute("aria-checked", String(studio));
      toggle.setAttribute("aria-label", `Switch to ${studio ? "Thematic Experience" : "Classroom Experience"}`);
      toggle.classList.toggle("is-studio", studio);
    }
    // if (modeName) modeName.textContent = studio ? "Classroom Experience" : "Thematic Experience";
    const sessionModalTitle = $("#sessionsModalTitle");
    const newSessionLabel = $("#newSessionButtonLabel");
    const keepLockedLabel = $("#keepLockedLabel");
    const newLockedLabel = $("#newLockedLabel");
    if (sessionModalTitle) sessionModalTitle.textContent = copy("sessionList");
    if (newSessionLabel) newSessionLabel.textContent = copy("newSession");
    if (keepLockedLabel) keepLockedLabel.textContent = copy("keepLocked");
    if (newLockedLabel) newLockedLabel.textContent = copy("newLocked");

    const map = {
      toolsTitle: ["toolsTitle", "textContent"],
      bookLabel: ["bookButtonLabel", "textContent"],
      menuAria: ["menuButton", "aria-label"],
      bookAria: ["bookButton", "aria-label"],
      rename: ["renameSession", "textContent"],
      sessions: ["sessionsButton", "textContent"],
      export: ["exportButton", "textContent"],
      import: ["importButton", "textContent"],
      print: ["printButton", "textContent"],
      help: ["helpButton", "textContent"],
    };
    Object.entries(map).forEach(([key, [id, attr]]) => {
      const node = $("#" + id);
      if (!node) return;
      if (attr.startsWith("aria-")) node.setAttribute(attr, copy(key));
      else node[attr] = copy(key);
    });
    const drawerNotes = $$('[data-drawer-note]');
    if (drawerNotes[0]) {
      drawerNotes[0].textContent = studio
        ? "Use the controls below to manage your ideation record and move between explorations."
        : "Welcome to the Seer’s Table. Approach with your quandary and explore the possibilities that arise.";
    }
    if (drawerNotes[1]) {
      drawerNotes[1].textContent = studio
        ? "The activity uses playful prompts as a creative interlude within interaction design ideation."
        : "Use the tools below to manage your Grimoire, export your spell book, or learn more about how this works.";
    }
    const bookHeader = $("#bookDrawerTitle");
    if (bookHeader) bookHeader.textContent = copy("bookLabel");

    const lockedTitle = $("#quandaryLockedTitle");
    const lockedCopy = $("#quandaryLockedCopy");
    if (lockedTitle) lockedTitle.textContent = copy("lockedTitle");
    if (lockedCopy) lockedCopy.innerHTML = COPY[currentMode()].lockedBody.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");

    const helpTitle = $("#helpModalTitle");
    const helpBody = $("#helpModalBody");
    if (helpTitle) helpTitle.textContent = currentMode() === "studio" ? "How this works" : "How this works";
    if (helpBody) {
      helpBody.innerHTML = currentMode() === "studio"
        ? `<p>This is a playful ideation tool for DDES1150 Interaction Design. Bring an interaction problem, choose contextual factors, explore combinations of human desires and interaction capabilities, then describe the concepts you imagine.</p><p>Use the contextual lens and What If? provocations to develop variations. The tool never invents your concept for you; the thinking, sketching and decisions remain yours.</p>`
        : `<p>This is an experimental tool for exploring creative possibilities following David Rose's Enchanted Objects approach. You bring an interaction you would like to enchant. The Seer gives you strange combinations to think through. You sketch away from the screen, then record what you imagined.</p><p>Cards are ingredients in this space. You will look into the crystal ball to bring one of your own contextual details back into the spell. The Ether changes a spell you already made, allowing you to explore possibilities.</p><p>The Seer never invents your idea for you. Use it as an aid to your own ideation and creativity.</p>`;
    }
  }

  function refreshCurrentView() {
    switch (app.currentStage) {
      case "welcome": renderWelcome(); break;
      case "quandary": renderQuandary(); break;
      case "ingredients": renderIngredients(app.currentIngredientId && activeSession()?.ingredients.some(i => i.id === app.currentIngredientId) ? activeSession().ingredients.find(i => i.id === app.currentIngredientId)?.type : null); break;
      case "spell-table": renderSpellTable(); break;
      case "crystal-reading": renderSpellTable(); break;
      case "crafted": if (activeSpell()) renderCraftedSpell(activeSpell()); break;
      case "spell-detail": if (activeSpell()) openSavedSpell(activeSpell().id); break;
      case "spell-editor": if (activeSpell()) renderSpellEditor(activeSpell()); break;
      case "ether": if (activeSpell()) renderEther(); break;
      default: renderWelcome();
    }
  }

  function modeText(seerText, studioText) {
    return currentMode() === "studio" ? studioText : seerText;
  }

  function renderWelcome() {
    app.currentStage = "welcome";
    setPrompt(
      currentMode() === "studio" ? "Bring an interaction that needs another possibility." : "The table is quiet. Bring something with you.",
      `<button class="button button-primary" id="approachButton">${currentMode() === "studio" ? "Start ideation" : "Approach the table"}</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <div class="seer-mark" aria-hidden="true">✦</div>
          <p class="kicker">${currentMode() === "studio" ? "Interaction ideation" : "The Seer"}</p>
          <h1 class="title">${currentMode() === "studio" ? "There is another<br>way to approach it." : "There is another<br>way to see it."}</h1>
          <p class="subtitle">${esc((CONTENT.openingLines || [])[0] || "You have brought an interaction that needs another possibility.")}</p>
        </div>`;
      $("#approachButton").addEventListener("click", renderQuandary);
    });
  }

  function renderQuandary() {
    app.currentStage = "quandary";
    const s = activeSession();
    setPrompt(
      modeText("Tell the Seer what brought you here. No solution required yet.", "Describe the interaction you want to explore. No solution required yet."),
      `<button class="button button-primary" id="quandaryNext">${currentMode() === "studio" ? "Continue" : "Bring it to the table"}</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene narrow">
          <p class="kicker">${currentMode() === "studio" ? "Interaction problem" : "Bring your quandary"}</p>
          <h2 class="title" style="font-size:clamp(40px,6vw,68px)">${currentMode() === "studio" ? "What interaction<br>needs another possibility?" : "What interaction<br>needs another possibility?"}</h2>
          <div class="form-card">
            <label class="field"><span>${currentMode() === "studio" ? "Interaction" : "Your interaction"}</span><textarea id="interactionInput" rows="5" placeholder="e.g. Finding an available place to study on campus">${esc(s.interaction)}</textarea></label>
            <label class="field"><span>Where or when does it happen? <em>(optional)</em></span><input id="contextInput" value="${esc(s.context)}" placeholder="e.g. Between classes, around lunchtime, in the library"></label>
            <p class="edit-hint">${currentMode() === "studio" ? "You can edit this while the exploration is still open." : "You can edit this later from the Spell Book."}</p>
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
            modeText("Give the Seer a little more to work with.", "Give the interaction a little more definition before continuing."),
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
      modeText("Choose a few things that shape the interaction. You do not need everything.", "Choose a few contextual factors that matter. You do not need everything."),
      `<button class="button button-primary" id="ingredientsDone">${currentMode() === "studio" ? "Continue" : "Let the Seer look closer"}</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <p class="kicker">${currentMode() === "studio" ? "Contextual factors" : "Gather your ingredients"}</p>
          <h2 class="title" style="font-size:clamp(38px,5.8vw,66px)">${currentMode() === "studio" ? "What shapes the interaction?" : "What matters here?"}</h2>
          <p class="subtitle">${currentMode() === "studio" ? "Pick a few lenses. Briefly note how each one changes the interaction." : "Pick a few lenses. The Seer will help you start but you must fill in what each one changes."}</p>
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
            modeText("A couple of useful ingredients are enough to begin. Choose at least two.", "Choose at least two contextual factors to begin."),
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
          modeText("That is enough ingredients for now. Let the Seer work with them.", "That is enough context for now. Continue when you are ready."),
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
        <label class="field"><span>${currentMode() === "studio" ? "What changes because of this factor?" : "Your interaction"}</span><input id="factorInput" value="${esc(record.value)}" placeholder="${currentMode() === "studio" ? "Describe what changes here..." : "What is true here? Update this if needed."}"></label>
      </div>`;
    $("#factorInput").addEventListener("input", (e) => {
      record.value = e.target.value;
      scheduleSave();
      renderBook();
    });
    if (autofocus) setTimeout(() => $("#factorInput")?.focus(), 60);
    $$(".ingredient-card").forEach((c) => {
      const cardType = c.dataset.ingredient;
      const isSelected = s.ingredients.some((i) => i.type === cardType);
      const isEditing = cardType === type;

      c.classList.toggle("is-selected", isSelected);
      c.classList.toggle("is-editing", isEditing);
    });
    updateIngredientGate();
  }

  function syncIngredientCards(editingType = null) {
  const s = activeSession();
  if (!s) return;

  const selectedTypes = new Set(s.ingredients.map((i) => i.type));

  $$(".ingredient-card").forEach((card) => {
    const type = card.dataset.ingredient;
    card.classList.toggle("is-selected", selectedTypes.has(type));
    card.classList.toggle("is-editing", editingType === type);
  });
}

  function updateIngredientGate() {
  const s = activeSession();
  if (!s) return;

  const max = Number(SETTINGS.maxIngredientSelections || 5);
  const atLimit = s.ingredients.length >= max;

  $$(".ingredient-card").forEach((card) => {
    const selected = card.classList.contains("is-selected");

    card.classList.toggle("is-at-limit", atLimit && !selected);
    card.setAttribute(
      "aria-disabled",
      String(atLimit && !selected),
    );
  });
}

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
      currentMode() === "studio" ? "Start with the provocations, consider the context, then describe the concept." : "The Seer has laid the tools before you. Begin with the cards, then read the crystal ball, then shape your spell.",
      "",
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene spell-table-scene">
          <p class="kicker">${copy("seerTable")}</p>
          <h2 class="table-title">${copy("craft")}</h2>
          <div class="spell-steps" aria-label="Spellcraft steps">
            <div class="spell-step is-active" data-step="1"><span>1</span><strong>${copy("draw")}</strong><small>${copy("theCards")}</small></div>
            <div class="spell-step" data-step="2"><span>2</span><strong>${copy("read")}</strong><small>${copy("theCrystal")}</small></div>
            <div class="spell-step" data-step="3"><span>3</span><strong>${copy("craftStep")}</strong><small>${copy("theSpell")}</small></div>
          </div>
          <div class="spell-table">
            <section class="table-panel table-cards" aria-label="Spell cards">
              <p class="table-label">${copy("cards")}</p>
              <div class="draw-stack">
                <button class="draw-card ${app.drawnDesire ? "is-drawn" : ""}" id="desireCard" type="button" aria-label="${copy("draw")} ${copy("desireCard").toLowerCase()}">
                  <span class="card-face-back">${copy("desireCard")}</span>
                  <span class="card-face-result"></span>
                </button>
                <button class="draw-card ${app.drawnPower ? "is-drawn" : ""}" id="powerCard" type="button" aria-label="${copy("draw")} ${copy("powerCard").toLowerCase()}">
                  <span class="card-face-back">${copy("powerCard")}</span>
                  <span class="card-face-result"></span>
                </button>
              </div>
              <p class="table-hint">${currentMode() === "studio" ? "The prompts shape the direction. The concept is yours." : "The cards decide where to look. The idea is yours."}</p>
            </section>

            <section class="table-panel table-ball" aria-label="Crystal ball">
              <p class="table-label">${copy("crystal")}</p>
              <div class="ball-shell" id="ballShell">
                <div class="ball" id="crystalBall">
                  <span class="ball-ring r1"></span><span class="ball-ring r2"></span><span class="ball-ring r3"></span><span class="ball-ring r4"></span>
                  <div class="ball-core" id="ballCore">${currentMode() === "studio" ? "Awaiting the concept" : "Awaiting the spell"}</div>
                  <div class="ball-reading" id="ballReading"></div>
                </div>
              </div>
            </section>

            <section class="table-panel table-craft" aria-label="Spell crafting">
              <p class="table-label">${copy("yourSpell")}</p>
              <div id="craftPanel" class="craft-panel-empty">
                <p>${currentMode() === "studio" ? "The concept will take shape here." : "The spell will take shape here."}</p>
                <small>${currentMode() === "studio" ? "Generate both provocations and consider the contextual lens." : "Draw both cards and let the Seer look into the crystal ball."}</small>
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
      modeText("The cards have met. The Seer is looking for something from the world you brought in.", "The provocations are set. Use the contextual lens to shape the concept."),
      "",
    );
    $(".table-ball")?.classList.add("is-active-reading");
    core.textContent = "";
    read.innerHTML = `<em>${esc(data.label)}</em><strong>${esc(reading)}</strong><span>${esc(ingredient?.value || "This part of the situation has not been described yet.")}</span>`;
    read.classList.remove("is-visible");
    craft.innerHTML = `
      <div class="craft-context">
        <div class="craft-combination"><span>${esc(app.currentPair.desire.name)}</span><b>+</b><span>${esc(app.currentPair.power.name)}</span></div>
        <div class="craft-lens"><span>${currentMode() === "studio" ? "Contextual lens" : "Seen through"}</span><strong>${esc(data.label)}</strong></div>
        <label class="field"><span>${currentMode() === "studio" ? "Describe the concept" : "What did you imagine?"}</span><textarea id="ideaInput" rows="7" placeholder="${currentMode() === "studio" ? "Describe what the person does, what changes, and what happens next..." : "Describe what the person does, what changes, and what happens next..."}"></textarea></label>
        <label class="field"><span>${currentMode() === "studio" ? "Name your concept" : "Name your spell"} <em>(optional)</em></span><input id="spellName" placeholder="${currentMode() === "studio" ? "e.g. The Waiting Room" : "The Whispering Table"}"></label>
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
        modeText("The crystal ball has found its lens. Now give the spell a form of your own.", "The contextual lens is set. Now give the concept a form of your own."),
        `<button class="button button-primary" id="saveSpell">${currentMode() === "studio" ? "Save concept" : "Place the spell in the Grimoire"}</button>`,
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
        modeText("The Seer is waiting for the idea itself. Give the interaction a little more shape.", "The concept needs a little more shape before it can be saved."),
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
    s.quandaryLocked = true;
    app.currentSpellId = spell.id;
    scheduleSave();
    app.currentPair = null;
    app.currentIngredientId = null;
    app.currentSpellDraft = "";
    app.currentSpellName = "";
    renderCraftedSpell(spell);
  }

  function renderCraftedSpell(spell) {
    app.currentStage = "crafted";
    const ingredientDef = INGREDIENTS.find(
      (i) => i.id === spell.ingredient?.type,
    );
    setPrompt(
      currentMode() === "studio" ? "The concept is now recorded. You can develop it further or return to the ideation workspace." : "The spell is now written in your grimoire. You can disturb it or return to the Seer’s table.",
      `<button class="button button-secondary" id="openSpellFromCraft">${copy("editSpell")}</button><button class="button button-secondary" id="disturbSpell">${copy("disturb")}</button><button class="button button-primary" id="anotherSpell">${copy("craftAnother")}</button>`,
    );
    const craft = $("#craftPanel");
    if (craft) {
      craft.innerHTML = `
        <article class="crafted-spell-card">
          <span class="crafted-badge">${currentMode() === "studio" ? "Recorded in " : "Written in "}${esc(activeSession().name)}</span>
          <h3>${esc(spell.name)}</h3>
          <p>${esc(spell.idea)}</p>
          <div class="crafted-meta"><strong>${esc(spell.desire.name)} + ${esc(spell.power.name)}</strong><span>${currentMode() === "studio" ? "Contextual lens: " : "through "}${esc(ingredientDef?.label || "your context")}</span></div>
        </article>`;
    }
    $("#openSpellFromCraft").addEventListener("click", () => openSavedSpell(spell.id));
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
    const spellCountLabel = s.spells.length === 1 ? (currentMode() === "studio" ? "concept" : "spell") : (currentMode() === "studio" ? "concepts" : "spells");
    const spells = s.spells
      .map(
        (sp) => `
      <article class="book-card" data-open-spell="${esc(sp.id)}">
        <h3>${esc(sp.name)}</h3>
        <p>${esc(sp.idea)}</p>
        <div class="book-meta">${esc(sp.desire.name)} + ${esc(sp.power.name)} · ${sp.variations.length} ${sp.variations.length === 1 ? (currentMode() === "studio" ? "variation" : "variation") : (currentMode() === "studio" ? "variations" : "variations")}</div>
      </article>`,
      )
      .join("");
    const returnToTable = s.tableUnlocked
      ? `<button class="drawer-action" id="returnTableFromBook" type="button">${copy("returnTable")}</button>`
      : "";
    const quandaryAction = `<button class="drawer-action" id="editQuandaryFromBook" type="button">${copy("editQuandary")}</button>`;
    el.bookContent.innerHTML = `
      <section class="spell-section">
        <p class="book-title"><button class="drawer-action" id="renameFromBook" type="button">${esc(s.name)}</button></p>
        ${returnToTable}
      </section>
      <section class="spell-section">
        <h3>${copy("quandary")}${s.quandaryLocked ? ` <small class="book-status">${copy("set")}</small>` : ""}</h3>
        <p>${esc(s.interaction || (currentMode() === "studio" ? "Not started yet." : "Not started yet."))}</p>
        ${quandaryAction}
      </section>
      <section class="spell-section">
        <h3>${copy("ingredients")}</h3>
        <div class="book-ingredients">${s.ingredients.map((i) => `<button type="button" class="book-ingredient" data-edit-ingredient="${esc(i.type)}"><strong>${esc((INGREDIENTS.find((x) => x.id === i.type) || {}).label || i.label)}</strong><span>${esc(i.value || (currentMode() === "studio" ? "Add a detail" : "Add a detail"))}</span></button>`).join("") || '<p style="color:var(--muted)">No factors recorded yet.</p>'}</div>
        <button class="drawer-action" id="editIngredientsFromBook" type="button">${copy("editIngredients")}</button>
      </section>
      <section class="spell-section">
        <h3>${copy("spells")}</h3>
        <div class="spellbook-list">${spells || `<p style="color:var(--muted)">${currentMode() === "studio" ? "Your first concept will appear here." : "Your first spell will appear here."}</p>`}</div>
        ${s.spells.length ? `<small class="book-help">${s.spells.length} ${spellCountLabel} recorded. Open any one to edit or develop it further.</small>` : ""}
      </section>`;
    $("#renameFromBook")?.addEventListener("click", renameSession);
    $("#returnTableFromBook")?.addEventListener("click", () => {
      closeDrawers();
      beginSpell();
    });
    $("#editQuandaryFromBook")?.addEventListener("click", () => {
      if (s.quandaryLocked) {
        closeDrawers();
        openModal("quandaryLockedModal");
        return;
      }
      closeDrawers();
      renderQuandary();
    });
    $("#editIngredientsFromBook")?.addEventListener("click", () => {
      closeDrawers();
      renderIngredients();
    });
    $$('[data-edit-ingredient]').forEach((card) =>
      card.addEventListener('click', () => {
        const type = card.dataset.editIngredient;
        closeDrawers();
        renderIngredients(type);
      }),
    );
    $$('[data-open-spell]').forEach((card) =>
      card.addEventListener('click', () => openSavedSpell(card.dataset.openSpell)),
    );
  }

  function openSavedSpell(id) {
    const s = activeSession();
    const spell = s.spells.find((x) => x.id === id);
    if (!spell) return;
    app.currentSpellId = id;
    app.currentStage = "spell-detail";
    closeDrawers();
    setPrompt(
      currentMode() === "studio"
        ? "This concept can be edited, varied, or left to rest while you work on others."
        : "This spell is yours to revisit. Edit it, disturb it again, or return to the Seer’s table.",
      `<button class="button button-secondary" id="backToBook">${copy("bookLabel")}</button><button class="button button-secondary" id="editSavedSpell">${copy("editSpell")}</button><button class="button button-secondary" id="returnToTableFromSpell">${copy("returnTable")}</button><button class="button button-primary" id="disturbSaved">${copy("disturb")}</button>`,
    );
    transition(() => {
      const variations = spell.variations.length
        ? `<div class="variation-list">${spell.variations.map((v, i) => `<article class="idea-tile variation-tile"><small>${currentMode() === "studio" ? "Variation" : "Ether"} ${i + 1}</small><h3>${esc(v.ether?.text || "Variation")}</h3><p>${esc(v.response || "No response recorded yet.")}</p><div class="variation-actions"><button class="button button-secondary" type="button" data-edit-variation="${esc(v.id)}">${currentMode() === "studio" ? "Edit variation" : "Edit variation"}</button><button class="button button-secondary" type="button" data-delete-variation="${esc(v.id)}">Remove</button></div></article>`).join("")}</div>`
        : `<p class="edit-hint">${currentMode() === "studio" ? "No variations yet. Apply a What If? when you are ready." : "No variations yet. Pull from the Ether when you are ready."}</p>`;
      el.stage.innerHTML = `<div class="scene narrow spell-detail-scene"><p class="kicker">${currentMode() === "studio" ? "From the ideation record" : "From the Grimoire"}</p><h2 class="title" style="font-size:clamp(40px,6vw,72px)">${esc(spell.name)}</h2><div class="spell-detail-grid"><article class="idea-tile is-selected"><small>${esc(spell.desire.name)} + ${esc(spell.power.name)}</small><h3>${currentMode() === "studio" ? "Original concept" : "Original spell"}</h3><p>${esc(spell.idea)}</p><span class="book-meta">${currentMode() === "studio" ? "Contextual lens" : "Through"}: ${esc(ingredientLabel(spell, INGREDIENTS))}</span></article>${variations}</div></div>`;
      $("#backToBook").addEventListener("click", () => openDrawer("book"));
      $("#editSavedSpell").addEventListener("click", () => renderSpellEditor(spell));
      $("#returnToTableFromSpell").addEventListener("click", () => beginSpell());
      $("#disturbSaved").addEventListener("click", renderEther);
      $$('[data-edit-variation]').forEach((button) =>
        button.addEventListener("click", () => renderVariationEditor(spell.id, button.dataset.editVariation)),
      );
      $$('[data-delete-variation]').forEach((button) =>
        button.addEventListener("click", () => removeVariation(spell.id, button.dataset.deleteVariation)),
      );
    });
  }

  function findVariation(spell, id) {
    return spell?.variations.find((variation) => variation.id === id) || null;
  }

  function renderVariationEditor(spellId, variationId) {
    const s = activeSession();
    const spell = s?.spells.find((item) => item.id === spellId);
    const variation = findVariation(spell, variationId);
    if (!spell || !variation) return;
    app.currentSpellId = spell.id;
    app.currentStage = "variation-editor";
    setPrompt(
      modeText("Give this variation another form, then return it to the spell.", "Refine this variation without changing the original concept."),
      `<button class="button button-secondary" id="cancelVariationEdit">${currentMode() === "studio" ? "Cancel" : "Return to spell"}</button><button class="button button-primary" id="saveVariationEdit">Save variation</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `<div class="scene narrow"><p class="kicker">${currentMode() === "studio" ? "Edit variation" : "Edit variation"}</p><h2 class="title" style="font-size:clamp(38px,5.5vw,64px)">${esc(spell.name)}</h2><div class="form-card"><div class="variation-rule"><strong>${esc(variation.ether?.text || "Variation")}</strong><span>${esc(variation.ether?.nudge || "")}</span></div><label class="field"><span>${currentMode() === "studio" ? "Variation description" : "What changed?"}</span><textarea id="editVariationResponse" rows="8">${esc(variation.response)}</textarea></label></div></div>`;
      $("#cancelVariationEdit").addEventListener("click", () => openSavedSpell(spell.id));
      $("#saveVariationEdit").addEventListener("click", () => {
        const response = $("#editVariationResponse")?.value.trim() || "";
        if (!canContinue(response, SETTINGS.minIdeaLength || 20)) {
          return softNudge("saveVariationEdit", modeText("Give the variation enough shape that you can recognise it later.", "Give the variation enough detail that its change is clear."));
        }
        variation.response = response;
        variation.updated = now();
        spell.updated = now();
        scheduleSave();
        openSavedSpell(spell.id);
      });
    });
  }

  function removeVariation(spellId, variationId) {
    const s = activeSession();
    const spell = s?.spells.find((item) => item.id === spellId);
    if (!spell) return;
    const variation = findVariation(spell, variationId);
    if (!variation) return;
    const prompt = currentMode() === "studio"
      ? "Remove this variation from the concept? This cannot be undone."
      : "Let this variation fade from the grimoire? This cannot be undone.";
    if (!window.confirm(prompt)) return;
    spell.variations = spell.variations.filter((item) => item.id !== variationId);
    spell.updated = now();
    scheduleSave();
    openSavedSpell(spell.id);
  }

  function ingredientLabel(spell, defs = INGREDIENTS) {
    const item = defs.find((i) => i.id === spell?.ingredient?.type);
    return item?.label || spell?.ingredient?.type || "your context";
  }

  function renderSpellEditor(spell) {
    app.currentStage = "spell-editor";
    setPrompt(
      currentMode() === "studio" ? "Refine your concept without changing the provocation that started it." : "Refine the spell without changing the enchantment that created it.",
      `<button class="button button-secondary" id="cancelSpellEdit">${currentMode() === "studio" ? "Cancel" : "Return to spell"}</button><button class="button button-primary" id="saveSpellEdit">${copy("saveSpell")}</button>`,
    );
    transition(() => {
      el.stage.innerHTML = `<div class="scene narrow"><p class="kicker">${currentMode() === "studio" ? "Edit concept" : "Edit spell"}</p><h2 class="title" style="font-size:clamp(40px,6vw,68px)">${esc(spell.name)}</h2><div class="form-card"><label class="field"><span>${currentMode() === "studio" ? "Concept name" : "Spell name"}</span><input id="editSpellName" value="${esc(spell.name)}"></label><label class="field"><span>${currentMode() === "studio" ? "Concept description" : "Spell description"}</span><textarea id="editSpellIdea" rows="8">${esc(spell.idea)}</textarea></label><div class="craft-context"><div class="craft-combination"><span>${esc(spell.desire.name)}</span><b>+</b><span>${esc(spell.power.name)}</span></div><div class="craft-lens"><span>${currentMode() === "studio" ? "Contextual lens" : "Seen through"}</span><strong>${esc(ingredientLabel(spell))}</strong></div></div></div></div>`;
      $("#cancelSpellEdit").addEventListener("click", () => openSavedSpell(spell.id));
      $("#saveSpellEdit").addEventListener("click", () => {
        const name = $("#editSpellName")?.value.trim();
        const idea = $("#editSpellIdea")?.value.trim();
        if (!canContinue(idea, SETTINGS.minIdeaLength || 20)) return softNudge("saveSpellEdit", currentMode() === "studio" ? "Give the concept a little more shape before saving." : "Give the spell a little more shape before saving.");
        spell.name = name || spell.name;
        spell.idea = idea;
        spell.updated = now();
        scheduleSave();
        openSavedSpell(spell.id);
      });
    });
  }

  function renderEther() {
    const spell = activeSpell();
    if (!spell) return;
    app.currentStage = "ether";
    setPrompt(
      modeText("The Ether is stirring around this spell. Watch for what changes.", "A What If? provocation is about to disturb this concept."),
      "",
    );
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene ether-wrap">
          <p class="kicker">${currentMode() === "studio" ? "Concept variation" : "The Ether"}</p>
          <h2 class="title" style="font-size:clamp(38px,5.5vw,65px)">${esc(spell.name)}</h2>
          <div class="ether-source"><span>${esc(spell.idea)}</span></div>
          <div class="ether-window" id="etherWindow"><div class="ether-line" id="etherLine">…</div></div>
          <p class="ether-nudge" id="etherNudge">${currentMode() === "studio" ? "A constraint can open another direction." : "The spell is never quite finished."}</p>
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
      modeText("The Ether has altered one condition. Follow that change and give the variation a form.", "The What If? has altered one condition. Follow that change and describe the variation."),
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
        modeText("The Ether changed the spell. Give the variation enough shape that you can recognise it later.", "The provocation changed the concept. Give the variation enough shape that you can recognise it later."),
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
      modeText("The variation is written in the grimoire. You can disturb this spell again, return to the book, or return to the Seer’s table.", "The variation is saved. You can apply another provocation, return to the ideation record, or continue ideating."),
      `<button class="button button-secondary" id="bookAfterVariation">${copy("bookLabel")}</button><button class="button button-secondary" id="againAfterVariation">${copy("disturb")}</button><button class="button button-primary" id="tableAfterVariation">${copy("returnTable")}</button>`,
    );
    const wrap = $(".ether-wrap");
    if (!wrap) return;
    const capture = $(".ether-capture");
    if (capture)
      capture.innerHTML = `<div class="variation-saved"><span class="crafted-badge">${currentMode() === "studio" ? "Variation saved" : "Variation written"}</span><h3>${esc(last.ether.text)}</h3><p>${esc(last.response)}</p></div>`;
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

  function createNewGrimoire() {
    const defaultName = currentMode() === "studio" ? "Untitled Interaction Study" : "The Necronomicon";
    const name = window.prompt(currentMode() === "studio" ? "Name this session" : "Name this grimoire", defaultName);
    if (name === null) return;
    const fallbackName = currentMode() === "studio" ? "Untitled Interaction Study" : "The Untitled Grimoire";
    const s = blankSession(name.trim() || fallbackName);
    app.workspace.sessions.push(s);
    app.workspace.activeId = s.id;
    save();
    closeDrawers();
    closeModal("sessionsModal");
    closeModal("quandaryLockedModal");
    renderWelcome();
  }

  function renameSession() {
    const s = activeSession();
    const value = window.prompt(
      currentMode() === "studio" ? "Name your session" : "Name your grimoire",
      s.name || (currentMode() === "studio" ? "Untitled Interaction Study" : "The Untitled Grimoire"),
    );
    if (value === null) return;
    s.name = value.trim() || (currentMode() === "studio" ? "Untitled Interaction Study" : "The Untitled Grimoire");
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
          `<div class="session-row"><div><strong>${esc(s.name)}</strong><small>${s.spells.length} ${currentMode() === "studio" ? (s.spells.length === 1 ? "concept" : "concepts") : (s.spells.length === 1 ? "spell" : "spells")}</small></div><div class="session-actions"><button data-open-session="${esc(s.id)}">Open</button><button data-duplicate-session="${esc(s.id)}">Duplicate</button><button data-delete-session="${esc(s.id)}">Delete</button></div></div>`,
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
        if (!confirm(copy("deleteSession"))) return;
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
    a.download = currentMode() === "studio" ? "interaction-ideation-record.json" : "enchantment-spell-book.json";
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
      alert(currentMode() === "studio" ? "That file does not look like a compatible interaction ideation record." : "That file does not look like an Enchantment spell book.");
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
    updateModeControl();
    $("#modeToggle")?.addEventListener("click", () => {
      setMode(currentMode() === "studio" ? "seer" : "studio");
    });
    $("#modeToggle")?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") setMode("seer");
      if (event.key === "ArrowRight") setMode("studio");
    });
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
    $("#newSessionButton").addEventListener("click", createNewGrimoire);
    $("#newGrimoireFromLocked").addEventListener("click", createNewGrimoire);
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
