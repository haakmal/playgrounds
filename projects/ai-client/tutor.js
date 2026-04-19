/* ============================================================
   tutor.js — Tutor Panel
   Design Brief AI Client
   ============================================================ */

// ── Default brief (mirrors DEFAULT_BRIEF in script.js) ───
const DEFAULT_BRIEF = {
  clientName:  "Alex Chen",
  clientTitle: "Creative Director, Spatial UX Lab",
  scenario: `The university has seen a 40% increase in visitor complaints about navigating between buildings. Current signage was designed in 2003 and does not account for accessibility needs or digital interaction points.`,
  requirements: [
    "Must work for first-time visitors unfamiliar with campus",
    "Must meet WCAG 2.1 AA accessibility standards",
    "Must integrate with the university's existing mobile app",
    "Physical touchpoints must be weather-resistant",
  ],
  constraints: [
    "Budget: $120,000 AUD total",
    "Timeline: 6-month delivery",
    "Cannot require structural modifications to heritage buildings",
  ],
  metrics: [
    "Reduce visitor complaints by 60%",
    "Navigation task completion < 3 minutes for a first-time visitor",
    "Positive result from an independent accessibility audit",
  ],
  intensity: 3,
};

// ── Intensity labels ──────────────────────────────────────
const INTENSITY_LABELS = {
  1: "Very warm and encouraging",
  2: "Warm and collaborative",
  3: "Professional and balanced",
  4: "Direct and demanding",
  5: "Very demanding and critical",
};

// ── Dynamic list helpers ──────────────────────────────────
function createListItem(value = "") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("dynamic-item");

  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("field-input");
  input.value = value;
  input.placeholder = "Enter item…";
  input.maxLength = 200;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.classList.add("btn-remove");
  removeBtn.setAttribute("aria-label", "Remove item");
  removeBtn.innerHTML = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  return wrapper;
}

function addItem(listId, value = "") {
  const list = document.getElementById(listId);
  list.appendChild(createListItem(value));
}

function getListValues(listId) {
  return Array.from(
    document.querySelectorAll(`#${listId} .field-input`)
  )
    .map((el) => el.value.trim())
    .filter(Boolean);
}

// ── Populate form from a brief object ────────────────────
function populateForm(b) {
  document.getElementById("input-client-name").value  = b.clientName  || "";
  document.getElementById("input-client-title").value = b.clientTitle || "";
  document.getElementById("input-scenario").value     = b.scenario    || "";

  // Clear and repopulate dynamic lists
  ["requirements-list", "constraints-list", "metrics-list"].forEach(
    (id) => (document.getElementById(id).innerHTML = "")
  );
  (b.requirements || []).forEach((v) => addItem("requirements-list", v));
  (b.constraints  || []).forEach((v) => addItem("constraints-list",  v));
  (b.metrics      || []).forEach((v) => addItem("metrics-list",      v));

  // Intensity
  const slider = document.getElementById("intensity-slider");
  slider.value = b.intensity || 3;
  updateIntensityLabel(slider.value);
}

// ── Load saved brief (or default) ────────────────────────
function loadSavedBrief() {
  try {
    const saved = localStorage.getItem("ai_client_brief");
    return saved ? { ...DEFAULT_BRIEF, ...JSON.parse(saved) } : DEFAULT_BRIEF;
  } catch {
    console.warn("Could not parse saved brief — loading default.");
    return DEFAULT_BRIEF;
  }
}

// ── Build brief object from form ──────────────────────────
function readForm() {
  return {
    clientName:   document.getElementById("input-client-name").value.trim(),
    clientTitle:  document.getElementById("input-client-title").value.trim(),
    scenario:     document.getElementById("input-scenario").value.trim(),
    requirements: getListValues("requirements-list"),
    constraints:  getListValues("constraints-list"),
    metrics:      getListValues("metrics-list"),
    intensity:    parseInt(document.getElementById("intensity-slider").value, 10),
  };
}

// ── Validate ──────────────────────────────────────────────
function validate(b) {
  if (!b.clientName)  return "Please enter a client name.";
  if (!b.clientTitle) return "Please enter a client title.";
  if (!b.scenario)    return "Please enter a scenario / context.";
  return null;
}

// ── Save ──────────────────────────────────────────────────
function saveBrief() {
  const b = readForm();
  const err = validate(b);
  if (err) { alert(err); return; }

  try {
    localStorage.setItem("ai_client_brief", JSON.stringify(b));
    showToast();
  } catch (e) {
    alert("Could not save to localStorage: " + e.message);
  }
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function showToast() {
  const toast = document.getElementById("save-toast");
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── Intensity label update ────────────────────────────────
function updateIntensityLabel(value) {
  document.getElementById("intensity-preview").textContent =
    INTENSITY_LABELS[value] || INTENSITY_LABELS[3];
}

// ── Clear student session ─────────────────────────────────
function clearStudentSession() {
  if (confirm("Clear the student session stored in this browser? This will reset the conversation history.")) {
    localStorage.removeItem("ai_client_session");
    showToast();
    document.getElementById("save-toast").textContent = "Student session cleared.";
  }
}

// ── Event listeners ───────────────────────────────────────
document.getElementById("save-btn").addEventListener("click", saveBrief);

document.getElementById("add-requirement").addEventListener("click", () =>
  addItem("requirements-list")
);
document.getElementById("add-constraint").addEventListener("click", () =>
  addItem("constraints-list")
);
document.getElementById("add-metric").addEventListener("click", () =>
  addItem("metrics-list")
);

document.getElementById("intensity-slider").addEventListener("input", (e) =>
  updateIntensityLabel(e.target.value)
);

document.getElementById("clear-session-btn").addEventListener("click", clearStudentSession);

// ── Save on Ctrl/Cmd+S ────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveBrief();
  }
});

// ── Init ──────────────────────────────────────────────────
(function init() {
  const brief = loadSavedBrief();
  populateForm(brief);
})();
