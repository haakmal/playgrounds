const STORAGE_KEY = "moodleRubricMarker.v1";

const BANDS = [
  { key: "NONE", label: "Failed to meet criterion", short: "Fail criterion", midpoint: 0 },
  { key: "FL", label: "FL", short: "FL", midpoint: 30 },
  { key: "PS", label: "PS", short: "PS", midpoint: 60 },
  { key: "CR", label: "CR", short: "CR", midpoint: 70 },
  { key: "DN", label: "DN", short: "DN", midpoint: 80 },
  { key: "HD", label: "HD", short: "HD", midpoint: 90 },
  { key: "PERFECT", label: "Perfect application of criterion", short: "Perfect", midpoint: 100 },
];

const DEFAULT_CRITERIA = [
  { id: uid(), title: "Criterion 1", weight: 50 },
  { id: uid(), title: "Criterion 2", weight: 50 },
];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
}

function createAssignment(name = "Assessment 1") {
  return {
    id: uid(),
    name,
    weight: 100,
    criteria: structuredClone(DEFAULT_CRITERIA).map((c) => ({ ...c, id: uid() })),
    marks: {},
  };
}

function defaultState() {
  const assignment = createAssignment();
  return {
    className: "",
    students: [],
    selectedStudentId: null,
    assignments: [assignment],
    selectedAssignmentId: assignment.id,
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.assignments?.length) return defaultState();
    return migrateState(parsed);
  } catch {
    return defaultState();
  }
}

// Convert legacy assignment-owned rosters to a shared class roster.
function migrateState(data) {
  if (Array.isArray(data.students) && data.assignments.every((a) => a.marks && !Array.isArray(a.students))) return data;
  const students = [];
  const identity = new Map();
  const ids = new Set();
  let selectedStudentId = null;
  for (const a of data.assignments) {
    const marks = {};
    for (const st of a.students || []) {
      const key = st.studentId?.trim() ? `id:${st.studentId.trim().toLowerCase()}` : `name:${(st.name || "").trim().toLowerCase()}`;
      let id = identity.get(key);
      if (!id) {
        id = ids.has(st.id) ? uid() : st.id || uid();
        identity.set(key, id);
        ids.add(id);
        students.push({ id, name: st.name || "", studentId: st.studentId || "" });
      }
      marks[id] = { ...(st.marks || {}) };
      if (a.id === data.selectedAssignmentId && a.selectedStudentId === st.id) selectedStudentId = id;
    }
    a.marks = marks;
    delete a.students;
    delete a.selectedStudentId;
    if (!Number.isFinite(a.weight))
      a.weight = data.assignments.length === 1 ? 100 : Math.round((100 / data.assignments.length) * 100) / 100;
  }
  data.students = students;
  data.selectedStudentId = selectedStudentId || students[0]?.id || null;
  return data;
}
function manualMark(student, assignment = currentAssignment()) {
  const value = assignment.overrides?.[student.id];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}
function hasOverride(student, assignment = currentAssignment()) {
  return manualMark(student, assignment) !== null;
}
function annotatedMark(mark, overridden) {
  return formatMark(mark) + (overridden ? "*" : "");
}
function studentMarks(student, assignment = currentAssignment()) {
  return assignment.marks?.[student.id] || {};
}
function isComplete(student, assignment = currentAssignment()) {
  if (hasOverride(student, assignment)) return true;
  return (
    assignment.criteria.length > 0 &&
    Math.abs(totalWeight(assignment) - 100) < 0.000001 &&
    assignment.criteria.every((c) => bandByKey(studentMarks(student, assignment)[c.id]))
  );
}
function overallStudent(student) {
  const ready = state.assignments.length && state.assignments.every((a) => isComplete(student, a));
  const total = state.assignments.reduce((n, a) => n + ((Number(a.weight) || 0) * calculateStudent(student, a)) / 100, 0);
  return { ready: !!ready && Math.abs(totalAssessmentWeight() - 100) < 0.000001, mark: Math.round(total * 100) / 100 };
}
function totalAssessmentWeight() {
  return state.assignments.reduce((n, a) => n + (Number(a.weight) || 0), 0);
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const status = document.querySelector("#saveStatus");
    if (status) status.textContent = "Saved locally in this browser";
  } catch (error) {
    const status = document.querySelector("#saveStatus");
    if (status) status.textContent = "Unable to save — export your data";
    console.error("Local storage save failed:", error);
  }
}

function currentAssignment() {
  return state.assignments.find((a) => a.id === state.selectedAssignmentId) || state.assignments[0];
}

function currentStudent() {
  const assignment = currentAssignment();
  return state.students.find((s) => s.id === state.selectedStudentId) || null;
}

function totalWeight(assignment = currentAssignment()) {
  return assignment.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
}

function bandByKey(key) {
  return BANDS.find((b) => b.key === key) || null;
}

function calculateStudent(student, assignment = currentAssignment()) {
  const manual = manualMark(student, assignment);
  if (manual !== null) return manual;
  const total = assignment.criteria.reduce((sum, criterion) => {
    const key = studentMarks(student, assignment)[criterion.id];
    const band = bandByKey(key);
    if (!band) return sum;
    return sum + (band.midpoint * (Number(criterion.weight) || 0)) / 100;
  }, 0);

  return Math.round((total + Number.EPSILON) * 100) / 100;
}

function gradeForMark(mark) {
  if (mark >= 85) return "HD";
  if (mark >= 75) return "DN";
  if (mark >= 65) return "CR";
  if (mark >= 50) return "PS";
  return "FL";
}

