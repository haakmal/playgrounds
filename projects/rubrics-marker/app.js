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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    const mark = calculateStudent(student, assignment);
    const row = document.createElement('tr');
    if (student.id === assignment.selectedStudentId) row.classList.add('active');
    row.innerHTML = `
      <td>${escapeHtml(student.name || 'Unnamed student')}</td>
      <td>${escapeHtml(student.studentId || '—')}</td>
      <td class="numeric">${formatMark(mark)}</td>
      <td>${gradeForMark(mark)}</td>
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

  const mark = calculateStudent(student, assignment);
  els.markingTitle.textContent = student.name || student.studentId || 'Selected student';
  els.markingEmpty.hidden = true;
  els.markingContent.hidden = false;
  els.overallMark.textContent = formatMark(mark);
  els.overallGrade.textContent = gradeForMark(mark);
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
      option.className = 'band-option';
      option.innerHTML = `
        <input type="radio" name="band-${criterion.id}" value="${band.key}" ${selected === band.key ? 'checked' : ''}>
        <span>
          <strong class="band-code">${escapeHtml(band.short)}</strong>
          <span class="band-midpoint">${band.midpoint}</span>
          ${['NONE','PERFECT'].includes(band.key) ? `<small class="band-long">${escapeHtml(band.label)}</small>` : ''}
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
  if (!currentStudent()) {
    alert('Select a student before printing a record.');
    return;
  }
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
function renderAnalytics() {
  const a = currentAssignment();
  updateWorkspaceHeading();
  const complete = completedStudents();
  const marks = complete.map(s => calculateStudent(s, a));
  const n = marks.length;
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
  gradeCounts.innerHTML = grades.map(g => `<span><strong>${g}</strong> ${marks.filter(m => gradeForMark(m) === g).length}</span>`).join('');
  if (!n) { analyticsChart.innerHTML = '<div class="empty-state">Complete a student rubric to see the mark distribution.</div>'; return; }
  const bins = Array(10).fill(0);
  for (const mark of marks) bins[Math.min(9, Math.floor(mark/10))]++;
  const W=800,H=265,L=40,R=16,T=14,B=36, chartW=W-L-R, chartH=H-T-B;
  const normal = (x) => sd > 0 ? Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI))*n*10 : 0;
  const maxY = Math.max(1,...bins, ...(analyticsView === 'curve' && sd > 0 ? Array.from({length:101},(_,i)=>normal(i)) : []));
  const y = v => T+chartH-(v/maxY)*chartH;
  let lines = '';
  for (let k=0;k<=4;k++) { const v=maxY*k/4; const py=y(v); lines += `<line x1="${L}" x2="${W-R}" y1="${py}" y2="${py}" stroke="#ddd"/><text x="${L-8}" y="${py+4}" text-anchor="end" font-size="11" fill="#666">${formatMark(v)}</text>`; }
  let bars = bins.map((v,i) => { const x=L+i*chartW/10+3; const bw=chartW/10-6; return `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(0,T+chartH-y(v))}" fill="#333"/><title>${i*10}–${i===9 ? 100 : i*10+9}: ${v} students</title>`; }).join('');
  let curve = '';
  if (analyticsView === 'curve' && sd > 0) {
    const points = Array.from({length:201},(_,i) => { const x=i/2; return `${L+x/100*chartW},${y(normal(x))}`; }).join(' ');
    curve = `<polyline points="${points}" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="7 4"/>`;
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
