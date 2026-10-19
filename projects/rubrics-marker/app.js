const STORAGE_KEY = 'moodleRubricMarker.v1';

const BANDS = [
  { key: 'NONE', label: 'Failed to meet criterion', short: 'Fail criterion', midpoint: 0 },
  { key: 'FL', label: 'FL', short: 'FL', midpoint: 30 },
  { key: 'PS', label: 'PS', short: 'PS', midpoint: 60 },
  { key: 'CR', label: 'CR', short: 'CR', midpoint: 70 },
  { key: 'DN', label: 'DN', short: 'DN', midpoint: 80 },
  { key: 'HD', label: 'HD', short: 'HD', midpoint: 90 },
  { key: 'PERFECT', label: 'Perfect application of criterion', short: 'Perfect', midpoint: 100 }
];

const DEFAULT_CRITERIA = [
  { id: uid(), title: 'Criterion 1', weight: 50 },
  { id: uid(), title: 'Criterion 2', weight: 50 }
];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
}

function createAssignment(name = 'Assignment 1') {
  return {
    id: uid(),
    name,
    criteria: structuredClone(DEFAULT_CRITERIA).map(c => ({ ...c, id: uid() })),
    students: [],
    selectedStudentId: null
  };
}

function defaultState() {
  const assignment = createAssignment();
  return {
    className: '',
    assignments: [assignment],
    selectedAssignmentId: assignment.id
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.assignments?.length) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const status = document.querySelector('#saveStatus');
    if (status) status.textContent = 'Saved locally in this browser';
  } catch (error) {
    const status = document.querySelector('#saveStatus');
    if (status) status.textContent = 'Unable to save — export your data';
    console.error('Local storage save failed:', error);
  }
}

function currentAssignment() {
  return state.assignments.find(a => a.id === state.selectedAssignmentId) || state.assignments[0];
}

function currentStudent() {
  const assignment = currentAssignment();
  return assignment.students.find(s => s.id === assignment.selectedStudentId) || null;
}

function totalWeight(assignment = currentAssignment()) {
  return assignment.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
}

function bandByKey(key) {
  return BANDS.find(b => b.key === key) || null;
}

function calculateStudent(student, assignment = currentAssignment()) {
  const total = assignment.criteria.reduce((sum, criterion) => {
    const key = student.marks?.[criterion.id];
    const band = bandByKey(key);
    if (!band) return sum;
    return sum + (band.midpoint * (Number(criterion.weight) || 0) / 100);
  }, 0);

  return Math.round((total + Number.EPSILON) * 100) / 100;
}

function gradeForMark(mark) {
  if (mark >= 85) return 'HD';
  if (mark >= 75) return 'DN';
  if (mark >= 65) return 'CR';
  if (mark >= 50) return 'PS';
  return 'FL';
}

