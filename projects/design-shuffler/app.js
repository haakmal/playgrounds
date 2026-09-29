(function () {
  "use strict";
  const data = {
    Need: [
      ["Learning", "A desire to understand or develop something."],
      ["Connection", "A desire to relate to or belong with others."],
      ["Care", "A need to support, protect, or maintain."],
      ["Navigation", "A need to find a way through a place or decision."],
      ["Expression", "A need to communicate identity, feeling, or meaning."],
    ],
    People: [
      ["Individual", "One person acts or decides alone."],
      ["Pair", "Two people share or negotiate the interaction."],
      ["Group", "Several people participate together."],
      ["Community", "People share a condition, place, or purpose."],
      ["Novice", "A person with limited experience of this interaction."],
    ],
    Activity: [
      ["Finding", "Searching for, locating, or recognising something."],
      ["Making", "Constructing, changing, or producing something."],
      ["Sharing", "Giving, receiving, or exchanging something."],
      ["Choosing", "Comparing possibilities and committing to one."],
      ["Coordinating", "Aligning actions, information, or timing."],
    ],
    Setting: [
      ["Private", "A personal or controlled space."],
      ["Public", "A place where the interaction is visible to others."],
      ["Institutional", "A setting shaped by an organisation or authority."],
      ["Temporary", "A brief or changing situation."],
      ["Unfamiliar", "A place or system with unknown expectations."],
    ],
    Form: [
      ["Physical", "Objects, materials, movement, or touch."],
      ["Digital", "A screen, interface, or digital response."],
      ["Spatial", "The arrangement of a place shapes the interaction."],
      ["Social", "People responding to one another are central."],
      ["Hybrid", "Physical, digital, spatial, and social parts work together."],
    ],
  };
  const keys = Object.keys(data),
    cards = document.querySelector("#cards"),
    historyList = document.querySelector("#historyList"),
    historySection = document.querySelector(".history"),
    historyCount = document.querySelector("#historyCount");
  let current = {},
    history = [],
    shuffleCount = 0;
  function card(key) {
    let el = document.createElement("article");
    el.className = "factor-card";
    el.innerHTML =
      "<h2>" +
      key +
      '</h2><select aria-label="' +
      key +
      '"></select><input class="custom" placeholder="Enter your own term" hidden><div class="card-bottom"><small>open</small><button class="lock">Lock</button></div>';
    let select = el.querySelector("select"),
      custom = el.querySelector(".custom"),
      lock = el.querySelector(".lock"),
      small = el.querySelector("small");
    data[key].forEach(([label, description]) => {
      let o = document.createElement("option");
      o.value = label;
      o.textContent = label;
      o.dataset.description = description;
      select.append(o);
    });
    let own = document.createElement("option");
    own.value = "__custom";
    own.textContent = "Custom term…";
    select.append(own);
    current[key] = { value: data[key][0][0], description: data[key][0][1], locked: false };
    function update() {
      if (select.value === "__custom") {
        custom.hidden = false;
        custom.focus();
        current[key].value = custom.value || "Custom term";
        current[key].description = "A student-defined condition.";
      } else {
        custom.hidden = true;
        let d = data[key].find((x) => x[0] === select.value);
        current[key].value = d[0];
        current[key].description = d[1];
      }
      el.classList.toggle("is-locked", current[key].locked);
      select.disabled = current[key].locked;
      custom.disabled = current[key].locked;
      lock.classList.toggle("active", current[key].locked);
      lock.textContent = current[key].locked ? "Unlock" : "Lock";
      small.textContent = current[key].locked ? "locked" : "open";
    }
    select.onchange = update;
    custom.oninput = () => {
      current[key].value = custom.value || "Custom term";
      current[key].description = "A student-defined condition.";
    };
    lock.onclick = () => {
      current[key].locked = !current[key].locked;
      update();
    };
    update();
    cards.append(el);
  }
  function render(shuffled = []) {
    keys.forEach((k) => {
      let el = cards.children[keys.indexOf(k)];
      el.classList.toggle("is-shuffled", shuffled.includes(k));
    });
  }
  function shuffle(mode) {
    let open = keys.filter((k) => !current[k].locked);
    if (!open.length) return;
    let chosen = mode === "one" ? [open[Math.floor(Math.random() * open.length)]] : open;
    let button = document.querySelector("#shuffle");
    button.classList.add("spinning");
    document.querySelector("#status").textContent = "Rearranging conditions…";
    setTimeout(() => {
      chosen.forEach((k) => {
        let list = data[k].filter((x) => x[0] !== current[k].value),
          next = list[Math.floor(Math.random() * list.length)];
        current[k].value = next[0];
        current[k].description = next[1];
        let select = cards.children[keys.indexOf(k)].querySelector("select");
        select.value = next[0];
        select.dispatchEvent(new Event("change"));
      });
      shuffleCount++;
      document.querySelector("#counter").textContent = "SHUFFLE " + String(shuffleCount).padStart(2, "0");
      document.querySelector("#status").textContent = "A new combination to consider";
      button.classList.remove("spinning");
      render(chosen);
      addHistory(chosen);
    }, 480);
  }
  function addHistory(changed) {
    let snapshot = { id: Date.now(), changed, values: Object.fromEntries(keys.map((k) => [k, current[k].value])) };
    history.unshift(snapshot);
    historyCount.textContent = history.length;
    let row = document.createElement("div");
    row.className = "history-entry";
    row.innerHTML =
      "<strong>Shuffle " +
      String(history.length).padStart(2, "0") +
      "</strong><div><p>" +
      keys.map((k) => snapshot.values[k]).join(" · ") +
      "</p><small>Changed: " +
      changed.join(", ") +
      '</small></div><div><button data-restore="' +
      snapshot.id +
      '">Restore</button><button data-remove="' +
      snapshot.id +
      '">Remove</button></div>';
    historyList.prepend(row);
    row.querySelector("[data-restore]").onclick = () => {
      keys.forEach((k) => {
        current[k].value = snapshot.values[k];
        cards.children[keys.indexOf(k)].querySelector("select").value = snapshot.values[k];
        cards.children[keys.indexOf(k)].querySelector("select").dispatchEvent(new Event("change"));
      });
      render(changed);
    };
    row.querySelector("[data-remove]").onclick = () => {
      row.remove();
      historyCount.textContent = historyList.children.length;
    };
  }
  document.querySelector("#shuffle").onclick = () => shuffle("all");
  document.querySelector("#one").onclick = () => shuffle("one");
  document.querySelector("#reset").onclick = () => {
    keys.forEach((k) => {
      current[k].locked = false;
      let s = cards.children[keys.indexOf(k)].querySelector("select");
      s.value = data[k][0][0];
      s.dispatchEvent(new Event("change"));
    });
    shuffleCount = 0;
    document.querySelector("#counter").textContent = "SHUFFLE 00";
    document.querySelector("#status").textContent = "Ready when you are";
    render([]);
  };
  document.querySelector("#historyToggle").onclick = () => historySection.classList.toggle("open");
  document.querySelector("#help").onclick = () => document.querySelector("#dialog").showModal();
  document.querySelector("#close").onclick = () => document.querySelector("#dialog").close();
  keys.forEach(card);
})();