function formatMark(mark) {
  if (Number.isInteger(mark)) return String(mark);
  return mark.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

const els = {
  className: document.querySelector("#className"),
  assignmentName: document.querySelector("#assignmentName"),
  assignmentSelect: document.querySelector("#assignmentSelect"),
  newAssignmentBtn: document.querySelector("#newAssignmentBtn"),
  deleteAssignmentBtn: document.querySelector("#deleteAssignmentBtn"),
  criteriaList: document.querySelector("#criteriaList"),
  criterionTemplate: document.querySelector("#criterionTemplate"),
  addCriterionBtn: document.querySelector("#addCriterionBtn"),
  weightTotal: document.querySelector("#weightTotal"),
  criteriaWarning: document.querySelector("#criteriaWarning"),
  studentName: document.querySelector("#studentName"),
  studentId: document.querySelector("#studentId"),
  addStudentBtn: document.querySelector("#addStudentBtn"),
  studentTableBody: document.querySelector("#studentTableBody"),
  markingTitle: document.querySelector("#markingTitle"),
  markingEmpty: document.querySelector("#markingEmpty"),
  markingContent: document.querySelector("#markingContent"),
  markingCriteria: document.querySelector("#markingCriteria"),
  overallMark: document.querySelector("#overallMark"),
  overallGrade: document.querySelector("#overallGrade"),
  printClass: document.querySelector("#printClass"),
  printAssignment: document.querySelector("#printAssignment"),
  printStudent: document.querySelector("#printStudent"),
  printStudentId: document.querySelector("#printStudentId"),
  bandReference: document.querySelector("#bandReference"),
  printBtn: document.querySelector("#printBtn"),
  resetBtn: document.querySelector("#resetBtn"),
};

function render() {
  const assignment = currentAssignment();

  els.className.value = state.className || "";
  els.assignmentName.value = assignment.name || "";

  els.assignmentSelect.innerHTML = state.assignments
    .map(
      (a) => `<option value="${a.id}" ${a.id === assignment.id ? "selected" : ""}>${escapeHtml(a.name || "Untitled assessment")}</option>`,
    )
    .join("");

  els.deleteAssignmentBtn.disabled = state.assignments.length <= 1;
  const printSelect = document.querySelector("#printScope");
  const priorScope = printSelect.value;
  printSelect.innerHTML =
    `<option value="current">Current assessment</option><option value="all">Class summary (all assessments)</option>` +
    state.assignments.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
  if ([...printSelect.options].some((option) => option.value === priorScope)) printSelect.value = priorScope;

  renderCriteria();
  renderStudents();
  renderMarking();
  renderBandReference();
  renderAssessmentWeightStatus();
}

function renderCriteria() {
  const assignment = currentAssignment();
  els.criteriaList.innerHTML = "";

  assignment.criteria.forEach((criterion) => {
    const node = els.criterionTemplate.content.firstElementChild.cloneNode(true);
    const title = node.querySelector(".criterion-title");
    const weight = node.querySelector(".criterion-weight");
    const remove = node.querySelector(".remove-criterion");

    title.value = criterion.title;
    weight.value = criterion.weight;

    title.addEventListener("input", () => {
      criterion.title = title.value;
      saveState();
      renderMarking();
    });

    weight.addEventListener("input", () => {
      criterion.weight = Math.max(0, Math.min(100, Number(weight.value) || 0));
      saveState();
      renderWeightStatus();
      renderStudents();
      renderMarking();
    });

    remove.addEventListener("click", () => {
      assignment.criteria = assignment.criteria.filter((c) => c.id !== criterion.id);
      Object.values(assignment.marks).forEach((marks) => {
        delete marks[criterion.id];
      });
      saveState();
      render();
    });

    els.criteriaList.appendChild(node);
  });

  renderWeightStatus();
}

function renderWeightStatus() {
  const total = totalWeight();
  els.weightTotal.textContent = `${formatMark(total)} / 100%`;
  els.weightTotal.classList.toggle("invalid", total !== 100);
  els.criteriaWarning.hidden = total === 100;
}

function renderStudents() {
  const assignment = currentAssignment();
  els.studentTableBody.innerHTML = "";

  if (!state.students.length) {
    els.studentTableBody.innerHTML = `<tr><td colspan="5" class="section-note">No students added yet.</td></tr>`;
    return;
  }

  state.students.forEach((student) => {
    const completed = isComplete(student, assignment);
    const mark = completed ? calculateStudent(student, assignment) : null;
    const row = document.createElement("tr");
    if (student.id === state.selectedStudentId) {
      row.classList.add("active");
      row.setAttribute("aria-selected", "true");
    }
    row.innerHTML = `
      <td>${escapeHtml(student.name || "Unnamed student")}</td>
      <td>${escapeHtml(student.studentId || "—")}</td>
      <td class="numeric">${mark === null ? "—" : annotatedMark(mark, hasOverride(student, assignment))}</td>
      <td>${mark === null ? "In progress" : gradeForMark(mark) + (hasOverride(student, assignment) ? "*" : "")}</td>
      <td><div class="row-actions"><button type="button" class="remove-student danger" aria-label="Remove student" title="Remove student">×</button></div></td>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.closest(".remove-student")) return;
      state.selectedStudentId = student.id;
      saveState();
      renderStudents();
      renderMarking();
    });

    row.querySelector(".remove-student").addEventListener("click", (e) => {
      e.stopPropagation();
      const studentLabel = student.name || student.studentId || "this student";
      if (
        !confirm(
          `Remove “${studentLabel}” from the class roster? This will permanently delete their marks and manual overrides across all assessments. Export your session first if you need a backup.`,
        )
      )
        return;
      state.students = state.students.filter((s) => s.id !== student.id);
      state.assignments.forEach((a) => {
        delete a.marks[student.id];
        if (a.overrides) delete a.overrides[student.id];
      });
      if (state.selectedStudentId === student.id) state.selectedStudentId = state.students[0]?.id || null;
      saveState();
      renderStudents();
      renderMarking();
    });

    els.studentTableBody.appendChild(row);
  });
}

function renderMarking() {
  const assignment = currentAssignment();
  const student = currentStudent();

  if (!student) {
    els.markingTitle.textContent = "Select a student";
    els.markingEmpty.hidden = false;
    els.markingContent.hidden = true;
    els.overallMark.textContent = "—";
    els.overallGrade.textContent = "—";
    document.getElementById("overrideControls").hidden = true;
    closeInlineMarkEditor();
    return;
  }

  const completed = isComplete(student, assignment);
  const mark = calculateStudent(student, assignment);
  els.markingTitle.textContent = student.name || student.studentId || "Selected student";
  els.markingEmpty.hidden = true;
  els.markingContent.hidden = false;
  // The marking workspace previews the accumulated rubric mark as bands are selected.
  // A preview does not make an incomplete rubric a final grade in the roster,
  // analytics, print record or combined assessment result.
  const selectedCount = assignment.criteria.filter((c) => bandByKey(studentMarks(student, assignment)[c.id])).length;
  const hasCalculatedResult = hasOverride(student, assignment) || selectedCount > 0;
  els.overallMark.textContent = hasCalculatedResult ? annotatedMark(mark, hasOverride(student, assignment)) : "—";
  els.overallGrade.textContent = completed
    ? gradeForMark(mark)
    : hasCalculatedResult
      ? `${gradeForMark(mark)} · In progress`
      : "In progress";
  updateOverrideControls(student, assignment);
  els.printClass.textContent = state.className || "—";
  els.printAssignment.textContent = assignment.name || "—";
  els.printStudent.textContent = student.name || "—";
  els.printStudentId.textContent = student.studentId || "—";

  renderPriorMarks(student);
  els.markingCriteria.innerHTML = "";
  assignment.criteria.forEach((criterion) => {
    const selected = studentMarks(student, assignment)[criterion.id] || "";
    const selectedBand = bandByKey(selected);
    const contribution = selectedBand ? (selectedBand.midpoint * (Number(criterion.weight) || 0)) / 100 : 0;

    const item = document.createElement("section");
    item.className = "marking-item" + (hasOverride(student, assignment) ? " rubric-suspended" : "");
    item.innerHTML = `
      <div class="marking-item-head">
        <div class="marking-item-title">${escapeHtml(criterion.title || "Untitled criterion")}</div>
        <div class="marking-item-weight">${formatMark(Number(criterion.weight) || 0)}%</div>
        <div class="marking-item-score">${selectedBand ? `${selectedBand.midpoint} × ${formatMark(Number(criterion.weight) || 0)}% = ${formatMark(contribution)}` : "Not marked"}</div>
      </div>
      <div class="band-options" role="radiogroup" aria-label="${escapeHtml(criterion.title || "Criterion")} band"></div>
    `;

    const options = item.querySelector(".band-options");
    BANDS.forEach((band) => {
      const option = document.createElement("label");
      option.className = `band-option band-${band.key.toLowerCase()}`;
      option.innerHTML = `
        <input type="radio" name="band-${criterion.id}" value="${band.key}" ${selected === band.key ? "checked" : ""}>
        <span>
          <strong class="band-code">${escapeHtml(band.short)}</strong>
          <span class="band-midpoint">${band.midpoint}</span>
        </span>
      `;
      option.querySelector("input").disabled = hasOverride(student, assignment);
      // Clicking the currently selected band clears it (radio inputs do not
      // normally fire change when clicked again). Preserve the other bands.
      if (selected === band.key && !hasOverride(student, assignment)) {
        option.addEventListener("click", (event) => {
          event.preventDefault();
          assignment.marks[student.id] ||= {};
          delete assignment.marks[student.id][criterion.id];
          saveState();
          renderStudents();
          renderMarking();
        });
      }
      option.querySelector("input").addEventListener("change", () => {
        assignment.marks[student.id] ||= {};
        assignment.marks[student.id][criterion.id] = band.key;
        saveState();
        renderStudents();
        renderMarking();
      });
      options.appendChild(option);
    });

    els.markingCriteria.appendChild(item);
  });
}

function renderBandReference() {
  if (!els.bandReference) return;
  els.bandReference.innerHTML = BANDS.map(
    (b) => `
    <div class="reference-band">
      <strong>${escapeHtml(b.label)}</strong>
      <span>${b.midpoint}</span>
    </div>
  `,
  ).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[ch],
  );
}

els.className.addEventListener("input", () => {
  state.className = els.className.value;
  saveState();
  if (currentStudent()) els.printClass.textContent = state.className || "—";
});

els.assignmentName.addEventListener("input", () => {
  currentAssignment().name = els.assignmentName.value;
  saveState();
  renderStudents();
  renderMarking();
  const selectedOption = els.assignmentSelect.querySelector(`option[value="${currentAssignment().id}"]`);
  if (selectedOption) selectedOption.textContent = currentAssignment().name || "Untitled assessment";
});

els.assignmentSelect.addEventListener("change", () => {
  state.selectedAssignmentId = els.assignmentSelect.value;
  saveState();
  render();
});

els.newAssignmentBtn.addEventListener("click", () => {
  const assignment = createAssignment(`Assessment ${state.assignments.length + 1}`);
  assignment.weight = Math.max(0, Math.round((100 - totalAssessmentWeight()) * 100) / 100);
  state.assignments.push(assignment);
  state.selectedAssignmentId = assignment.id;
  saveState();
  render();
  els.assignmentName.focus();
  els.assignmentName.select();
});

els.deleteAssignmentBtn.addEventListener("click", () => {
  if (state.assignments.length <= 1) return;
  const assignment = currentAssignment();
  if (!confirm(`Delete “${assignment.name || "Untitled assessment"}” and its marks? Class students will be retained.`)) return;
  state.assignments = state.assignments.filter((a) => a.id !== assignment.id);
  state.selectedAssignmentId = state.assignments[0].id;
  saveState();
  render();
});

els.addCriterionBtn.addEventListener("click", () => {
  const assignment = currentAssignment();
  assignment.criteria.push({ id: uid(), title: `Criterion ${assignment.criteria.length + 1}`, weight: 0 });
  saveState();
  renderCriteria();
});

els.addStudentBtn.addEventListener("click", addStudent);
els.studentName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addStudent();
});
els.studentId.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addStudent();
});

function addStudent() {
  const name = els.studentName.value.trim();
  const studentId = els.studentId.value.trim();
  if (!name && !studentId) {
    els.studentName.focus();
    return;
  }

  const assignment = currentAssignment();
  if (studentId && state.students.some((s) => s.studentId.toLowerCase() === studentId.toLowerCase())) {
    alert("This student ID is already in the class roster.");
    return;
  }
  const student = { id: uid(), name, studentId };
  state.students.push(student);
  state.selectedStudentId = student.id;
  els.studentName.value = "";
  els.studentId.value = "";
  saveState();
  renderStudents();
  renderMarking();
  els.studentName.focus();
}

document.querySelector("#printBtn").addEventListener("click", () => {
  renderCohortPrint();
  window.print();
});

els.resetBtn.addEventListener("click", () => {
  if (!confirm("Start fresh? This will clear all locally saved classes, assessments, students and marks in this browser.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  render();
});

render();

// Cohort analytics deliberately exclude incomplete rubrics.
let analyticsView = "distribution";
const statsGrid = document.querySelector("#statsGrid");
const analyticsChart = document.querySelector("#analyticsChart");
const analyticsNote = document.querySelector("#analyticsNote");
const gradeCounts = document.querySelector("#gradeCounts");
const distributionBtn = document.querySelector("#distributionBtn");
const curveBtn = document.querySelector("#curveBtn");
const baseRender = render;
render = function () {
  baseRender();
  updateWorkspaceHeading();
  renderAnalytics();
};
function updateWorkspaceHeading() {
  document.querySelector("#workspaceAssessment").textContent = currentAssignment().name || "Untitled assessment";
  document.querySelector("#workspaceClass").textContent = state.className || "Class not named";
}
function completedStudents() {
  const assignment = currentAssignment();
  return state.students.filter((s) => isComplete(s, assignment));
}
function statsOf(values) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const sd = Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n);
  return { mean, median, sd };
}
function gradeColor(g) {
  return { FL: "#f2c9c9", PS: "#f6e8b9", CR: "#cdebdc", DN: "#cddff6", HD: "#e1d3f4" }[g] || "#dddddd";
}
function renderAnalytics() {
  const a = currentAssignment();
  updateWorkspaceHeading();
  const complete = completedStudents();
  const isOverall = analyticsScope() === "overall";
  const candidates = isOverall ? state.students.filter((s) => overallStudent(s).ready) : complete;
  const marks = candidates.map((s) => (isOverall ? overallStudent(s).mark : calculateStudent(s, a)));
  const n = marks.length;
  document.querySelector("#gradedCount").textContent = String(complete.length);
  document.querySelector("#pendingCount").textContent = String(state.students.length - complete.length);
  const { mean, median, sd } = n ? statsOf(marks) : { mean: 0, median: 0, sd: 0 };
  statsGrid.innerHTML = [
    ["Marked", `${n} / ${state.students.length}`],
    ["Mean", n ? formatMark(mean) : "—"],
    ["Median", n ? formatMark(median) : "—"],
    ["Std. deviation", n ? formatMark(sd) : "—"],
  ]
    .map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");
  distributionBtn.classList.toggle("is-current", analyticsView === "distribution");
  curveBtn.classList.toggle("is-current", analyticsView === "curve");
  analyticsNote.textContent = n
    ? `Based on ${n} ${isOverall ? "fully graded class" : "graded"} ${n === 1 ? "student" : "students"}. ${state.students.length - n} incomplete ${state.students.length - n === 1 ? "record is" : "records are"} excluded. ${analyticsView === "curve" ? "The curve is a normal-distribution reference fitted to this cohort, not a grading target." : "Bars show observed marks in 10-point intervals."}`
    : "No final marks yet. Complete every rubric criterion or enter a manual final assessment mark.";
  const grades = ["FL", "PS", "CR", "DN", "HD"];
  gradeCounts.innerHTML = grades
    .map(
      (g) =>
        `<span class="grade-count grade-${g.toLowerCase()}"><strong>${g}</strong> ${marks.filter((m) => gradeForMark(m) === g).length}</span>`,
    )
    .join("");
  if (!n) {
    analyticsChart.innerHTML = '<div class="empty-state">Complete a student rubric to see the mark distribution.</div>';
    return;
  }
  const bins = Array(10).fill(0);
  for (const mark of marks) bins[Math.min(9, Math.floor(mark / 10))]++;
  const W = 800,
    H = 265,
    L = 40,
    R = 16,
    T = 14,
    B = 36,
    chartW = W - L - R,
    chartH = H - T - B;
  const normal = (x) => (sd > 0 ? (Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))) * n * 10 : 0);
  const maxY = Math.max(1, ...bins, ...(analyticsView === "curve" && sd > 0 ? Array.from({ length: 101 }, (_, i) => normal(i)) : []));
  const y = (v) => T + chartH - (v / maxY) * chartH;
  let lines = "";
  for (let k = 0; k <= 4; k++) {
    const v = (maxY * k) / 4;
    const py = y(v);
    lines += `<line x1="${L}" x2="${W - R}" y1="${py}" y2="${py}" stroke="#ddd"/><text x="${L - 8}" y="${py + 4}" text-anchor="end" font-size="11" fill="#666">${formatMark(v)}</text>`;
  }
  let bars = bins
    .map((v, i) => {
      const x = L + (i * chartW) / 10 + 3;
      const bw = chartW / 10 - 6;
      return `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(0, T + chartH - y(v))}" fill="${gradeColor(gradeForMark(i * 10 + 5))}"/><title>${i * 10}–${i === 9 ? 100 : i * 10 + 9}: ${v} students</title>`;
    })
    .join("");
  let curve = "";
  if (analyticsView === "curve" && sd > 0) {
    for (const [start, end] of [[0, 100]]) {
      const points = Array.from({ length: (end - start) * 2 + 1 }, (_, i) => {
        const x = start + i / 2;
        return `${L + (x / 100) * chartW},${y(normal(x))}`;
      }).join(" ");
      curve += `<polyline points="${points}" fill="none" stroke="#242424" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
  const labels = Array.from(
    { length: 11 },
    (_, i) => `<text x="${L + (i * chartW) / 10}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#666">${i * 10}</text>`,
  ).join("");
  analyticsChart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Marks distribution chart">${lines}${bars}${curve}${labels}<line x1="${L}" x2="${W - R}" y1="${T + chartH}" y2="${T + chartH}" stroke="#111"/></svg>`;
}
distributionBtn.addEventListener("click", () => {
  analyticsView = "distribution";
  renderAnalytics();
});
curveBtn.addEventListener("click", () => {
  analyticsView = "curve";
  renderAnalytics();
});
document.querySelector("#analyticsScope").addEventListener("change", renderAnalytics);
// Keep statistics in sync with all existing marking and roster operations.
const baseRenderStudents = renderStudents;
renderStudents = function () {
  baseRenderStudents();
  renderAnalytics();
};
const baseRenderWeightStatus = renderWeightStatus;
renderWeightStatus = function () {
  baseRenderWeightStatus();
  renderAnalytics();
};
const baseRenderMarking = renderMarking;
renderMarking = function () {
  baseRenderMarking();
  updateWorkspaceHeading();
};
render();
// Expose setup on first use; keep it folded for established marking sessions.
const configurationDrawer = document.querySelector(".configuration-drawer");
if (!state.className || !currentAssignment().name || totalWeight() !== 100) configurationDrawer.open = true;
render();

// Portable backups: v1 data envelope. Import replaces current local workspace only after validation and confirmation.
function validateImportedState(data) {
  const payload = data?.format === "moodle-rubric-marker" ? data.data : data;
  if (
    !payload ||
    typeof payload.className !== "string" ||
    !Array.isArray(payload.assignments) ||
    !payload.assignments.length ||
    payload.assignments.length > 100
  )
    throw new Error("Invalid class or assessments.");
  const upgraded = structuredClone(payload);
  if (!Array.isArray(upgraded.students)) migrateState(upgraded);
  if (!Array.isArray(upgraded.students) || upgraded.students.length > 10000) throw new Error("Invalid class roster.");
  const ids = new Set();
  for (const st of upgraded.students) {
    if (!st || typeof st.id !== "string" || !st.id || ids.has(st.id) || typeof st.name !== "string" || typeof st.studentId !== "string")
      throw new Error("Invalid student.");
    ids.add(st.id);
  }
  const assignmentIds = new Set();
  for (const a of upgraded.assignments) {
    if (
      !a ||
      typeof a.id !== "string" ||
      assignmentIds.has(a.id) ||
      typeof a.name !== "string" ||
      !Array.isArray(a.criteria) ||
      a.criteria.length > 100 ||
      !a.marks ||
      typeof a.marks !== "object" ||
      Array.isArray(a.marks)
    )
      throw new Error("Invalid assessment.");
    assignmentIds.add(a.id);
    if (a.overrides !== undefined) {
      if (!a.overrides || typeof a.overrides !== "object" || Array.isArray(a.overrides)) throw new Error("Invalid overrides.");
      for (const [studentId, mark] of Object.entries(a.overrides)) {
        if (!ids.has(studentId) || typeof mark !== "number" || !Number.isFinite(mark) || mark < 0 || mark > 100)
          throw new Error("Invalid manual mark.");
      }
    }
    if (a.weight === undefined) a.weight = upgraded.assignments.length === 1 ? 100 : 0;
    if (!Number.isFinite(a.weight) || a.weight < 0 || a.weight > 100) throw new Error("Invalid assessment weighting.");
    const cids = new Set();
    for (const c of a.criteria) {
      if (
        !c ||
        typeof c.id !== "string" ||
        cids.has(c.id) ||
        typeof c.title !== "string" ||
        !Number.isFinite(c.weight) ||
        c.weight < 0 ||
        c.weight > 100
      )
        throw new Error("Invalid criterion.");
      cids.add(c.id);
    }
    for (const [id, marks] of Object.entries(a.marks)) {
      if (!ids.has(id) || !marks || typeof marks !== "object" || Array.isArray(marks)) throw new Error("Invalid mark record.");
      for (const [cid, band] of Object.entries(marks)) if (!cids.has(cid) || !bandByKey(band)) throw new Error("Invalid band selection.");
    }
  }
  if (!assignmentIds.has(upgraded.selectedAssignmentId)) upgraded.selectedAssignmentId = upgraded.assignments[0].id;
  if (!ids.has(upgraded.selectedStudentId)) upgraded.selectedStudentId = upgraded.students[0]?.id || null;
  return upgraded;
}
function downloadJSON(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cleanFilename(name) {
  return (
    String(name || "class")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 55) || "class"
  );
}
document.querySelector("#exportBtn").addEventListener("click", () => {
  downloadJSON(`moodle-marker-${cleanFilename(state.className)}.json`, {
    format: "moodle-rubric-marker",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: state,
  });
});
const importFile = document.querySelector("#importFile");
document.querySelector("#importBtn").addEventListener("click", () => {
  importFile.value = "";
  importFile.click();
});
importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds the 10 MB import limit.");
    const imported = validateImportedState(JSON.parse(await file.text()));
    const students = imported.students.length;
    if (
      !confirm(
        `Import ${imported.assignments.length} assessment(s) and ${students} student record(s)? This will replace the current local workspace. Export your existing data first if you wish to keep it.`,
      )
    )
      return;
    state = imported;
    saveState();
    render();
  } catch (error) {
    alert(`Import failed: ${error.message}\n\nYour current workspace has not been changed.`);
  }
});