function formatMark(mark) {
  if (Number.isInteger(mark)) return String(mark);
  return mark.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

const els = {
  className: document.querySelector('#className'),
  assignmentName: document.querySelector('#assignmentName'),
  assignmentSelect: document.querySelector('#assignmentSelect'),
  newAssignmentBtn: document.querySelector('#newAssignmentBtn'),
  deleteAssignmentBtn: document.querySelector('#deleteAssignmentBtn'),
  criteriaList: document.querySelector('#criteriaList'),
  criterionTemplate: document.querySelector('#criterionTemplate'),
  addCriterionBtn: document.querySelector('#addCriterionBtn'),
  weightTotal: document.querySelector('#weightTotal'),
  criteriaWarning: document.querySelector('#criteriaWarning'),
  studentName: document.querySelector('#studentName'),
  studentId: document.querySelector('#studentId'),
  addStudentBtn: document.querySelector('#addStudentBtn'),
  studentTableBody: document.querySelector('#studentTableBody'),
  markingTitle: document.querySelector('#markingTitle'),
  markingEmpty: document.querySelector('#markingEmpty'),
  markingContent: document.querySelector('#markingContent'),
  markingCriteria: document.querySelector('#markingCriteria'),
  overallMark: document.querySelector('#overallMark'),
  overallGrade: document.querySelector('#overallGrade'),
  printClass: document.querySelector('#printClass'),
  printAssignment: document.querySelector('#printAssignment'),
  printStudent: document.querySelector('#printStudent'),
  printStudentId: document.querySelector('#printStudentId'),
  bandReference: document.querySelector('#bandReference'),
  printBtn: document.querySelector('#printBtn'),
  resetBtn: document.querySelector('#resetBtn')
};

function render() {
  const assignment = currentAssignment();

  els.className.value = state.className || '';
  els.assignmentName.value = assignment.name || '';

  els.assignmentSelect.innerHTML = state.assignments.map(a =>
    `<option value="${a.id}" ${a.id === assignment.id ? 'selected' : ''}>${escapeHtml(a.name || 'Untitled assignment')}</option>`
  ).join('');

  els.deleteAssignmentBtn.disabled = state.assignments.length <= 1;

  renderCriteria();
  renderStudents();
  renderMarking();
  renderBandReference();
}

function renderCriteria() {
  const assignment = currentAssignment();
  els.criteriaList.innerHTML = '';

  assignment.criteria.forEach(criterion => {
    const node = els.criterionTemplate.content.firstElementChild.cloneNode(true);
    const title = node.querySelector('.criterion-title');
    const weight = node.querySelector('.criterion-weight');
    const remove = node.querySelector('.remove-criterion');

    title.value = criterion.title;
    weight.value = criterion.weight;

    title.addEventListener('input', () => {
      criterion.title = title.value;
      saveState();
      renderMarking();
    });

    weight.addEventListener('input', () => {
      criterion.weight = Math.max(0, Math.min(100, Number(weight.value) || 0));
      saveState();
      renderWeightStatus();
      renderStudents();
      renderMarking();
    });

    remove.addEventListener('click', () => {
      assignment.criteria = assignment.criteria.filter(c => c.id !== criterion.id);
      assignment.students.forEach(student => {
        if (student.marks) delete student.marks[criterion.id];
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
  els.weightTotal.classList.toggle('invalid', total !== 100);
  els.criteriaWarning.hidden = total === 100;
}

function renderStudents() {
  const assignment = currentAssignment();
  els.studentTableBody.innerHTML = '';

  if (!assignment.students.length) {
    els.studentTableBody.innerHTML = `<tr><td colspan="5" class="section-note">No students added yet.</td></tr>`;
    return;
  }

  assignment.students.forEach(student => {
    const completed = assignment.criteria.length && totalWeight(assignment) === 100 && assignment.criteria.every(c => bandByKey(student.marks?.[c.id]));
    const mark = completed ? calculateStudent(student, assignment) : null;
    const row = document.createElement('tr');
    if (student.id === assignment.selectedStudentId) row.classList.add('active');
    row.innerHTML = `
      <td>${escapeHtml(student.name || 'Unnamed student')}</td>
      <td>${escapeHtml(student.studentId || '—')}</td>
      <td class="numeric">${mark === null ? "—" : formatMark(mark)}</td>
      <td>${mark === null ? "In progress" : gradeForMark(mark)}</td>
      <td><div class="row-actions"><button type="button" class="select-student">Mark</button><button type="button" class="remove-student">Remove</button></div></td>
    `;

    row.addEventListener('click', e => {
      if (e.target.closest('.remove-student')) return;
      assignment.selectedStudentId = student.id;
      saveState();
      renderStudents();
      renderMarking();
    });

    row.querySelector('.remove-student').addEventListener('click', e => {
      e.stopPropagation();
      assignment.students = assignment.students.filter(s => s.id !== student.id);
      if (assignment.selectedStudentId === student.id) assignment.selectedStudentId = assignment.students[0]?.id || null;
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
    els.markingTitle.textContent = 'Select a student';
    els.markingEmpty.hidden = false;
    els.markingContent.hidden = true;
    els.overallMark.textContent = '—';
    els.overallGrade.textContent = '—';
    return;
  }

  const completed = assignment.criteria.length && totalWeight(assignment) === 100 && assignment.criteria.every(c => bandByKey(student.marks?.[c.id]));
  const mark = calculateStudent(student, assignment);
  els.markingTitle.textContent = student.name || student.studentId || 'Selected student';
  els.markingEmpty.hidden = true;
  els.markingContent.hidden = false;
  els.overallMark.textContent = completed ? formatMark(mark) : '—';
  els.overallGrade.textContent = completed ? gradeForMark(mark) : 'In progress';
  els.printClass.textContent = state.className || '—';
  els.printAssignment.textContent = assignment.name || '—';
  els.printStudent.textContent = student.name || '—';
  els.printStudentId.textContent = student.studentId || '—';

  els.markingCriteria.innerHTML = '';
  assignment.criteria.forEach(criterion => {
    const selected = student.marks?.[criterion.id] || '';
    const selectedBand = bandByKey(selected);
    const contribution = selectedBand ? selectedBand.midpoint * (Number(criterion.weight) || 0) / 100 : 0;

    const item = document.createElement('section');
    item.className = 'marking-item';
    item.innerHTML = `
      <div class="marking-item-head">
        <div class="marking-item-title">${escapeHtml(criterion.title || 'Untitled criterion')}</div>
        <div class="marking-item-weight">${formatMark(Number(criterion.weight) || 0)}%</div>
        <div class="marking-item-score">${selectedBand ? `${selectedBand.midpoint} × ${formatMark(Number(criterion.weight) || 0)}% = ${formatMark(contribution)}` : 'Not marked'}</div>
      </div>
      <div class="band-options" role="radiogroup" aria-label="${escapeHtml(criterion.title || 'Criterion')} band"></div>
    `;

    const options = item.querySelector('.band-options');
    BANDS.forEach(band => {
      const option = document.createElement('label');
      option.className = `band-option band-${band.key.toLowerCase()}`;
      option.innerHTML = `
        <input type="radio" name="band-${criterion.id}" value="${band.key}" ${selected === band.key ? 'checked' : ''}>
        <span>
          <strong class="band-code">${escapeHtml(band.short)}</strong>
          <span class="band-midpoint">${band.midpoint}</span>
        </span>
      `;
      option.querySelector('input').addEventListener('change', () => {
        student.marks ||= {};
        student.marks[criterion.id] = band.key;
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
  els.bandReference.innerHTML = BANDS.map(b => `
    <div class="reference-band">
      <strong>${escapeHtml(b.label)}</strong>
      <span>${b.midpoint}</span>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[ch]));
}

els.className.addEventListener('input', () => {
  state.className = els.className.value;
  saveState();
  if (currentStudent()) els.printClass.textContent = state.className || '—';
});

els.assignmentName.addEventListener('input', () => {
  currentAssignment().name = els.assignmentName.value;
  saveState();
  renderStudents();
  renderMarking();
  const selectedOption = els.assignmentSelect.querySelector(`option[value="${currentAssignment().id}"]`);
  if (selectedOption) selectedOption.textContent = currentAssignment().name || 'Untitled assignment';
});

els.assignmentSelect.addEventListener('change', () => {
  state.selectedAssignmentId = els.assignmentSelect.value;
  saveState();
  render();
});

els.newAssignmentBtn.addEventListener('click', () => {
  const assignment = createAssignment(`Assignment ${state.assignments.length + 1}`);
  state.assignments.push(assignment);
  state.selectedAssignmentId = assignment.id;
  saveState();
  render();
  els.assignmentName.focus();
  els.assignmentName.select();
});

els.deleteAssignmentBtn.addEventListener('click', () => {
  if (state.assignments.length <= 1) return;
  const assignment = currentAssignment();
  if (!confirm(`Delete “${assignment.name || 'Untitled assignment'}” and all of its student records?`)) return;
  state.assignments = state.assignments.filter(a => a.id !== assignment.id);
  state.selectedAssignmentId = state.assignments[0].id;
  saveState();
  render();
});

els.addCriterionBtn.addEventListener('click', () => {
  const assignment = currentAssignment();
  assignment.criteria.push({ id: uid(), title: `Criterion ${assignment.criteria.length + 1}`, weight: 0 });
  saveState();
  renderCriteria();
});

els.addStudentBtn.addEventListener('click', addStudent);
els.studentName.addEventListener('keydown', e => { if (e.key === 'Enter') addStudent(); });
els.studentId.addEventListener('keydown', e => { if (e.key === 'Enter') addStudent(); });

function addStudent() {
  const name = els.studentName.value.trim();
  const studentId = els.studentId.value.trim();
  if (!name && !studentId) {
    els.studentName.focus();
    return;
  }

  const assignment = currentAssignment();
  const student = { id: uid(), name, studentId, marks: {} };
  assignment.students.push(student);
  assignment.selectedStudentId = student.id;
  els.studentName.value = '';
  els.studentId.value = '';
  saveState();
  renderStudents();
  renderMarking();
  els.studentName.focus();
}

els.printBtn.addEventListener('click', () => {
  renderCohortPrint();
  window.print();
});

els.resetBtn.addEventListener('click', () => {
  if (!confirm('Start fresh? This will clear all locally saved classes, assignments, students and marks in this browser.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  render();
});

render();

// Cohort analytics deliberately exclude incomplete rubrics.
let analyticsView = 'distribution';
const statsGrid = document.querySelector('#statsGrid');
const analyticsChart = document.querySelector('#analyticsChart');
const analyticsNote = document.querySelector('#analyticsNote');
const gradeCounts = document.querySelector('#gradeCounts');
const distributionBtn = document.querySelector('#distributionBtn');
const curveBtn = document.querySelector('#curveBtn');
const baseRender = render;
render = function () {
  baseRender();
  updateWorkspaceHeading();
  renderAnalytics();
};
function updateWorkspaceHeading() {
  document.querySelector('#workspaceAssessment').textContent = currentAssignment().name || 'Untitled assignment';
  document.querySelector('#workspaceClass').textContent = state.className || 'Class not named';
}
function completedStudents() {
  const assignment = currentAssignment();
  if (!assignment.criteria.length || Math.abs(totalWeight(assignment) - 100) > 0.000001) return [];
  return assignment.students.filter(s => assignment.criteria.every(c => BANDS.some(b => b.key === s.marks?.[c.id])));
}
function statsOf(values) {
  const n = values.length;
  const mean = values.reduce((a,b) => a+b, 0) / n;
  const sorted = [...values].sort((a,b) => a-b);
  const median = n % 2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2;
  const sd = Math.sqrt(values.reduce((sum,x) => sum+(x-mean)**2, 0)/n);
  return { mean, median, sd };
}
function gradeColor(g) { return {FL:'#f2c9c9',PS:'#f6e8b9',CR:'#cdebdc',DN:'#cddff6',HD:'#e1d3f4'}[g] || '#dddddd'; }
function renderAnalytics() {
  const a = currentAssignment();
  updateWorkspaceHeading();
  const complete = completedStudents();
  const marks = complete.map(s => calculateStudent(s, a));
  const n = marks.length;
  document.querySelector('#gradedCount').textContent = String(n);
  document.querySelector('#pendingCount').textContent = String(a.students.length - n);
  const {mean,median,sd} = n ? statsOf(marks) : {mean:0,median:0,sd:0};
  statsGrid.innerHTML = [
    ['Marked', `${n} / ${a.students.length}`],
    ['Mean', n ? formatMark(mean) : '—'],
    ['Median', n ? formatMark(median) : '—'],
    ['Std. deviation', n ? formatMark(sd) : '—']
  ].map(([label,value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
  distributionBtn.classList.toggle('is-current', analyticsView === 'distribution');
  curveBtn.classList.toggle('is-current', analyticsView === 'curve');
  analyticsNote.textContent = n ? `Based on ${n} fully marked ${n === 1 ? 'student' : 'students'}. ${a.students.length-n} incomplete ${a.students.length-n === 1 ? 'record is' : 'records are'} excluded. ${analyticsView === 'curve' ? 'The curve is a normal-distribution reference fitted to this cohort, not a grading target.' : 'Bars show observed marks in 10-point intervals.'}` : 'No completed rubrics yet. Each criterion must have a selected band, and rubric weightings must total 100%.';
  const grades = ['FL','PS','CR','DN','HD'];
  gradeCounts.innerHTML = grades.map(g => `<span class="grade-count grade-${g.toLowerCase()}"><strong>${g}</strong> ${marks.filter(m => gradeForMark(m) === g).length}</span>`).join('');
  if (!n) { analyticsChart.innerHTML = '<div class="empty-state">Complete a student rubric to see the mark distribution.</div>'; return; }
  const bins = Array(10).fill(0);
  for (const mark of marks) bins[Math.min(9, Math.floor(mark/10))]++;
  const W=800,H=265,L=40,R=16,T=14,B=36, chartW=W-L-R, chartH=H-T-B;
  const normal = (x) => sd > 0 ? Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI))*n*10 : 0;
  const maxY = Math.max(1,...bins, ...(analyticsView === 'curve' && sd > 0 ? Array.from({length:101},(_,i)=>normal(i)) : []));
  const y = v => T+chartH-(v/maxY)*chartH;
  let lines = '';
  for (let k=0;k<=4;k++) { const v=maxY*k/4; const py=y(v); lines += `<line x1="${L}" x2="${W-R}" y1="${py}" y2="${py}" stroke="#ddd"/><text x="${L-8}" y="${py+4}" text-anchor="end" font-size="11" fill="#666">${formatMark(v)}</text>`; }
  let bars = bins.map((v,i) => { const x=L+i*chartW/10+3; const bw=chartW/10-6; return `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(0,T+chartH-y(v))}" fill="${gradeColor(gradeForMark(i*10+5))}"/><title>${i*10}–${i===9 ? 100 : i*10+9}: ${v} students</title>`; }).join('');
  let curve = '';
  if (analyticsView === 'curve' && sd > 0) {
    for (const [start,end,grade] of [[0,50,'FL'],[50,65,'PS'],[65,75,'CR'],[75,85,'DN'],[85,100,'HD']]) {
      const points = Array.from({length:(end-start)*2+1},(_,i) => { const x=start+i/2; return `${L+x/100*chartW},${y(normal(x))}`; }).join(' ');
      curve += `<polyline points="${points}" fill="none" stroke="${gradeColor(grade)}" stroke-width="3" stroke-dasharray="7 4"/>`;
    }
  }
  const labels = Array.from({length:11},(_,i)=> `<text x="${L+i*chartW/10}" y="${H-12}" text-anchor="middle" font-size="12" fill="#666">${i*10}</text>`).join('');
  analyticsChart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Marks distribution chart">${lines}${bars}${curve}${labels}<line x1="${L}" x2="${W-R}" y1="${T+chartH}" y2="${T+chartH}" stroke="#111"/></svg>`;
}
distributionBtn.addEventListener('click', () => { analyticsView='distribution'; renderAnalytics(); });
curveBtn.addEventListener('click', () => { analyticsView='curve'; renderAnalytics(); });
// Keep statistics in sync with all existing marking and roster operations.
const baseRenderStudents = renderStudents;
renderStudents = function () { baseRenderStudents(); renderAnalytics(); };
const baseRenderWeightStatus = renderWeightStatus;
renderWeightStatus = function () { baseRenderWeightStatus(); renderAnalytics(); };
const baseRenderMarking = renderMarking;
renderMarking = function () { baseRenderMarking(); updateWorkspaceHeading(); };
render();
// Expose setup on first use; keep it folded for established marking sessions.
const configurationDrawer = document.querySelector('.configuration-drawer');
if (!state.className || !currentAssignment().name || totalWeight() !== 100) configurationDrawer.open = true;
render();


// Portable backups: v1 data envelope. Import replaces current local workspace only after validation and confirmation.
function validateImportedState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected an object.');
  const payload = data.format === 'moodle-rubric-marker' ? data.data : data;
  if (!payload || typeof payload !== 'object' || typeof payload.className !== 'string' || !Array.isArray(payload.assignments) || !payload.assignments.length || payload.assignments.length > 100) {
    throw new Error('Missing class name or valid assignments.');
  }
  const usedAssignments = new Set();
  for (const a of payload.assignments) {
    if (!a || typeof a.id !== 'string' || !a.id || usedAssignments.has(a.id) || typeof a.name !== 'string' || !Array.isArray(a.criteria) || !Array.isArray(a.students) || a.criteria.length > 100 || a.students.length > 10000) throw new Error('Invalid assignment structure.');
    usedAssignments.add(a.id);
    const criterionIds = new Set();
    for (const c of a.criteria) {
      if (!c || typeof c.id !== 'string' || !c.id || criterionIds.has(c.id) || typeof c.title !== 'string' || !Number.isFinite(c.weight) || c.weight < 0 || c.weight > 100) throw new Error('Invalid rubric criterion.');
      criterionIds.add(c.id);
    }
    const studentIds = new Set();
    for (const st of a.students) {
      if (!st || typeof st.id !== 'string' || !st.id || studentIds.has(st.id) || typeof st.name !== 'string' || typeof st.studentId !== 'string' || !st.marks || typeof st.marks !== 'object' || Array.isArray(st.marks)) throw new Error('Invalid student record.');
      studentIds.add(st.id);
      for (const [id, band] of Object.entries(st.marks)) {
        if (!criterionIds.has(id) || !bandByKey(band)) throw new Error('Unrecognised criterion or Moodle band.');
      }
    }
  }
  if (!usedAssignments.has(payload.selectedAssignmentId)) throw new Error('Selected assignment does not exist.');
  return {
    className: payload.className,
    assignments: payload.assignments.map(a => ({
      id: a.id, name: a.name,
      criteria: a.criteria.map(c => ({ id: c.id, title: c.title, weight: c.weight })),
      students: a.students.map(st => ({ id: st.id, name: st.name, studentId: st.studentId, marks: { ...st.marks } })),
      selectedStudentId: a.students.some(st => st.id === a.selectedStudentId) ? a.selectedStudentId : null
    })),
    selectedAssignmentId: payload.selectedAssignmentId
  };
}
function downloadJSON(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cleanFilename(name) {
  return String(name || 'class').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'class';
}
document.querySelector('#exportBtn').addEventListener('click', () => {
  downloadJSON(`moodle-marker-${cleanFilename(state.className)}.json`, {
    format: 'moodle-rubric-marker', version: 1, exportedAt: new Date().toISOString(), data: state
  });
});
const importFile = document.querySelector('#importFile');
document.querySelector('#importBtn').addEventListener('click', () => { importFile.value = ''; importFile.click(); });
importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('File exceeds the 10 MB import limit.');
    const imported = validateImportedState(JSON.parse(await file.text()));
    const students = imported.assignments.reduce((n, a) => n + a.students.length, 0);
    if (!confirm(`Import ${imported.assignments.length} assignment(s) and ${students} student record(s)? This will replace the current local workspace. Export your existing data first if you wish to keep it.`)) return;
    state = imported;
    saveState();
    render();
  } catch (error) {
    alert(`Import failed: ${error.message}\n\nYour current workspace has not been changed.`);
  }
});

// Row/grid is a reversible presentation choice, independent of marking data.
const LAYOUT_KEY = 'moodleRubricMarker.layout';
let rubricLayout = localStorage.getItem(LAYOUT_KEY) === 'grid' ? 'grid' : 'rows';
function applyRubricLayout() {
  document.querySelector('#markingCriteria').classList.toggle('layout-rows', rubricLayout === 'rows');
  document.querySelector('#markingCriteria').classList.toggle('layout-grid', rubricLayout === 'grid');
  for (const [key, id] of [['rows','rowLayoutBtn'],['grid','gridLayoutBtn']]) {
    const btn = document.getElementById(id);
    btn.classList.toggle('is-current',rubricLayout === key);
    btn.setAttribute('aria-pressed', String(rubricLayout === key));
  }
}
for (const [key,id] of [['rows','rowLayoutBtn'],['grid','gridLayoutBtn']]) {
  document.getElementById(id).addEventListener('click', () => {
    rubricLayout = key;
    try { localStorage.setItem(LAYOUT_KEY, key); } catch {};
    applyRubricLayout();
  });
}
applyRubricLayout();

// Print a complete register for the active assignment, including incomplete students.
// No student records are omitted, and partial results are never presented as final grades.
function renderCohortPrint() {
  const assignment = currentAssignment();
  const criteria = assignment.criteria;
  const complete = new Set(completedStudents().map(s => s.id));
  const el = document.getElementById('cohortPrint');
  const rows = assignment.students.map((s, index) => {
    const done = complete.has(s.id);
    const result = done ? calculateStudent(s, assignment) : null;
    const cells = criteria.map(c => {
      const band = bandByKey(s.marks?.[c.id]);
      if (!band) return '<td class="print-unmarked">—</td>';
      const score = band.midpoint * Number(c.weight) / 100;
      const label = band.key === 'NONE' ? '0' : band.key === 'PERFECT' ? '100' : band.key;
      return `<td><strong>${label}</strong><small>${band.midpoint} × ${formatMark(Number(c.weight))}% = ${formatMark(score)}</small></td>`;
    }).join('');
    return `<tr><td>${index+1}</td><td>${escapeHtml(s.name || '—')}</td><td>${escapeHtml(s.studentId || '—')}</td>${cells}<td class="numeric"><strong>${done ? formatMark(result) : '—'}</strong></td><td>${done ? gradeForMark(result) : 'In progress'}</td></tr>`;
  }).join('');
  el.innerHTML = `<div class="print-register-heading"><h1>Assessment marking register</h1><p>${escapeHtml(state.className || 'Unnamed class')} / ${escapeHtml(assignment.name || 'Untitled assignment')}</p><p>${assignment.students.length} students · ${complete.size} graded · ${assignment.students.length - complete.size} in progress · Printed ${new Date().toLocaleString('en-AU')}</p></div>
    <table class="print-register-table"><thead><tr><th>#</th><th>Student</th><th>ID</th>${criteria.map((c,i)=> `<th><span>C${i+1}: ${escapeHtml(c.title || 'Criterion')}</span><small>Weight ${formatMark(Number(c.weight))}%</small></th>`).join('')}<th>Final /100</th><th>Grade</th></tr></thead><tbody>${rows || `<tr><td colspan="${criteria.length+5}">No students recorded.</td></tr>`}</tbody></table><p class="print-footnote">Criterion cells show selected Moodle midpoint × criterion weighting = contribution to final mark. Incomplete records have no final grade. Moodle midpoints: 0, FL 30, PS 60, CR 70, DN 80, HD 90, Perfect 100.</p>`;
}
window.addEventListener('beforeprint', renderCohortPrint);
