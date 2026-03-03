// script.js
// Constraint Cards Randomiser (data loaded from ./constraints.json)

(() => {
  "use strict";

  // --- DOM ---------------------------------------------------------------
  const elCards = document.getElementById("cards");
  const elHistory = document.getElementById("history");

  const elDrawBtn = document.getElementById("drawBtn");
  const elCopyBtn = document.getElementById("copyBtn");
  const elResetBtn = document.getElementById("resetBtn");

  const elCategory = document.getElementById("category");
  const elDrawCount = document.getElementById("drawCount");
  const elNoRepeats = document.getElementById("noRepeats");

  // --- Data --------------------------------------------------------------
  let DATA = null;      // category -> array of {title, desc}
  let ANY_POOL = [];    // flattened [{title, desc, category}, ...]

  // --- State -------------------------------------------------------------
  const state = {
    current: [],
    history: [], // newest first: {time: Date, items: []}
    usedKeys: new Set()
  };

  // --- Helpers -----------------------------------------------------------
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function keyFor(item) {
    return `${item.category}::${item.title}`;
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function getPool(selectedCategory) {
    if (!DATA) return [];

    if (selectedCategory === "Any Category") return ANY_POOL;

    const items = DATA[selectedCategory] ?? [];
    return items.map((it) => ({
      title: it.title,
      desc: it.desc,
      category: selectedCategory
    }));
  }

  async function loadConstraints() {
    const res = await fetch("./constraints.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load constraints.json (${res.status})`);
    DATA = await res.json();

    // Build flattened pool for "Any Category"
    ANY_POOL = [];
    for (const [category, items] of Object.entries(DATA)) {
      for (const item of items) {
        ANY_POOL.push({ title: item.title, desc: item.desc, category });
      }
    }
  }

  function populateCategorySelect() {
    if (!elCategory) return;

    elCategory.innerHTML = "";

    // "Any Category" first
    const optAny = document.createElement("option");
    optAny.value = "Any Category";
    optAny.textContent = "Any Category";
    elCategory.appendChild(optAny);

    // Then categories from JSON (preserve insertion order)
    for (const cat of Object.keys(DATA)) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      elCategory.appendChild(opt);
    }

    // Default to Any Category
    elCategory.value = "Any Category";
  }

  // --- Core --------------------------------------------------------------
  function drawConstraints() {
    if (!DATA) return;

    const category = elCategory?.value || "Any Category";
    const count = Math.max(1, Number(elDrawCount?.value || 1));
    const noRepeats = (elNoRepeats?.value || "on") === "on";

    const pool = getPool(category);
    if (!pool.length) return;

    const picked = [];
    const localUsed = new Set();

    let attempts = 0;
    const maxAttempts = 800;

    // First pass: respect "No Repeats" and avoid duplicates within the same draw.
    while (picked.length < count && attempts < maxAttempts) {
      attempts++;
      const item = pickRandom(pool);
      const k = keyFor(item);

      if (localUsed.has(k)) continue;
      if (noRepeats && state.usedKeys.has(k)) continue;

      picked.push(item);
      localUsed.add(k);
    }

    // Fallback: if pool is exhausted under no-repeats, allow repeats from history (still no dupes within draw).
    if (picked.length < count) {
      attempts = 0;
      while (picked.length < count && attempts < maxAttempts) {
        attempts++;
        const item = pickRandom(pool);
        const k = keyFor(item);

        if (localUsed.has(k)) continue;

        picked.push(item);
        localUsed.add(k);
      }
    }

    state.current = picked;
    picked.forEach((it) => state.usedKeys.add(keyFor(it)));

    state.history.unshift({
      time: new Date(),
      items: picked
    });

    // keep last 12 draw events
    state.history = state.history.slice(0, 12);

    render();
  }

  function render() {
    // Cards
    if (elCards) {
      elCards.innerHTML = "";

      if (!state.current.length) {
        elCards.innerHTML = `
          <div class="card">
            <div class="tag">Ready</div>
            <p class="constraint">Draw a constraint.</p>
            <p class="desc">Sketch how your concept exists when the constraint is non-negotiable.<br/>Press the "Random Constraint" button to start, or the space key.</p>
          </div>
        `;
      } else {
        for (const item of state.current) {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <div class="tag">${escapeHtml(item.category)}</div>
            <p class="constraint">${escapeHtml(item.title)}</p>
            <p class="desc">${escapeHtml(item.desc || "")}</p>
          `;
          elCards.appendChild(card);
        }
      }
    }

    // History
    if (elHistory) {
      elHistory.innerHTML = "";

      if (!state.history.length) {
        const none = document.createElement("div");
        none.className = "histItem";
        none.textContent = "No draws yet.";
        elHistory.appendChild(none);
      } else {
        for (const entry of state.history) {
          const stamp = entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          const div = document.createElement("div");
          div.className = "histItem";

          const lines = entry.items
            .map(
              (it) =>
                `• <b>${escapeHtml(it.title)}</b> <span style="color: var(--muted)">(${escapeHtml(
                  it.category
                )})</span>`
            )
            .join("<br/>");

          div.innerHTML = `<div style="margin-bottom:8px;color:var(--muted)">Draw @ ${escapeHtml(
            stamp
          )}</div>${lines}`;

          elHistory.appendChild(div);
        }
      }
    }
  }

  async function copyCurrent() {
    if (!state.current.length) return;

    const text = state.current
      .map((it) => `- ${it.title} (${it.category}): ${it.desc ?? ""}`.trim())
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      if (elCopyBtn) {
        const old = elCopyBtn.textContent;
        elCopyBtn.textContent = "Copied";
        window.setTimeout(() => (elCopyBtn.textContent = old || "Copy"), 900);
      }
    } catch {
      // Fallback prompt
      window.prompt("Copy these constraints:", text);
    }
  }

  function resetAll() {
  // Clear state
  state.current = [];
  state.history = [];
  state.usedKeys.clear();

  // Reset controls to defaults
  if (elCategory) elCategory.value = "Any Category";
  if (elDrawCount) elDrawCount.value = "1";
  if (elNoRepeats) elNoRepeats.value = "on";

  // Optional: collapse the options drawer if open
  const drawer = document.querySelector(".optionsDrawer");
  if (drawer && drawer.hasAttribute("open")) {
    drawer.removeAttribute("open");
  }

  render();
}

  function bindEvents() {
    elDrawBtn?.addEventListener("click", drawConstraints);
    elCopyBtn?.addEventListener("click", copyCurrent);
    elResetBtn?.addEventListener("click", resetAll);

    // Optional: Spacebar draws (unless user is focused on a control)
    window.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "select" || tag === "textarea" || tag === "button";
      if (!typing && e.code === "Space") {
        e.preventDefault();
        drawConstraints();
      }
    });

    // If options are changed, you may want to auto-redraw or just leave it.
    // Current behaviour: changes affect the next draw (not the current card).
  }

  // --- Init --------------------------------------------------------------
  async function init() {
    // basic presence checks (fail gracefully)
    if (!elCards || !elHistory || !elDrawBtn) {
      console.warn("Expected elements not found. Check your index.html ids.");
      return;
    }

    await loadConstraints();
    populateCategorySelect();
    bindEvents();
    render();
  }

  init().catch((err) => {
    console.error(err);

    if (elCards) {
      elCards.innerHTML = `
        <div class="card">
          <div class="tag">Error</div>
          <p class="constraint">Could not load constraints.json</p>
          <p class="desc">Check that constraints.json exists next to index.html and is being served correctly.</p>
        </div>
      `;
    }
  });
})();