// Rows are the only rubric presentation.
document.querySelector("#markingCriteria").classList.add("layout-rows");

function renderAssessmentWeightStatus() {
  const input = document.querySelector("#assessmentWeight");
  if (document.activeElement !== input) input.value = currentAssignment().weight ?? 0;
  document.querySelector("#assessmentWeightTotal").textContent = `${formatMark(totalAssessmentWeight())} / 100%`;
  document.querySelector("#assessmentWeightTotal").classList.toggle("invalid", Math.abs(totalAssessmentWeight() - 100) > 0.000001);
}
document.querySelector("#assessmentWeight").addEventListener("input", (e) => {
  currentAssignment().weight = Math.max(0, Math.min(100, Number(e.target.value) || 0));
  saveState();
  renderAssessmentWeightStatus();
  renderStudents();
  renderMarking();
});
function renderPriorMarks(student) {
  const current = currentAssignment();
  const items = state.assignments
    .filter((a) => a.id !== current.id)
    .map((a) => {
      const done = isComplete(student, a);
      const score = done ? calculateStudent(student, a) : null;
      return `<span class="prior-mark"><strong>${escapeHtml(a.name)}</strong> ${done ? `${annotatedMark(score, hasOverride(student, a))} (${gradeForMark(score)})` : "In progress"} <small> · ${formatMark(Number(a.weight) || 0)}%</small></span>`;
    });
  const total = overallStudent(student);
  document.querySelector("#priorMarks").innerHTML = items.length
    ? `<div class="prior-title">Other assessments</div>${items.join("")}${
        total.ready
          ? `<div class="prior-total">Class result <strong>${annotatedMark(
              total.mark,
              state.assignments.some((a) => hasOverride(student, a)),
            )} / 100 · ${gradeForMark(total.mark)}</strong></div>`
          : ""
      }`
    : "";
}
function analyticsScope() {
  return document.querySelector("#analyticsScope").value;
}
function updateOverrideControls(student, assignment) {
  const active = hasOverride(student, assignment);
  document.getElementById("overrideControls").hidden = false;
  document.getElementById("editFinalMark").hidden = active;
  document.getElementById("resetFinalMark").hidden = !active;
  closeInlineMarkEditor();
  document.getElementById("overallResult").classList.toggle("is-overridden", active);
}
function closeInlineMarkEditor() {
  document.getElementById("manualMarkEditor").hidden = true;
  document.querySelector(".result-mark-line").classList.remove("is-editing");
  const button = document.getElementById("editFinalMark");
  button.textContent = "✎";
  button.title = "Edit final assessment mark";
  button.setAttribute("aria-label", button.title);
}
function openInlineMarkEditor() {
  const student = currentStudent();
  if (!student) return;
  const input = document.getElementById("manualMarkInput");
  input.value = isComplete(student) ? String(calculateStudent(student)) : "";
  input.setCustomValidity("");
  document.getElementById("manualMarkEditor").hidden = false;
  document.querySelector(".result-mark-line").classList.add("is-editing");
  const button = document.getElementById("editFinalMark");
  button.textContent = "✓";
  button.title = "Confirm manual final assessment mark";
  button.setAttribute("aria-label", button.title);
  input.focus();
  input.select();
}
function saveInlineMarkEditor() {
  const input = document.getElementById("manualMarkInput");
  const text = input.value.trim(),
    value = Number(text);
  if (!text || !Number.isFinite(value) || value < 0 || value > 100) {
    input.setCustomValidity("Enter a mark from 0 to 100.");
    input.reportValidity();
    return false;
  }
  input.setCustomValidity("");
  const student = currentStudent(),
    assessment = currentAssignment();
  if (!student || !assessment) return false;
  assessment.overrides ||= {};
  assessment.overrides[student.id] = Math.round((value + Number.EPSILON) * 100) / 100;
  closeInlineMarkEditor();
  saveState();
  renderStudents();
  renderMarking();
  return true;
}
document.getElementById("editFinalMark").addEventListener("click", () => {
  if (document.getElementById("manualMarkEditor").hidden) openInlineMarkEditor();
  else saveInlineMarkEditor();
});
// Prevent the input's blur handler firing before the confirm button click.
// Otherwise saving on blur can re-render the button as Reset before click lands.
document.getElementById("editFinalMark").addEventListener("pointerdown", (event) => {
  if (!document.getElementById("manualMarkEditor").hidden) event.preventDefault();
});
document.getElementById("manualMarkEditor").addEventListener("submit", (event) => {
  event.preventDefault();
  saveInlineMarkEditor();
});
document.getElementById("manualMarkInput").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeInlineMarkEditor();
    document.getElementById("editFinalMark").focus();
  }
});
document.getElementById("manualMarkInput").addEventListener("input", (event) => event.target.setCustomValidity(""));
document.getElementById("manualMarkInput").addEventListener("blur", (event) => {
  // Do not discard a typed value when the user clicks elsewhere.
  if (!document.getElementById("manualMarkEditor").hidden) saveInlineMarkEditor();
});
document.getElementById("resetFinalMark").addEventListener("click", () => {
  const student = currentStudent(),
    assessment = currentAssignment();
  if (!student) return;
  if (assessment.overrides) delete assessment.overrides[student.id];
  saveState();
  renderStudents();
  renderMarking();
});

