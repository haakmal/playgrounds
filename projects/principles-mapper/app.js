(function () {
  "use strict";
  const KEY = "ddes1150-principles-map-v1",
    P = {
      Visibility: "What can the person perceive?",
      Feedback: "How does it respond?",
      Affordance: "What action appears possible?",
      Mapping: "How does the control relate to its outcome?",
      Constraints: "What actions are limited or guided?",
      Consistency: "Does it behave like similar things elsewhere?",
    };
  const $ = (s) => document.querySelector(s),
    F = {
      title: $("#interactionTitle"),
      context: $("#context"),
      notes: $("#notes"),
    },
    rows = $("#mapRows");
  let w = load() || make(),
    timer;
  function id() {
    return "map-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }
  function blankRow() {
    return {
      location: "",
      principle: "Visibility",
      description: "",
      change: "",
      signifiers: [""],
    };
  }
  function blankMap(name) {
    return {
      id: id(),
      name: name || "Untitled interaction",
      context: "",
      type: "Digital",
      notes: "",
      rows: [blankRow()],
      updated: Date.now(),
    };
  }
  function make() {
    let m = blankMap();
    return { activeId: m.id, maps: [m] };
  }
  function normalise(x) {
    if (!x || !Array.isArray(x.maps) || !x.maps.length) return null;
    let maps = x.maps.map((m) => ({
      id: m.id || id(),
      name: m.name || "Untitled interaction",
      context: m.context || "",
      type: m.type || "Digital",
      notes: m.notes || "",
      rows:
        Array.isArray(m.rows) && m.rows.length
          ? m.rows.map((r) =>
              Object.assign(blankRow(), r, {
                signifiers: Array.isArray(r.signifiers) && r.signifiers.length ? r.signifiers : [""],
              }),
            )
          : [blankRow()],
      updated: m.updated || Date.now(),
    }));
    return {
      activeId: maps.some((m) => m.id === x.activeId) ? x.activeId : maps[0].id,
      maps,
    };
  }
  function load() {
    try {
      return normalise(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {
      return null;
    }
  }
  function active() {
    return w.maps.find((m) => m.id === w.activeId) || w.maps[0];
  }
  function save() {
    active().updated = Date.now();
    localStorage.setItem(KEY, JSON.stringify(w));
    $("#saveStatus").textContent = "Saved locally";
  }
  function mark() {
    clearTimeout(timer);
    $("#saveStatus").textContent = "Saving…";
    timer = setTimeout(save, 350);
  }
  function render() {
    let m = active();
    F.title.value = m.name;
    F.context.value = m.context;
    F.notes.value = m.notes;
    $("#interactionType").value = m.type || "Digital";
    $("#activeMapName").textContent = m.name || "Untitled interaction";
    tabs();
    rows.innerHTML = "";
    m.rows.forEach((r, i) => rows.append(row(r, i)));
    saved();
  }
  function tabs() {
    let c = $("#mapTabs");
    c.innerHTML = "";
    w.maps.forEach((m) => {
      let t = document.createElement("div");
      t.className = "map-tab" + (m.id === w.activeId ? " is-active" : "");
      t.tabIndex = 0;
      let s = document.createElement("span");
      s.textContent = m.name;
      t.append(s);
      let x = document.createElement("button");
      x.className = "map-tab-close";
      x.textContent = "×";
      x.onclick = (e) => {
        e.stopPropagation();
        removeMap(m);
      };
      t.append(x);
      t.onclick = () => {
        w.activeId = m.id;
        render();
        save();
      };
      c.append(t);
    });
  }
  function row(r, i) {
    let tr = document.createElement("tr");
    tr.innerHTML =
      '<td><input class="location" placeholder="Screen, control, object, transition…"><button class="row-delete" type="button">Remove</button></td><td><select class="principle">' +
      Object.keys(P)
        .map((p) => "<option>" + p + "</option>")
        .join("") +
      '</select><small class="principle-help"></small><div class="signifier-box" hidden><label>Signifiers</label><div class="signifier-list"></div><button class="mini-add" type="button">+ Add signifier</button></div></td><td><textarea class="description" rows="4" placeholder="What do you observe here?"></textarea></td><td><textarea class="change" rows="4" placeholder="Optional…"></textarea></td>';
    tr.querySelector(".location").value = r.location || "";
    tr.querySelector(".principle").value = r.principle || "Visibility";
    tr.querySelector(".description").value = r.description || "";
    tr.querySelector(".change").value = r.change || "";
    tr.querySelector(".row-delete").hidden = active().rows.length < 2;
    let sel = tr.querySelector(".principle"),
      box = tr.querySelector(".signifier-box"),
      list = tr.querySelector(".signifier-list");
    function signs() {
      list.innerHTML = "";
      (r.signifiers && r.signifiers.length ? r.signifiers : [""]).forEach((v, j) => {
        let q = document.createElement("div");
        q.className = "signifier-row";
        q.innerHTML = '<input placeholder="What signals the action?"><button type="button">×</button>';
        q.querySelector("input").value = v;
        q.querySelector("input").oninput = (e) => {
          r.signifiers[j] = e.target.value;
          mark();
        };
        q.querySelector("button").onclick = () => {
          r.signifiers.splice(j, 1);
          if (!r.signifiers.length) r.signifiers.push("");
          signs();
          mark();
        };
        list.append(q);
      });
    }
    function update() {
      tr.querySelector(".principle-help").textContent = P[sel.value];
      box.hidden = sel.value !== "Affordance";
      if (sel.value === "Affordance") signs();
    }
    sel.onchange = () => {
      r.principle = sel.value;
      update();
      mark();
    };
    tr.querySelector(".mini-add").onclick = () => {
      r.signifiers.push("");
      signs();
      mark();
    };
    tr.querySelectorAll("textarea,.location").forEach(
      (e) =>
        (e.oninput = () => {
          r[e.className] = e.value;
          mark();
        }),
    );
    tr.querySelector(".row-delete").onclick = () => {
      active().rows.splice(i, 1);
      render();
      save();
    };
    update();
    return tr;
  }
  function newMap() {
    let n = prompt("Name this map", "Untitled interaction");
    if (n === null) return;
    let m = blankMap(n.trim() || "Untitled interaction");
    w.maps.push(m);
    w.activeId = m.id;
    render();
    save();
  }
  function duplicate() {
    let s = active(),
      n = prompt("Name the duplicate map", s.name + " copy");
    if (n === null) return;
    let c = JSON.parse(JSON.stringify(s));
    c.id = id();
    c.name = n.trim() || s.name + " copy";
    w.maps.push(c);
    w.activeId = c.id;
    render();
    save();
  }
  function rename(m) {
    let n = prompt("Rename this map", m.name);
    if (n === null) return;
    m.name = n.trim() || "Untitled interaction";
    render();
    save();
  }
  function removeMap(m) {
    if (w.maps.length === 1) {
      alert("Keep at least one map in this workspace.");
      return;
    }
    if (!confirm("Delete “" + m.name + "”?")) return;
    w.maps = w.maps.filter((x) => x.id !== m.id);
    if (w.activeId === m.id) w.activeId = w.maps[0].id;
    render();
    save();
  }
  function btn(text, fn, cl) {
    let b = document.createElement("button");
    b.className = "mini-button " + (cl || "");
    b.textContent = text;
    b.onclick = fn;
    return b;
  }
  function saved() {
    let c = $("#savedMapsList");
    c.innerHTML = "";
    w.maps.forEach((m) => {
      let d = document.createElement("div");
      d.className = "saved-map";
      d.innerHTML = '<div><div class="saved-map-name"></div><div class="saved-map-meta"></div></div><div class="saved-map-actions"></div>';
      d.querySelector(".saved-map-name").textContent = m.name;
      d.querySelector(".saved-map-meta").textContent = m.rows.length + " observations · edited " + new Date(m.updated).toLocaleDateString();
      let a = d.querySelector(".saved-map-actions");
      a.append(
        btn("Open", () => {
          w.activeId = m.id;
          render();
          save();
          $("#myMapsDialog").close();
        }),
        btn("Rename", () => rename(m)),
        btn("Duplicate", () => {
          w.activeId = m.id;
          duplicate();
        }),
        btn("Delete", () => removeMap(m), "delete"),
      );
      c.append(d);
    });
  }
  function esc(v) {
    return String(v || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[c],
    );
  }
  function exportJson() {
    save();
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(w, null, 2)], { type: "application/json" }));
    a.download = "interaction-principles-session.json";
    a.click();
  }
  function importJson() {
    $("#importFileInput").value = "";
    $("#importFileInput").click();
  }
  $("#importFileInput").onchange = (e) => {
    let f = e.target.files[0];
    if (!f) return;
    let r = new FileReader();
    r.onload = () => {
      try {
        let n = normalise(JSON.parse(r.result));
        if (!n) throw Error();
        if (!confirm("Import this session and replace the maps currently open?")) return;
        w = n;
        render();
        save();
      } catch (err) {
        alert("This file does not contain a valid Principles Map session.");
      }
    };
    r.readAsText(f);
  };
  function print() {
    const container = document.querySelector("#printMaps");

    container.innerHTML = w.maps
      .map(
        (m) => `
      <article class="print-map">
        <p class="eyebrow">Interaction Principles</p>
        <h2>${esc(m.name)}</h2>

        <div class="print-context">
          <p>
            <strong>Interaction type</strong><br>
            ${esc(m.type)}
          </p>

          <p>
            <strong>Scenario or context</strong><br>
            ${esc(m.context)}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Principle</th>
              <th>Description</th>
              <th>Change note</th>
            </tr>
          </thead>

          <tbody>
            ${m.rows
              .map(
                (r) => `
                  <tr>
                    <td>${esc(r.location)}</td>
                    <td>${esc(r.principle)}</td>
                    <td>${esc(r.description)}</td>
                    <td>${esc(r.change)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>

        <p>
          <strong>Working notes</strong><br>
          ${esc(m.notes)}
        </p>
      </article>
    `,
      )
      .join("");

    save();
    window.print();
  }
  F.title.oninput = () => {
    active().name = F.title.value || "Untitled interaction";
    $("#activeMapName").textContent = active().name;
    tabs();
    mark();
  };
  F.context.oninput = () => {
    active().context = F.context.value;
    mark();
  };
  F.notes.oninput = () => {
    active().notes = F.notes.value;
    mark();
  };
  $("#interactionType").onchange = () => {
    active().type = $("#interactionType").value;
    mark();
  };
  $("#addRowButton").onclick = () => {
    active().rows.push(blankRow());
    render();
    save();
  };
  $("#addMapButton").onclick = newMap;
  $("#duplicateButton").onclick = duplicate;
  $("#mapToolsButton").onclick = () => $("#mapToolsDialog").showModal();
  $("#myMapsButton").onclick = () => {
    $("#mapToolsDialog").close();
    saved();
    $("#myMapsDialog").showModal();
  };
  $("#newMapToolButton").onclick = () => {
    $("#mapToolsDialog").close();
    newMap();
  };
  $("#exportJsonButton").onclick = () => {
    $("#mapToolsDialog").close();
    exportJson();
  };
  $("#importJsonButton").onclick = () => {
    $("#mapToolsDialog").close();
    importJson();
  };
  $("#printToolButton").onclick = () => {
    $("#mapToolsDialog").close();
    print();
  };
  $("#dialogNewMapButton").onclick = () => {
    $("#myMapsDialog").close();
    newMap();
  };
  $("#dialogExportJsonButton").onclick = exportJson;
  $("#dialogImportJsonButton").onclick = importJson;
  $("#topPrintButton").onclick = print;
  $("#bottomPrintButton").onclick = print;
  $("#helpButton").onclick = () => $("#helpDialog").showModal();
  document.querySelectorAll("[data-close-dialog]").forEach((b) => (b.onclick = () => $("#" + b.dataset.closeDialog).close()));
  render();
  save();
})();
