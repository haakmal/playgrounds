(() => {
  "use strict";
  const VERSION = "0.7.6",
    STORE = "systemsInsightState_v074";
  const TYPES = {
    observation: {
      label: "Observation",
      symbol: "○",
      prefix: "OB",
      className: "observation",
    },
    mutation: {
      label: "Mutation",
      symbol: "△",
      prefix: "MU",
      className: "mutation",
    },
    insight: {
      label: "Insight",
      symbol: "□",
      prefix: "IN",
      className: "insight",
    },
  };
  const CATEGORIES = [
    "People",
    "Activities",
    "Technologies",
    "Places",
    "Organisations",
    "Infrastructure",
    "Data",
    "Rules",
    "Resources",
    "Culture",
    "Power",
    "Environment",
  ];
  const SOURCES = [
    "Physical map",
    "Field notes",
    "Cultural probe",
    "Discussion",
    "Source material",
    "Other",
  ];
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const uid = (p) =>
    p +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 6);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const now = () => new Date().toISOString();
  function normalise(s) {
    s = s && typeof s === "object" ? s : {};
    const out = {
      entries: Array.isArray(s.entries) ? s.entries : [],
      connections: Array.isArray(s.connections) ? s.connections : [],
      threads: Array.isArray(s.threads) ? s.threads : [],
      readings: Array.isArray(s.readings) ? s.readings : [],
      history: Array.isArray(s.history) ? s.history : [],
      archived: Array.isArray(s.archived) ? s.archived : [],
    };
    out.entries = out.entries
      .filter((e) => e && typeof e === "object")
      .map((e) => {
        e = Object.assign(
          {
            id: uid("e"),
            title: "Untitled entry",
            source: "Other",
            detail: "",
            observe: "",
            analyse: "",
            categories: [],
          },
          e,
        );
        if (!TYPES[e.type]) {
          const p = String(e.key || "").slice(0, 2);
          e.type =
            p === "MU" ? "mutation" : p === "IN" ? "insight" : "observation";
        }
        if (!e.key) e.key = nextKey(e.type, out.entries, e.id);
        if (!Array.isArray(e.categories)) e.categories = [];
        return e;
      });
    out.threads = out.threads
      .filter((t) => t && typeof t === "object")
      .map((t) =>
        Object.assign(
          {
            id: uid("t"),
            name: "Unnamed thread",
            kind: "collection",
            entryIds: [],
            note: "",
          },
          t,
        ),
      )
      .map((t) => {
        t.entryIds = (Array.isArray(t.entryIds) ? t.entryIds : []).filter(
          (id) => out.entries.some((e) => e.id === id),
        );
        return t;
      });
    return out;
  }
  let state;
  try {
    state = normalise(JSON.parse(localStorage.getItem(STORE) || "null"));
  } catch (e) {
    state = normalise({});
  }
  let sessionName =
    localStorage.getItem("systemsInsightSessionName_v075") || "";
  let selectedId = state.entries[0]?.id || null,
    selectedThreadId = null,
    openTab = "input",
    filterType = "all",
    filterCat = "all",
    editingReadingId = null,
    threadNoteTarget = null;
  function persist() {
    localStorage.setItem(STORE, JSON.stringify(state));
  }
  function nextKey(type, arr = state.entries, ignore) {
    const t = TYPES[type] || TYPES.observation;
    let n = 1;
    while (
      arr.some(
        (e) =>
          e.id !== ignore &&
          e.key === `${t.prefix}-${String(n).padStart(2, "0")}`,
      )
    )
      n++;
    return `${t.prefix}-${String(n).padStart(2, "0")}`;
  }
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }
  function entry(id) {
    return state.entries.find((e) => e.id === id);
  }
  function activeEntries() {
    return state.entries.filter(
      (e) =>
        (filterType === "all" || e.type === filterType) &&
        (filterCat === "all" || e.categories.includes(filterCat)),
    );
  }
  function renderIndex() {
    const q = ($("#entrySearch")?.value || "").toLowerCase();
    $("#captureIndex").innerHTML =
      state.entries
        .filter(Boolean)
        .filter((e) => (e.title + " " + e.key).toLowerCase().includes(q))
        .map((e) => {
          const t = TYPES[e.type] || {
            className: "observation",
            symbol: "○",
            label: "Observation",
          };
          return `<button class="entry-item ${selectedId === e.id ? "selected" : ""}" data-entry="${e.id}"><span class="symbol ${t.className}">${t.symbol}</span><span><h4>${esc(e.key)} / ${esc(e.title)}</h4><small>${esc(t.label)} · ${esc(e.source)}</small></span></button>`;
        })
        .join("") || '<p class="muted">No entries match this search.</p>';
    $$("[data-entry]").forEach(
      (b) => (b.onclick = () => openEntry(b.dataset.entry)),
    );
  }
  function field(label, id, value, placeholder = "") {
    return `<label class="field-label">${label}</label><input class="field" id="${id}" value="${esc(value)}" placeholder="${placeholder}">`;
  }
  function area(label, id, value, placeholder = "") {
    return `<label class="field-label">${label}</label><textarea class="field" id="${id}" rows="4" placeholder="${placeholder}">${esc(value)}</textarea>`;
  }
  const PANEL_HINTS = {
    input: "Name and classify the data point.",
    observe: "Describe what is present, visible or recorded.",
    analyse: "Write your current reading of this entry.",
    connect: "Select related entries and name the relation.",
  };
  function panel(id, title, body) {
    return `<div class="panel-toggle"><div><b>${title}</b><p class="section-hint">${PANEL_HINTS[id] || ""}</p></div><span class="hint-icon" data-help="${PANEL_HINTS[id] || "Information about this section"}" title="${PANEL_HINTS[id] || "Information about this section"}">?</span></div><div class="panel-body">${body}</div>`;
  }
  function renderPanels() {
    const e = entry(selectedId);
    if (!e) return;
    const t = TYPES[e.type];
    const cats = CATEGORIES.map(
      (c) =>
        `<label class="pick-entry"><input type="checkbox" data-cat="${esc(c)}" ${e.categories.includes(c) ? "checked" : ""}><span>${esc(c)}</span></label>`,
    ).join("");
    const input = panel(
      "input",
      "INPUT",
      field("TITLE", "fTitle", e.title, "A specific, observable name") +
        `<div class="field-row"><div>${field("ENTRY TYPE", "fType", "")}</div><div>${field("SOURCE", "fSource", "")}</div></div><p class="hint">Use the fixed key family to identify the kind of record. Categories describe what is present; they do not interpret it.</p><div class="type-options">${Object.entries(
          TYPES,
        )
          .map(
            ([k, v]) =>
              `<button class="filter-chip ${e.type === k ? "active" : ""}" data-set-type="${k}">${v.symbol} ${v.label}</button>`,
          )
          .join("")}</div>`,
      openTab === "input",
    );
    const observe = panel(
      "observe",
      "OBSERVE",
      area(
        "WHAT IS RECORDED?",
        "fDetail",
        e.detail,
        "Describe the data point without explaining it.",
      ) +
        area(
          "WHAT ELSE IS VISIBLE?",
          "fObserve",
          e.observe,
          "Describe a relation, condition or absence you noticed.",
        ),
      openTab === "observe",
    );
    const analyse = panel(
      "analyse",
      "ANALYSE",
      `<p class="hint">Record your present reading of this entry. Leaving it incomplete is allowed.</p>` +
        area(
          "STUDENT READING",
          "fAnalyse",
          e.analyse,
          "What does this entry mean to your group?",
        ),
      openTab === "analyse",
    );
    const conns = state.connections.filter(
      (c) => c.from === e.id || c.to === e.id,
    );
    const others = state.entries.filter((x) => x.id !== e.id);
    const connect = panel(
      "connect",
      "CONNECT",
      `<p class="hint">Connections are optional and non-ordered. Select another entry and name the relation yourself.</p><input class="search" id="connectionSearch" placeholder="Filter entries to link"><div id="connectionChoices">${others.map((x) => `<label class="pick-entry"><input type="checkbox" data-connect="${x.id}"><span><b>${x.key}</b> ${esc(x.title)}<small>${x.categories.join(" · ")}</small></span></label>`).join("")}</div>${field("RELATION LABEL", "connectionLabel", "", "e.g. relies on, shifts, makes visible")}${area("RELATION NOTE", "connectionNote", "", "Optional context")}${
        conns.length
          ? '<p class="field-label">EXPLICIT CONNECTIONS</p>' +
            conns
              .map((c) => {
                const other = entry(c.from === e.id ? c.to : c.from);
                return `<div class="connection-row"><span>${other?.key || "Archived entry"} · ${esc(c.label || "Unnamed relation")}</span><button class="text-button" data-remove-connection="${c.id}">Remove</button></div>`;
              })
              .join("")
          : ""
      }`,
      openTab === "connect",
    );
    $("#capturePanelInput").innerHTML = input;
    $("#capturePanelObserve").innerHTML = observe;
    $("#capturePanelAnalyse").innerHTML = analyse;
    $("#capturePanelConnect").innerHTML = connect;
    $("#capturePanelInput").classList.add("open");
    $("#capturePanelObserve").classList.add("open");
    $("#capturePanelAnalyse").classList.add("open");
    $("#capturePanelConnect").classList.add("open");
    $("#fType").value = e.type;
    $("#fSource").value = e.source;
    bindPanels();
  }
  function bindPanels() {
    $$("[data-open]").forEach(
      (b) =>
        (b.onclick = () => {
          openTab = b.dataset.open;
          renderPanels();
        }),
    );
    $$("[data-set-type]").forEach(
      (b) =>
        (b.onclick = () => {
          entry(selectedId).type = b.dataset.setType;
          entry(selectedId).key = nextKey(
            entry(selectedId).type,
            state.entries,
            selectedId,
          );
          renderEditor();
        }),
    );
    $$("[data-cat]").forEach(
      (c) =>
        (c.onchange = () => {
          const e = entry(selectedId);
          e.categories = c.checked
            ? [...new Set([...e.categories, c.dataset.cat])]
            : e.categories.filter((x) => x !== c.dataset.cat);
        }),
    );
    const s = $("#connectionSearch");
    if (s)
      s.oninput = () => {
        $$("#connectionChoices .pick-entry").forEach(
          (x) =>
            (x.style.display = x.textContent
              .toLowerCase()
              .includes(s.value.toLowerCase())
              ? "flex"
              : "none"),
        );
      };
    $$("[data-remove-connection]").forEach(
      (b) =>
        (b.onclick = () => {
          state.connections = state.connections.filter(
            (c) => c.id !== b.dataset.removeConnection,
          );
          persist();
          renderPanels();
          toast("Connection removed");
        }),
    );
  }
  function renderEditor() {
    const e = entry(selectedId);
    if (!e) {
      $("#editor").classList.add("hidden");
      $("#captureEmpty").classList.remove("hidden");
      return;
    }
    $("#captureEmpty").classList.add("hidden");
    $("#editor").classList.remove("hidden");
    const t = TYPES[e.type] ||
      TYPES.observation || {
        label: "Observation",
        symbol: "○",
        className: "observation",
      };
    $("#captureLocation").textContent = e.key + " / " + t.label.toUpperCase();
    $("#entryCode").textContent = e.key + " / " + t.label.toUpperCase();
    $("#entryTitle").textContent = e.title || "New entry";
    $("#entrySymbol").textContent = t.symbol;
    $("#entrySymbol").className = "big-symbol " + t.className;
    $("#entrySource").textContent = e.source.toUpperCase();
    renderPanels();
    renderIndex();
  }
  function openEntry(id, tab = "input") {
    selectedId = id;
    openTab = tab;
    threadNoteTarget = null;
    renderEditor();
  }
  function newEntry() {
    const e = {
      id: uid("e"),
      key: nextKey("observation"),
      type: "observation",
      title: "",
      source: "Physical map",
      detail: "",
      observe: "",
      analyse: "",
      categories: [],
      createdAt: now(),
      updatedAt: now(),
    };
    state.entries.push(e);
    selectedId = e.id;
    openTab = "input";
    persist();
    renderEditor();
    toast("New local entry started");
  }
  function saveEntry() {
    const e = entry(selectedId);
    if (!e) return;
    const before = clone(e);
    e.title = $("#fTitle").value.trim() || "Untitled entry";
    e.type = $("#fType").value;
    e.source = $("#fSource").value;
    e.detail = $("#fDetail").value;
    e.observe = $("#fObserve").value;
    e.analyse = $("#fAnalyse").value;
    e.updatedAt = now();
    state.history.unshift({
      id: uid("h"),
      entryId: e.id,
      key: e.key,
      at: now(),
      before,
      after: clone(e),
    });
    const checks = $$("[data-connect]:checked");
    const label = $("#connectionLabel").value.trim();
    const note = $("#connectionNote").value.trim();
    checks.forEach((c) => {
      if (
        !state.connections.some(
          (x) =>
            (x.from === e.id && x.to === c.dataset.connect) ||
            (x.to === e.id && x.from === c.dataset.connect),
        )
      )
        state.connections.push({
          id: uid("c"),
          from: e.id,
          to: c.dataset.connect,
          label,
          note,
        });
    });
    persist();
    renderEditor();
    renderAtlas();
    toast("Entry saved locally");
  }
  function archiveEntry() {
    const e = entry(selectedId);
    if (!e) return;
    const affected = state.threads.filter((t) => t.entryIds.includes(e.id));
    if (
      !confirm(
        `Archive ${e.key}? It will be removed from active views and detached from ${affected.length} thread(s).`,
      )
    )
      return;
    state.archived.push({ kind: "entry", record: clone(e), archivedAt: now() });
    state.entries = state.entries.filter((x) => x.id !== e.id);
    state.connections = state.connections.filter(
      (c) => c.from !== e.id && c.to !== e.id,
    );
    state.threads.forEach(
      (t) => (t.entryIds = t.entryIds.filter((id) => id !== e.id)),
    );
    selectedId = null;
    persist();
    renderEditor();
    renderAtlas();
    toast("Entry archived");
  }
  function renderFilters() {
    const types =
      '<button class="filter-chip ' +
      (filterType === "all" ? "active" : "") +
      '" data-filter-type="all">All</button>' +
      Object.entries(TYPES)
        .map(
          ([k, v]) =>
            `<button class="filter-chip ${filterType === k ? "active" : ""}" data-filter-type="${k}">${v.symbol} ${v.label}</button>`,
        )
        .join("");
    $("#typeFilters").innerHTML = types;
    $("#catFilters").innerHTML =
      '<button class="filter-chip ' +
      (filterCat === "all" ? "active" : "") +
      '" data-filter-cat="all">All categories</button>' +
      CATEGORIES.map(
        (c) =>
          `<button class="filter-chip ${filterCat === c ? "active" : ""}" data-filter-cat="${esc(c)}">${esc(c)}</button>`,
      ).join("");
    $$("[data-filter-type]").forEach(
      (b) =>
        (b.onclick = () => {
          filterType = b.dataset.filterType;
          renderAtlas();
        }),
    );
    $$("[data-filter-cat]").forEach(
      (b) =>
        (b.onclick = () => {
          filterCat = b.dataset.filterCat;
          renderAtlas();
        }),
    );
  }
  function renderThreads() {
    const visible = activeEntries();
    const ids = new Set(visible.map((e) => e.id));
    const filtered = filterType !== "all" || filterCat !== "all";
    let overlaps = {};
    state.threads.forEach((t) =>
      t.entryIds
        .filter((id) => ids.has(id))
        .forEach((id) => (overlaps[id] = (overlaps[id] || 0) + 1)),
    );
    $("#threads").innerHTML =
      state.threads
        .map((t) => {
          const matches = t.entryIds.some((id) => ids.has(id));
          return `<article class="thread-card ${filtered ? (matches ? "focus-thread" : "muted-thread") : ""}" data-thread="${t.id}"><header><div><p class="eyebrow">${t.kind === "sequence" ? "SEQUENCE" : "COLLECTION"}</p><h3>${esc(t.name || "Unnamed thread")}</h3></div><button class="text-button" data-edit-thread="${t.id}">Edit</button></header><ul>${t.entryIds
            .map((id) => {
              const e = entry(id);
              if (!e) return "";
              const et = TYPES[e.type] || TYPES.observation;
              const hit = ids.has(id);
              return `<li class="thread-entry ${filtered ? (hit ? "focus-entry" : "muted-entry") : ""}"><button data-thread-entry="${id}">${et.symbol} ${e.key} · ${esc(e.title)}</button></li>`;
            })
            .join("")}</ul>${
            filtered &&
            Object.entries(overlaps)
              .filter(([id, n]) => n > 1 && t.entryIds.includes(id))
              .map(
                ([id, n]) =>
                  `<div class="overlap">${entry(id).key} also appears in ${n - 1} filtered thread${n > 2 ? "s" : ""}</div>`,
              )
              .join("")
          }<button class="thread-note-link" data-note="${t.id}">${t.note ? "Open thread note" : "Add thread note"}</button></article>`;
        })
        .join("") ||
      '<div class="panel" style="padding:20px">No threads yet. Create one and choose its entries.</div>';
    $$("[data-edit-thread]").forEach(
      (b) => (b.onclick = () => editThread(b.dataset.editThread)),
    );
    $$("[data-thread]").forEach(
      (b) =>
        (b.onclick = (e) => {
          if (e.target.closest("button")) return;
          editThread(b.dataset.thread);
        }),
    );
    $$("[data-thread-entry]").forEach(
      (b) => (b.onclick = () => openEntry(b.dataset.threadEntry)),
    );
    $$("[data-note]").forEach(
      (b) => (b.onclick = () => showThreadNote(b.dataset.note)),
    );
  }
  function showThreadNote(id) {
    const t = state.threads.find((x) => x.id === id);
    threadNoteTarget = id;
    const box = $("#threadNoteReadOnly");
    box.innerHTML = `<p class="eyebrow">THREAD NOTE / READ ONLY</p><h3>${esc(t.name)}</h3><p>${esc(t.note || "No note has been entered for this thread.")}</p><button class="outline" id="editNoteRoute">Edit thread record →</button>`;
    box.classList.remove("hidden");
    $("#editNoteRoute").onclick = () => routeNote(id);
  }
  function routeNote(id) {
    selectedThreadId = id;
    document.querySelector('[data-mode="atlas"]').click();
    renderThreadEditor();
  }
  function renderThreadEditor() {
    const t = state.threads.find((x) => x.id === selectedThreadId);
    const title = t ? "Edit thread" : "New thread";
    const chosen = new Set(t?.entryIds || []);
    $("#threadEditor").innerHTML =
      `<button class="panel-help" data-help="Name the linkage and explicitly select the entries that belong to it.">?</button><div class="editor-heading"><div><p class="eyebrow">THREAD EDITOR</p><h2>${title}</h2></div>${t ? `<button class="text-button" id="deleteThread">Delete</button>` : ""}</div>${field("THREAD NAME", "threadName", t?.name || "", "Give this linkage a name")}<label class="field-label">CHOOSE ENTRIES <em>(${chosen.size} selected)</em></label><input class="search" id="threadSearch" placeholder="Filter by key, title, category or source"><div class="thread-entry-picker">${state.entries
        .map((e) => {
          const et = TYPES[e.type] || TYPES.observation;
          return `<label class="pick-entry"><input type="checkbox" data-thread-pick="${e.id}" ${chosen.has(e.id) ? "checked" : ""}><span><b>${et.symbol} ${e.key}</b> ${esc(e.title)}<small>${e.categories.join(" · ")} · ${esc(e.source)}</small></span></label>`;
        })
        .join(
          "",
        )}</div><p class="hint">Select entries explicitly. An entry may be selected in multiple threads.</p><button class="dark full" id="saveThread">Save thread</button>`;
    $("#threadSearch").oninput = (e) =>
      $$("[data-thread-pick]").forEach(
        (x) =>
          (x.parentElement.style.display = x.parentElement.textContent
            .toLowerCase()
            .includes(e.target.value.toLowerCase())
            ? "flex"
            : "none"),
      );
    $("#saveThread").onclick = saveThread;
    if (t) $("#deleteThread").onclick = deleteThread;
  }
  function editThread(id) {
    selectedThreadId = id;
    renderThreadEditor();
  }
  function newThread() {
    selectedThreadId = null;
    renderThreadEditor();
    $("#threadEditor").scrollTop = 0;
  }
  function saveThread() {
    const name = $("#threadName").value.trim() || "Unnamed thread";
    const ids = $$("[data-thread-pick]:checked").map(
      (x) => x.dataset.threadPick,
    );
    if (selectedThreadId) {
      const t = state.threads.find((x) => x.id === selectedThreadId);
      state.history.unshift({
        id: uid("h"),
        threadId: t.id,
        at: now(),
        before: clone(t),
        after: { ...clone(t), name, entryIds: ids },
      });
      t.name = name;
      t.entryIds = ids;
    } else {
      const t = { id: uid("t"), name, entryIds: ids };
      state.threads.push(t);
      selectedThreadId = t.id;
    }
    persist();
    renderAtlas();
    toast("Thread saved locally");
  }
  function deleteThread() {
    if (
      !selectedThreadId ||
      !confirm("Delete this thread? Its entries will remain active.")
    )
      return;
    state.threads = state.threads.filter((t) => t.id !== selectedThreadId);
    selectedThreadId = null;
    persist();
    renderAtlas();
    toast("Thread deleted");
  }
  function renderReadings() {
    const r = state.readings;
    $("#readingCount").textContent = r.length
      ? `${r.length} timestamped reading${r.length > 1 ? "s" : ""} recorded.`
      : "No readings yet.";
    $("#readingList").innerHTML =
      r
        .map(
          (x) =>
            `<div class="reading-card"><p>${esc(x.text)}</p><small>${new Date(x.updatedAt || x.createdAt).toLocaleString()}</small><div class="reading-actions"><button class="text-button" data-edit-reading="${x.id}">Edit</button><button class="text-button" data-delete-reading="${x.id}">Delete</button></div></div>`,
        )
        .join("") || '<p class="muted">No readings recorded.</p>';
    $$("[data-edit-reading]").forEach(
      (b) => (b.onclick = () => editReading(b.dataset.editReading)),
    );
    $$("[data-delete-reading]").forEach(
      (b) =>
        (b.onclick = () => {
          state.readings = state.readings.filter(
            (x) => x.id !== b.dataset.deleteReading,
          );
          persist();
          renderReadings();
          toast("Reading deleted");
        }),
    );
  }
  function openDrawer() {
    renderReadings();
    $("#readingsDrawer").classList.add("open");
    $("#readingsDrawer").setAttribute("aria-hidden", "false");
  }
  function editReading(id) {
    editingReadingId = id;
    const r = state.readings.find((x) => x.id === id);
    $("#readingFormTitle").textContent = "Edit reading";
    $("#readingText").value = r.text;
    $("#cancelReading").classList.remove("hidden");
    openDrawer();
  }
  function resetReadingForm() {
    editingReadingId = null;
    $("#readingFormTitle").textContent = "Add reading";
    $("#readingText").value = "";
    $("#cancelReading").classList.add("hidden");
  }
  function saveReading(e) {
    e.preventDefault();
    const text = $("#readingText").value.trim();
    if (!text) return;
    if (editingReadingId) {
      const r = state.readings.find((x) => x.id === editingReadingId);
      r.text = text;
      r.updatedAt = now();
    } else
      state.readings.push({
        id: uid("r"),
        text,
        createdAt: now(),
        updatedAt: now(),
      });
    persist();
    resetReadingForm();
    renderReadings();
    toast("Reading saved locally");
  }
  function renderSequenceThreads() {
    const visible = activeEntries(),
      ids = new Set(visible.map((e) => e.id)),
      filtered = filterType !== "all" || filterCat !== "all";
    let overlaps = {};
    state.threads.forEach((t) =>
      t.entryIds
        .filter((id) => ids.has(id))
        .forEach((id) => (overlaps[id] = (overlaps[id] || 0) + 1)),
    );
    $("#threads").innerHTML =
      state.threads
        .map((t, i) => {
          const matches = t.entryIds.some((id) => ids.has(id));
          return `<article class="thread-sequence ${filtered ? (matches ? "focus-thread" : "muted-thread") : ""}" data-thread="${t.id}"><header><span class="sequence-number">${String(i + 1).padStart(2, "0")}</span><div><p class="eyebrow">${t.kind === "sequence" ? "SEQUENCE" : "COLLECTION"}</p><h3>${esc(t.name || "Unnamed thread")}</h3></div><button class="text-button" data-edit-thread="${t.id}">Edit</button></header><div class="sequence-flow">${t.entryIds
            .map((id) => {
              const e = entry(id);
              if (!e) return "";
              const et = TYPES[e.type] || TYPES.observation;
              return `<button class="sequence-node ${filtered ? (ids.has(id) ? "focus-entry" : "muted-entry") : ""}" data-thread-entry="${id}"><b>${et.symbol} ${e.key}</b><span>${esc(e.title)}</span></button>`;
            })
            .join('<span class="sequence-arrow">→</span>')}</div>${
            filtered &&
            t.entryIds
              .filter((id) => overlaps[id] > 1 && ids.has(id))
              .map(
                (id) =>
                  `<p class="overlap">${entry(id).key} appears in ${overlaps[id]} filtered threads</p>`,
              )
              .join("")
          }<button class="thread-note-link" data-note="${t.id}">${t.note ? "Open thread note" : "No thread note recorded"}</button></article>`;
        })
        .join("") ||
      '<div class="panel" style="padding:20px">No threads recorded. Create one and choose its entries.</div>';
    $$("[data-edit-thread]").forEach(
      (b) => (b.onclick = () => editThread(b.dataset.editThread)),
    );
    $$("[data-thread-entry]").forEach(
      (b) => (b.onclick = () => openEntry(b.dataset.threadEntry)),
    );
    $$("[data-note]").forEach(
      (b) => (b.onclick = () => showThreadNote(b.dataset.note)),
    );
  }
  function renderThreadDetails(id) {
    const t = state.threads.find((x) => x.id === id);
    if (!t) return;
    const box = $("#threadNoteReadOnly");
    box.innerHTML = `<p class="eyebrow">THREAD RECORD / READ ONLY</p><h3>${esc(t.name || "Unnamed thread")}</h3><p class="muted">The details below are drawn from the selected entries. Nothing here is inferred by the tool.</p>${t.entryIds
      .map((id) => {
        const e = entry(id);
        if (!e) return "";
        return `<section class="detail-entry"><strong>${TYPES[e.type]?.symbol || "○"} ${esc(e.key)} · ${esc(e.title)}</strong>${e.detail ? `<p><span class="detail-label">INPUT NOTE</span><br>${esc(e.detail)}</p>` : ""}${e.observe ? `<p><span class="detail-label">OBSERVE NOTE</span><br>${esc(e.observe)}</p>` : ""}${e.analyse ? `<p><span class="detail-label">ANALYSE NOTE</span><br>${esc(e.analyse)}</p>` : ""}</section>`;
      })
      .join("")}${(() => {
      const links = state.connections.filter(
        (c) => t.entryIds.includes(c.from) && t.entryIds.includes(c.to),
      );
      return links.length
        ? `<section class="detail-entry"><strong>EXPLICIT CONNECTION NOTES</strong>${links.map((c) => `<p>${esc(c.label || "Unnamed relation")}${c.note ? `<br>${esc(c.note)}` : ""}</p>`).join("")}</section>`
        : "";
    })()}`;
    box.classList.remove("hidden");
  }
  function showEntryPreview(id) {
    const e = entry(id);
    if (!e) return;
    const t = TYPES[e.type] || TYPES.observation;
    const box = $("#threadNoteReadOnly");
    box.innerHTML = `<p class="eyebrow">ENTRY NOTE / READ ONLY</p><h3>${t.symbol} ${esc(e.key)} · ${esc(e.title)}</h3>${e.detail ? `<p><span class="detail-label">INPUT NOTE</span><br>${esc(e.detail)}</p>` : ""}${e.observe ? `<p><span class="detail-label">OBSERVE NOTE</span><br>${esc(e.observe)}</p>` : ""}${e.analyse ? `<p><span class="detail-label">ANALYSE NOTE</span><br>${esc(e.analyse)}</p>` : ""}<p class="muted">Source: ${esc(e.source)}</p><button class="outline" id="editEntryRoute">Edit this entry in Capture →</button>`;
    box.classList.remove("hidden");
    $("#editEntryRoute").onclick = () => {
      showMode("capture");
      openEntry(id, "input");
    };
  }
  function renderSequenceThreadsV2() {
    const visible = activeEntries(),
      ids = new Set(visible.map((e) => e.id)),
      filtered = filterType !== "all" || filterCat !== "all";
    let overlaps = {};
    state.threads.forEach((t) =>
      t.entryIds
        .filter((id) => ids.has(id))
        .forEach((id) => (overlaps[id] = (overlaps[id] || 0) + 1)),
    );
    $("#threads").innerHTML =
      state.threads
        .map((t, i) => {
          const matches = t.entryIds.some((id) => ids.has(id));
          return `<article class="thread-sequence ${filtered ? (matches ? "focus-thread" : "muted-thread") : ""}" data-thread="${t.id}"><header><span class="sequence-number">${String(i + 1).padStart(2, "0")}</span><button class="thread-title-button" data-open-thread="${t.id}"><p class="eyebrow">THREAD</p><h3>${esc(t.name || "Unnamed thread")}</h3></button><button class="text-button" data-edit-thread="${t.id}">Edit</button></header><div class="sequence-flow">${t.entryIds
            .map((id) => {
              const e = entry(id);
              if (!e) return "";
              const et = TYPES[e.type] || TYPES.observation;
              return `<button class="sequence-node ${filtered ? (ids.has(id) ? "focus-entry" : "muted-entry") : ""}" data-thread-entry="${id}"><b>${et.symbol} ${e.key}</b><span>${esc(e.title)}</span></button>`;
            })
            .join('<span class="sequence-arrow">→</span>')}</div>${
            filtered &&
            t.entryIds
              .filter((id) => overlaps[id] > 1 && ids.has(id))
              .map(
                (id) =>
                  `<p class="overlap">${entry(id).key} appears in ${overlaps[id]} filtered threads</p>`,
              )
              .join("")
          }</article>`;
        })
        .join("") ||
      '<div class="panel" style="padding:20px">No threads recorded. Create one and choose its entries.</div>';
    $$("[data-edit-thread]").forEach(
      (b) => (b.onclick = () => editThread(b.dataset.editThread)),
    );
    $$("[data-open-thread]").forEach(
      (b) => (b.onclick = () => renderThreadDetails(b.dataset.openThread)),
    );
    $$("[data-thread-entry]").forEach(
      (b) => (b.onclick = () => showEntryPreview(b.dataset.threadEntry)),
    );
  }
  function renderAtlas() {
    renderFilters();
    renderSequenceThreadsV2();
    renderThreadEditor();
    renderReadings();
    $("#heroCount").textContent = state.entries.length;
    $("#filterStatus").textContent =
      filterType === "all" && filterCat === "all"
        ? "Showing all active entries"
        : `Focused view · ${activeEntries().length} matching entr${activeEntries().length === 1 ? "y" : "ies"}`;
    $("#recordTotal")?.remove();
  }
  function showMode(mode) {
    $$(".mode").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === mode),
    );
    $("#capture").classList.toggle("hidden", mode !== "capture");
    $("#atlas").classList.toggle("hidden", mode !== "atlas");
    if (mode === "atlas") renderAtlas();
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...state, sessionName, exportedAt: now(), version: VERSION },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "systems-insight-lab-0.7.6.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function renderHistory() {
    const active = state.entries || [],
      archived = (state.archived || []).filter(
        (x) => x.kind === "entry" && x.record,
      );
    $("#historyActiveCount").textContent = active.length;
    $("#historyArchivedCount").textContent = archived.length;
    $("#historyEventCount").textContent = state.history.length;
    $("#historyActive").innerHTML =
      active
        .map((e) => {
          const t = TYPES[e.type] || TYPES.observation;
          return `<div class="history-record"><div><b>${t.symbol} ${esc(e.key)}</b><span>${esc(e.title || "Untitled entry")}</span><small>Updated ${new Date(e.updatedAt || e.createdAt || Date.now()).toLocaleString()}</small></div><button class="text-button" data-history-archive="${e.id}">Remove</button></div>`;
        })
        .join("") || '<p class="muted">No active records.</p>';
    $("#historyArchived").innerHTML =
      archived
        .map((x, i) => {
          const e = x.record,
            t = TYPES[e.type] || TYPES.observation;
          return `<div class="history-record archived-record"><div><b>${t.symbol} ${esc(e.key)}</b><span>${esc(e.title || "Untitled entry")}</span><small>Removed ${new Date(x.archivedAt || Date.now()).toLocaleString()}</small></div><button class="text-button" data-history-restore="${i}">Restore</button></div>`;
        })
        .join("") || '<p class="muted">No removed records.</p>';
    $("#historyEvents").innerHTML =
      state.history
        .slice(0, 12)
        .map(
          (h) =>
            `<p class="history-event"><b>${esc(h.key || h.threadId || "Record")}</b> · ${new Date(h.at || Date.now()).toLocaleString()}</p>`,
        )
        .join("") || '<p class="muted">No edit events recorded.</p>';
    $$("[data-history-archive]").forEach(
      (b) => (b.onclick = () => archiveById(b.dataset.historyArchive)),
    );
    $$("[data-history-restore]").forEach(
      (b) =>
        (b.onclick = () => restoreByIndex(Number(b.dataset.historyRestore))),
    );
  }
  function archiveById(id) {
    selectedId = id;
    archiveEntry();
    renderHistory();
  }
  function restoreByIndex(i) {
    const records = state.archived.filter(
      (x) => x.kind === "entry" && x.record,
    );
    const item = records[i];
    if (!item) return;
    const index = state.archived.indexOf(item);
    state.archived.splice(index, 1);
    state.entries.push(item.record);
    persist();
    renderIndex();
    renderEditor();
    renderAtlas();
    renderHistory();
    toast("Record restored");
  }
  function openHistory() {
    renderHistory();
    $("#historyDrawer").classList.add("open");
    $("#historyDrawer").setAttribute("aria-hidden", "false");
  }
  $$(".mode").forEach((b) => (b.onclick = () => showMode(b.dataset.mode)));
  $("#newEntry").onclick = newEntry;
  $("#emptyNew").onclick = newEntry;
  $("#saveEntry").onclick = saveEntry;
  $("#archiveEntry").onclick = archiveEntry;
  $("#historyButton").onclick = openHistory;
  $("#entrySearch").oninput = renderIndex;
  $("#newThread").onclick = newThread;
  $("#readingButton").onclick = openDrawer;
  $("#closeDrawer").onclick = () =>
    $("#readingsDrawer").classList.remove("open");
  $("#closeHistory").onclick = () =>
    $("#historyDrawer").classList.remove("open");
  $("#cancelReading").onclick = resetReadingForm;
  $("#readingForm").onsubmit = saveReading;
  $("#clearFilters").onclick = () => {
    filterType = "all";
    filterCat = "all";
    renderAtlas();
  };
  function addUtility() {
    const bar = document.createElement("div");
    bar.className = "utility-bar";
    bar.innerHTML =
      '<button class="text-button" id="exportData">Export JSON</button><button class="text-button" id="importData">Import JSON</button><button class="text-button" id="resetDemo">Clear session</button>';
    $(".hero").append(bar);
    $("#exportData").onclick = exportData;
    $("#importData").onclick = () => $("#importFile").click();
    $("#resetDemo").onclick = () => {
      if (confirm("Clear all local records in this session?")) {
        state = normalise({});
        persist();
        sessionName = "";
        localStorage.removeItem("systemsInsightSessionName_v075");
        $("#sessionName").value = "";
        selectedId = null;
        renderIndex();
        renderEditor();
        renderAtlas();
        toast("Session cleared");
      }
    };
    $("#importFile").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          state = normalise(imported);
          sessionName = String(imported.sessionName || "");
          localStorage.setItem("systemsInsightSessionName_v075", sessionName);
          $("#sessionName").value = sessionName;
          persist();
          selectedId = null;
          renderIndex();
          renderEditor();
          renderAtlas();
          toast("JSON imported");
        } catch (err) {
          toast("Import failed: invalid JSON");
        }
      };
      reader.readAsText(f);
    };
  }
  addUtility();
  function restoreArchive() {
    if (!state.archived.length) {
      toast("Archive is empty");
      return;
    }
    const rows = state.archived
      .map(
        (x, i) =>
          `${i + 1}. ${x.record?.key || x.record?.name || "Record"} (${x.kind})`,
      )
      .join("\\n");
    const choice = prompt(
      "RESTORE ARCHIVED RECORD\\n\\n" +
        rows +
        "\\n\\nEnter a number to restore:",
    );
    const i = Number(choice) - 1;
    if (!Number.isInteger(i) || !state.archived[i]) return;
    const item = state.archived.splice(i, 1)[0];
    if (item.kind === "entry") state.entries.push(item.record);
    else if (item.kind === "thread") state.threads.push(item.record);
    persist();
    renderIndex();
    renderEditor();
    renderAtlas();
    toast("Record restored");
  }
  const archiveButton = document.createElement("button");
  archiveButton.className = "text-button";
  archiveButton.textContent = "History";
  archiveButton.onclick = openHistory;
  $(".utility-bar").append(archiveButton);
  function installHints() {
    const tip = document.createElement("div");
    tip.className = "help-tip";
    document.body.appendChild(tip);
    const hints = {
      "#newEntry":
        "Start a new entry from something already present in your physical map or notes.",
      "#emptyNew": "Create a blank record, then choose its type and source.",
      "#readingButton":
        "Open the separate log for timestamped student readings.",
      "#newThread":
        "Create a named linkage, then explicitly select the entries it contains.",
      "#clearFilters": "Return the Atlas to its complete active record.",
    };
    Object.entries(hints).forEach(([selector, text]) => {
      const el = $(selector);
      if (el) el.dataset.help = text;
    });
    function show(el, event) {
      if (!el.dataset.help) return;
      tip.textContent = el.dataset.help;
      tip.classList.add("show");
      tip.style.left =
        Math.min(event.clientX + 12, window.innerWidth - 275) + "px";
      tip.style.top =
        Math.min(event.clientY + 14, window.innerHeight - 70) + "px";
    }
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-help]");
      if (el) show(el, e);
    });
    document.addEventListener("mousemove", (e) => {
      const el = e.target.closest("[data-help]");
      if (el && tip.classList.contains("show")) show(el, e);
    });
    document.addEventListener("mouseout", (e) => {
      if (
        e.target.closest("[data-help]") &&
        !e.relatedTarget?.closest("[data-help]")
      )
        tip.classList.remove("show");
    });
  }
  $("#sessionName").value = sessionName;
  $("#sessionName").oninput = (e) => {
    sessionName = e.target.value;
    localStorage.setItem("systemsInsightSessionName_v075", sessionName);
  };
  $("#topHistory").onclick = openHistory;
  $("#toolboxButton").onclick = () => $("#toolboxDrawer").classList.add("open");
  $("#closeToolbox").onclick = () =>
    $("#toolboxDrawer").classList.remove("open");
  $("#exportTool").onclick = exportData;
  $("#importTool").onclick = () => $("#importFile").click();
  $("#clearTool").onclick = () => $("#resetDemo").click();
  $("#helpButton").onclick = () => {
    $("#helpModal").classList.add("open");
    $("#helpModal").setAttribute("aria-hidden", "false");
  };
  $("#closeHelp").onclick = () => {
    $("#helpModal").classList.remove("open");
    $("#helpModal").setAttribute("aria-hidden", "true");
  };
  renderIndex();
  renderEditor();
  showMode("capture");
  installHints();
  [
    "#newEntry",
    "#emptyNew",
    "#readingButton",
    "#newThread",
    "#clearFilters",
  ].forEach((s) => $(s)?.removeAttribute("data-help"));
})();