const PRINT_ADVISORY =
  '<p class="marking-advisory print-marking-advisory"><strong>Marking advisory:</strong> All marks and grades calculated by Marking Minion are indicative only. Tutors and course convenors should refer to Moodle as the authoritative source for final marking calculations and grades.</p>';

// Print a complete register for the active assessment, including incomplete students.
// No student records are omitted, and partial results are never presented as final grades.
function renderCohortPrint() {
  const scope = document.querySelector("#printScope").value;
  const all = scope === "all";
  const selected = scope === "current" ? [currentAssignment()] : state.assignments.filter((a) => a.id === scope);
  const assignments = all ? state.assignments : selected.length ? selected : [currentAssignment()];
  const el = document.getElementById("cohortPrint");
  const heading = `<h1>${all ? "Class marking register" : "Assessment marking register"}</h1><p>${escapeHtml(state.className || "Unnamed class")} · ${state.students.length} students · Printed ${new Date().toLocaleString("en-AU")}</p>${PRINT_ADVISORY}`;
  if (all) {
    const rows = state.students
      .map((st, i) => {
        const parts = assignments
          .map((a) => {
            const ready = isComplete(st, a),
              score = ready ? calculateStudent(st, a) : null;
            return `<td>${ready ? `${annotatedMark(score, hasOverride(st, a))} (${gradeForMark(score)})` : "In progress"}</td><td>${ready ? formatMark((score * a.weight) / 100) : "—"}</td>`;
          })
          .join("");
        const result = overallStudent(st);
        return `<tr><td>${i + 1}</td><td>${escapeHtml(st.name || "—")}</td><td>${escapeHtml(st.studentId || "—")}</td>${parts}<td><strong>${
          result.ready
            ? annotatedMark(
                result.mark,
                assignments.some((a) => hasOverride(st, a)),
              )
            : "—"
        }</strong></td><td>${result.ready ? gradeForMark(result.mark) + (assignments.some((a) => hasOverride(st, a)) ? "*" : "") : "In progress"}</td></tr>`;
      })
      .join("");
    el.innerHTML = `<div class="print-register-heading">${heading}<p>Assessment weights: ${formatMark(totalAssessmentWeight())}/100%</p></div><table class="print-register-table"><thead><tr><th rowspan="2">#</th><th rowspan="2">Student</th><th rowspan="2">ID</th>${assignments.map((a) => `<th colspan="2">${escapeHtml(a.name)} (${formatMark(a.weight)}%)</th>`).join("")}<th rowspan="2">Overall /100</th><th rowspan="2">Grade</th></tr><tr>${assignments.map(() => "<th>Mark /100</th><th>Weighted</th>").join("")}</tr></thead><tbody>${rows}</tbody></table><p class="print-footnote">Overall results require completed rubrics or manual final marks for all assessments, and assessment weights totalling 100%. * identifies a student with one or more manual assessment mark overrides. No hurdle requirements are applied.</p>`;
  } else {
    const a = assignments[0],
      criteria = a.criteria;
    const rows = state.students
      .map((st, i) => {
        const ready = isComplete(st, a),
          score = ready ? calculateStudent(st, a) : null;
        const cells = criteria
          .map((c) => {
            const band = bandByKey(studentMarks(st, a)[c.id]);
            return band
              ? `<td><strong>${band.key === "NONE" ? "0" : band.key === "PERFECT" ? "100" : band.key}</strong><small>${formatMark((band.midpoint * c.weight) / 100)} marks</small></td>`
              : "<td>—</td>";
          })
          .join("");
        return `<tr><td>${i + 1}</td><td>${escapeHtml(st.name || "—")}</td><td>${escapeHtml(st.studentId || "—")}</td>${cells}<td><strong>${ready ? annotatedMark(score, hasOverride(st, a)) : "—"}</strong></td><td>${ready ? gradeForMark(score) + (hasOverride(st, a) ? "*" : "") : "In progress"}</td></tr>`;
      })
      .join("");
    el.innerHTML = `<div class="print-register-heading">${heading}<p>${escapeHtml(a.name)} · Assessment weighting ${formatMark(a.weight)}% of class total · ${state.students.filter((st) => isComplete(st, a)).length} graded</p></div><table class="print-register-table"><thead><tr><th>#</th><th>Student</th><th>ID</th>${criteria.map((c, i) => `<th>C${i + 1}: ${escapeHtml(c.title)}<small>${formatMark(c.weight)}% of assessment</small></th>`).join("")}<th>Mark /100</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table><p class="print-footnote">Criterion cells show the selected Moodle band and weighted contribution. * identifies a manually overridden final assessment mark; retained rubric selections are shown for reference only and do not determine that mark. Incomplete rubrics without an override have no final mark. Midpoints: 0, FL 30, PS 60, CR 70, DN 80, HD 90, Perfect 100.</p>`;
  }
}
window.addEventListener("beforeprint", renderCohortPrint);

// v8 navigation: keep one class roster across assignments.
function stepNavigation(kind, delta) {
  const list = kind === "assessment" ? state.assignments : state.students;
  const key = kind === "assessment" ? "selectedAssignmentId" : "selectedStudentId";
  if (!list.length) return;
  const index = list.findIndex((item) => item.id === state[key]);
  const next = index + delta;
  if (next < 0 || next >= list.length) return;
  state[key] = list[next].id;
  saveState();
  render();
}
function updateNavigation() {
  for (const [kind, list, key, label] of [
    ["Assessment", state.assignments, "selectedAssignmentId", "Assessment"],
    ["Student", state.students, "selectedStudentId", "Student"],
  ]) {
    const index = list.findIndex((item) => item.id === state[key]);
    document.querySelector(`#prev${kind}`).disabled = index <= 0;
    document.querySelector(`#next${kind}`).disabled = index < 0 || index >= list.length - 1;
    document.querySelector(`#${kind.toLowerCase()}Position`).textContent =
      index < 0 ? `0 / ${list.length}` : `${index + 1} / ${list.length}`;
  }
}
for (const [id, kind, direction] of [
  ["prevAssessment", "assessment", -1],
  ["nextAssessment", "assessment", 1],
  ["prevStudent", "student", -1],
  ["nextStudent", "student", 1],
])
  document.getElementById(id).addEventListener("click", () => stepNavigation(kind, direction));
const v8Render = render;
render = function () {
  v8Render();
  updateNavigation();
};
const v8RenderStudents = renderStudents;
renderStudents = function () {
  v8RenderStudents();
  updateNavigation();
};
const v8RenderMarking = renderMarking;
renderMarking = function () {
  v8RenderMarking();
  updateNavigation();
};

// RFC 4180-style parser: quotes, escaped quotes, commas and embedded newlines.
function parseRosterCSV(text) {
  const rows = [];
  let row = [],
    value = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"' && !value) quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (!rows.length) throw new Error("The CSV is empty.");
  const normalise = (header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const headers = rows.shift().map(normalise);
  const first = headers.indexOf("firstname"),
    last = headers.indexOf("lastname");
  const username = headers.indexOf("username");
  const email = headers.indexOf("emailaddress"),
    group = headers.indexOf("groups");
  if (first === -1 || last === -1 || username === -1) throw new Error("Required Moodle columns: First name, Last name, Username.");
  const records = rows.map((fields, index) => {
    const name = [fields[first], fields[last]]
      .map((v) => (v || "").trim())
      .filter(Boolean)
      .join(" ");
    const studentId = (fields[username] || "").trim();
    if (!studentId) throw new Error(`Row ${index + 2} has no Username. Import cancelled.`);
    return {
      name,
      studentId,
      email: email === -1 ? "" : (fields[email] || "").trim(),
      group: group === -1 ? "" : (fields[group] || "").trim(),
    };
  });
  if (!records.length) throw new Error("There are no student rows in the CSV.");
  return records;
}
const rosterCsvFile = document.querySelector("#rosterCsvFile");
document.querySelector("#importRosterBtn").addEventListener("click", () => {
  rosterCsvFile.value = "";
  rosterCsvFile.click();
});
rosterCsvFile.addEventListener("change", async () => {
  const file = rosterCsvFile.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("CSV exceeds 5 MB.");
    const records = parseRosterCSV(await file.text());
    const known = new Set(state.students.map((s) => s.studentId.trim().toLowerCase()).filter(Boolean));
    const additions = [],
      seen = new Set();
    let skipped = 0;
    for (const record of records) {
      const id = record.studentId.toLowerCase();
      if (known.has(id) || seen.has(id)) {
        skipped++;
        continue;
      }
      seen.add(id);
      additions.push({ id: uid(), ...record });
    }
    if (!additions.length) {
      document.querySelector("#rosterImportStatus").textContent = `No new students — ${skipped} existing or duplicate IDs skipped.`;
      return;
    }
    if (
      !confirm(
        `Add ${additions.length} student(s) to the class roster? ${skipped} duplicate/existing ID(s) will be skipped. Existing students and marks will not be changed.`,
      )
    )
      return;
    state.students.push(...additions);
    if (!state.selectedStudentId) state.selectedStudentId = additions[0].id;
    saveState();
    render();
    document.querySelector("#rosterImportStatus").textContent = `Added ${additions.length} students; skipped ${skipped} duplicate IDs.`;
  } catch (error) {
    alert(`Roster import failed: ${error.message}\n\nNo changes were made.`);
  }
});
updateNavigation();
