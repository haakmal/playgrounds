const STORAGE_KEY = 'ddes-usability-reports-v2';
const ACTIVE_KEY = 'ddes-usability-active-v2';
const state = {
  reports: {},
  activeId: null,
  editingFindingId: null,
  currentFindingForLibrary: null,
  librarySelectedId: null,
  librarySource: 'all',
  libraryCategory: 'all',
  reportToDelete: null,
  findingToDelete: null
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = (prefix='id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const nowISO = () => new Date().toISOString();
const formatDate = iso => new Intl.DateTimeFormat(undefined, {dateStyle:'medium', timeStyle:'short'}).format(new Date(iso));
const slug = s => String(s || 'untitled-report').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'untitled-report';
const escapeHTML = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function defaultReport(title='Untitled usability report') {
  const ts = nowISO();
  return {
    id: uid('report'), title, created: ts, modified: ts,
    metadata: {evaluator:'', interfaceName:'', method:'Heuristic evaluation', goal:''},
    findings: []
  };
}

function normaliseReport(r) {
  r.id = r.id || uid('report');
  r.title = r.title || 'Untitled usability report';
  r.created = r.created || nowISO();
  r.modified = r.modified || r.created;
  r.metadata = r.metadata || {};
  r.metadata.evaluator = r.metadata.evaluator || '';
  r.metadata.interfaceName = r.metadata.interfaceName || '';
  r.metadata.method = r.metadata.method || 'Heuristic evaluation';
  r.metadata.goal = r.metadata.goal || '';
  r.findings = Array.isArray(r.findings) ? r.findings : [];
  r.findings.forEach(f => {
    f.id = f.id || 'F-00';
    f.location = f.location || '';
    f.category = f.category || '';
    f.severity = f.severity || 'Moderate';
    f.heuristicId = f.heuristicId || '';
    f.relatedIds = Array.isArray(f.relatedIds) ? f.relatedIds : [];
    f.description = f.description || '';
    f.why = f.why || '';
    f.recommendation = f.recommendation || '';
    f.evidence = f.evidence || '';
    f.created = f.created || r.created;
    f.modified = f.modified || f.created;
  });
  return r;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.reports) state.reports = saved.reports;
    state.activeId = localStorage.getItem(ACTIVE_KEY) || saved?.activeId || null;
  } catch (err) { state.reports = {}; }
  Object.values(state.reports).forEach(normaliseReport);
  if (!state.activeId || !state.reports[state.activeId]) {
    const first = Object.values(state.reports).sort((a,b)=>b.modified.localeCompare(a.modified))[0];
    if (first) state.activeId = first.id;
  }
  if (!state.activeId) {
    const report = defaultReport();
    state.reports[report.id] = report;
    state.activeId = report.id;
    persist();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({schema:'ddes-usability-report/v2', reports:state.reports, activeId:state.activeId}));
  localStorage.setItem(ACTIVE_KEY, state.activeId || '');
}

function currentReport() { return state.reports[state.activeId]; }
function touch() {
  $('#saveState').textContent = 'Saving…';
  clearTimeout(touch.timer);
  touch.timer = setTimeout(() => {
    currentReport().modified = nowISO();
    persist();
    $('#saveState').textContent = 'Saved';
    renderReports();
  }, 250);
}

function init() {
  loadState();
  buildFilters();
  buildLibraryFilters();
  populateContext();
  renderFindings();
  bindStaticEvents();
  renderReports();
}

function buildFilters() {
  const categories = [...new Set(HEURISTICS.map(h=>h.category))].sort();
  $('#categoryFilter').innerHTML = '<option value="all">All categories</option>' + categories.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  $('#heuristicFilter').innerHTML = '<option value="all">All heuristics</option>' + HEURISTICS.slice().sort((a,b)=>a.priority-b.priority || a.name.localeCompare(b.name)).map(h=>`<option value="${escapeHTML(h.id)}">${escapeHTML(h.name)}</option>`).join('');
}

function buildLibraryFilters() {
  const sources = ['all','Nielsen','Andy Budd','Bruce Tognazzini'];
  $('#sourceChips').innerHTML = sources.map(s=>`<button class="chip ${s==='all'?'active':''}" data-library-source="${escapeHTML(s)}">${s==='all'?'All sources':escapeHTML(s)}</button>`).join('');
  const cats = [...new Set(HEURISTICS.map(h=>h.category))].sort();
  $('#libraryCategoryChips').innerHTML = '<button class="chip active" data-library-category="all">All categories</button>' + cats.map(c=>`<button class="chip" data-library-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
}

function populateContext() {
  const r = currentReport();
  $('#reportTitle').value = r.title;
  $('#evaluator').value = r.metadata.evaluator;
  $('#interfaceName').value = r.metadata.interfaceName;
  $('#method').value = r.metadata.method;
  $('#goal').value = r.metadata.goal;
  $('#appTitle').textContent = r.title;
  renderPrintContext();
}

function renderPrintContext() {
  const r = currentReport();
  const m = r.metadata || {};
  $('#printContext').innerHTML = `
    <div class="print-context-header">
      <div class="eyebrow">01 · CONTEXT</div>
      <h2>Report context</h2>
    </div>
    <dl class="print-context-grid">
      <div><dt>Report title</dt><dd>${escapeHTML(r.title || 'Untitled usability report')}</dd></div>
      <div><dt>Evaluator</dt><dd>${escapeHTML(m.evaluator || '—')}</dd></div>
      <div><dt>Interface / project</dt><dd>${escapeHTML(m.interfaceName || '—')}</dd></div>
      <div><dt>Evaluation method</dt><dd>${escapeHTML(m.method || '—')}</dd></div>
      <div class="full"><dt>Evaluation goal / task</dt><dd>${escapeHTML(m.goal || '—')}</dd></div>
    </dl>`;
}

function updateMetadata() {
  const r = currentReport();
  r.title = $('#reportTitle').value.trim() || 'Untitled usability report';
  r.metadata = {
    evaluator: $('#evaluator').value,
    interfaceName: $('#interfaceName').value,
    method: $('#method').value,
    goal: $('#goal').value
  };
  $('#appTitle').textContent = r.title;
  touch();
}

function newFinding() {
  const next = currentReport().findings.length + 1;
  const ts = nowISO();
  return {id:`F-${String(next).padStart(2,'0')}`, location:'', category:'', severity:'Moderate', heuristicId:'', relatedIds:[], description:'', why:'', recommendation:'', evidence:'', created:ts, modified:ts};
}

function addFinding() {
  const f = newFinding();
  currentReport().findings.push(f);
  currentReport().modified = nowISO();
  persist();
  state.editingFindingId = f.id;
  renderFindings();
  openFindingEditor(f.id, true);
}

function findFinding(id) { return currentReport().findings.find(f=>f.id===id); }

function getFilteredFindings() {
  let arr = [...currentReport().findings];
  const q = $('#findingSearch').value.trim().toLowerCase();
  const sev = $('#severityFilter').value;
  const cat = $('#categoryFilter').value;
  const heu = $('#heuristicFilter').value;
  arr = arr.filter(f => {
    const h = HEURISTICS.find(x=>x.id===f.heuristicId);
    const hay = [f.id,f.location,f.category,f.description,f.why,f.recommendation,f.evidence,h?.name,h?.sourceShort].join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (sev==='all'||f.severity===sev) && (cat==='all'||f.category===cat) && (heu==='all'||f.heuristicId===heu);
  });
  const sort = $('#sortFindings').value;
  const rank = {Serious:1, Moderate:2, Minor:3};
  arr.sort((a,b) => sort==='id' ? a.id.localeCompare(b.id) : sort==='location' ? a.location.localeCompare(b.location) : sort==='created' ? a.created.localeCompare(b.created) : (rank[a.severity]-rank[b.severity] || a.id.localeCompare(b.id)));
  return arr;
}

function renderFindings() {
  const arr = getFilteredFindings();
  const body = $('#findingsTableBody');
  body.innerHTML = arr.map(f => {
    const h = HEURISTICS.find(x=>x.id===f.heuristicId);
    return `<tr class="${f.severity.toLowerCase()} ${state.editingFindingId===f.id?'active':''}" data-row-id="${escapeHTML(f.id)}">
      <td><div class="row-id">${escapeHTML(f.id)}</div><div class="row-location">${escapeHTML(f.location || 'No location entered')}</div></td>
      <td><div class="row-severity ${f.severity.toLowerCase()}">${escapeHTML(f.severity)}</div></td>
      <td><div class="row-category">${escapeHTML(f.category || '—')}</div></td>
      <td>${h ? `<div class="row-heuristic">${escapeHTML(h.name)}</div><div class="row-heuristic-meta">${escapeHTML(h.sourceShort)}</div>` : '<span class="row-heuristic-meta">Not selected</span>'}</td>
      <td><div class="cell-clamp">${escapeHTML(f.description || 'No description entered')}</div></td>
      <td><div class="cell-clamp">${escapeHTML(f.recommendation || '—')}</div></td>
    </tr>`;
  }).join('');
  $('#emptyState').classList.toggle('hidden', currentReport().findings.length > 0);
  $('#tableCount').textContent = `${arr.length} ${arr.length===1?'finding':'findings'} shown${arr.length !== currentReport().findings.length ? ` of ${currentReport().findings.length}` : ''}`;
  $$('#findingsTableBody [data-row-id]').forEach(row=>row.addEventListener('click',()=>openFindingEditor(row.dataset.rowId)));
  if (!state.editingFindingId) $('#findingEditor').classList.add('hidden');
}

function openFindingEditor(id, focusLocation=false) {
  const f = findFinding(id);
  if (!f) return;
  state.editingFindingId = id;
  renderFindings();
  const panel = $('#findingEditor');
  const h = HEURISTICS.find(x=>x.id===f.heuristicId);
  const related = (f.relatedIds||[]).map(x=>HEURISTICS.find(h=>h.id===x)).filter(Boolean);
  const categories = [...new Set(HEURISTICS.map(x=>x.category))].sort();
  panel.innerHTML = `
    <div class="editor-header">
      <div><div class="editor-title">Edit ${escapeHTML(f.id)}</div><div class="editor-subtitle">Enter the finding, then return to the table.</div></div>
      <div class="editor-actions"><button class="button danger-outline" data-editor-action="delete">Delete</button><button class="button secondary" data-editor-action="cancel">Close</button><button class="button primary" data-editor-action="save">Save finding</button></div>
    </div>
    <div class="editor-grid">
      <label><span>ID</span><input id="edit-id" maxlength="12" value="${escapeHTML(f.id)}"></label>
      <label><span>Location</span><input id="edit-location" placeholder="e.g. Checkout > Payment" value="${escapeHTML(f.location)}"></label>
      <label><span>Issue category</span><select id="edit-category"><option value="">Select category</option>${categories.map(c=>`<option value="${escapeHTML(c)}" ${f.category===c?'selected':''}>${escapeHTML(c)}</option>`).join('')}</select></label>
      <div><span class="field-label">Severity</span><div class="severity-buttons">${['Serious','Moderate','Minor'].map(s=>`<button type="button" class="severity-button ${f.severity===s?'active':''}" data-severity="${s}">${s}</button>`).join('')}</div></div>
      <label class="full"><span>Description</span><textarea id="edit-description" rows="3" placeholder="What happened? Describe the issue and the evidence you observed.">${escapeHTML(f.description)}</textarea></label>
      <div class="full">
        <span class="field-label">Primary heuristic</span>
        <div class="selected-heuristic-box">
          <div>${h ? `<div class="selected-heuristic-name">${escapeHTML(h.name)}</div><div class="selected-heuristic-meta">${escapeHTML(h.sourceShort)} · ${escapeHTML(h.category)}</div>` : '<div class="selected-heuristic-meta">No heuristic selected</div>'}</div>
          <div class="heuristic-actions"><button type="button" class="button secondary" data-editor-action="library">${h?'Change':'Choose heuristic'}</button></div>
        </div>
      </div>
      ${related.length ? `<div class="full"><span class="field-label">Related principles</span><div class="related-detail">${related.map(x=>`<span>${escapeHTML(x.name)} · ${escapeHTML(x.sourceShort)}</span>`).join('')}</div></div>` : ''}
      <label class="full"><span>Why does this heuristic apply? <em class="optional-note">optional</em></span><textarea id="edit-why" rows="2" placeholder="Explain the relationship between the observed issue and the heuristic.">${escapeHTML(f.why)}</textarea></label>
      <label class="full"><span>Recommendation</span><textarea id="edit-recommendation" rows="2" placeholder="What could be changed or tested next?">${escapeHTML(f.recommendation)}</textarea></label>
      <label class="full"><span>Evidence / notes <em class="optional-note">optional</em></span><textarea id="edit-evidence" rows="2" placeholder="Participant comment, frequency, screenshot reference, observation, etc.">${escapeHTML(f.evidence)}</textarea></label>
    </div>`;
  panel.classList.remove('hidden');
  bindEditor(f);
  panel.scrollIntoView({behavior:'smooth',block:'start'});
  if (focusLocation) setTimeout(()=>$('#edit-location')?.focus(),80);
}

function readEditorIntoFinding(f) {
  f.id = $('#edit-id').value.trim() || 'F-00';
  f.location = $('#edit-location').value;
  f.category = $('#edit-category').value;
  f.description = $('#edit-description').value;
  f.why = $('#edit-why').value;
  f.recommendation = $('#edit-recommendation').value;
  f.evidence = $('#edit-evidence').value;
  f.modified = nowISO();
}

function requestDeleteFinding() {
  const id = state.editingFindingId;
  if (!id) return;
  const f = findFinding(id);
  if (!f) return;
  state.findingToDelete = id;
  $('#findingDeleteHeading').textContent = `Delete ${f.id}?`;
  openModal('findingDeleteModal');
}

function deleteFindingConfirmed() {
  const id = state.findingToDelete;
  const report = currentReport();
  const index = report.findings.findIndex(f => f.id === id);
  if (index < 0) return;
  report.findings.splice(index, 1);
  report.modified = nowISO();
  state.findingToDelete = null;
  state.editingFindingId = null;
  persist();
  $('#findingEditor').classList.add('hidden');
  closeModal('findingDeleteModal');
  renderFindings();
  renderReports();
  toast('Finding deleted');
}

function saveFinding() {
  const oldId = state.editingFindingId;
  const f = findFinding(oldId);
  if (!f) return;
  readEditorIntoFinding(f);
  currentReport().modified = nowISO();
  state.editingFindingId = null;
  persist();
  $('#saveState').textContent = 'Saved';
  $('#findingEditor').classList.add('hidden');
  renderFindings();
  toast('Finding saved');
}

function closeFindingEditor() {
  state.editingFindingId = null;
  $('#findingEditor').classList.add('hidden');
  renderFindings();
}

function bindEditor(f) {
  $$('.severity-button').forEach(btn=>btn.addEventListener('click',()=>{
    f.severity = btn.dataset.severity;
    $$('.severity-button').forEach(x=>x.classList.toggle('active',x===btn));
    markEdited(f);
  }));
  $('#edit-id').addEventListener('input',()=>{f.id=$('#edit-id').value; markEdited(f);});
  ['edit-location','edit-category','edit-description','edit-why','edit-recommendation','edit-evidence'].forEach(id=>{
    const el=$('#'+id);
    const sync = () => {
      if (id==='edit-location') f.location = el.value;
      else if (id==='edit-category') f.category = el.value;
      else if (id==='edit-description') f.description = el.value;
      else if (id==='edit-why') f.why = el.value;
      else if (id==='edit-recommendation') f.recommendation = el.value;
      else if (id==='edit-evidence') f.evidence = el.value;
      markEdited(f);
    };
    el.addEventListener(el.tagName==='SELECT'?'change':'input', sync);
  });
  $('#findingEditor').querySelector('[data-editor-action="save"]').addEventListener('click',saveFinding);
  $('#findingEditor').querySelector('[data-editor-action="cancel"]').addEventListener('click',closeFindingEditor);
  $('#findingEditor').querySelector('[data-editor-action="delete"]').addEventListener('click',requestDeleteFinding);
  $('#findingEditor').querySelector('[data-editor-action="library"]').addEventListener('click',()=>openLibrary(f));
}

function markEdited(f) {
  f.modified = nowISO();
  currentReport().modified = nowISO();
  $('#saveState').textContent = 'Editing';
  clearTimeout(markEdited.timer);
  markEdited.timer = setTimeout(()=>{persist(); $('#saveState').textContent='Saved'; renderReports();},450);
}

function handleFindingTableKeys(e) {
  if (e.key==='Escape') closeFindingEditor();
}

function openLibrary(f) {
  state.currentFindingForLibrary = f;
  state.librarySelectedId = f?.heuristicId || null;
  state.librarySource = 'all';
  state.libraryCategory = 'all';
  $('#librarySearch').value = '';
  $$('#sourceChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.librarySource==='all'));
  $$('#libraryCategoryChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.libraryCategory==='all'));
  openModal('libraryModal');
  renderLibraryList();
}

function getFilteredHeuristics() {
  const q = $('#librarySearch').value.trim().toLowerCase();
  return HEURISTICS.filter(h=>{
    const hay = [h.name,h.source,h.category,h.summary,h.example,...h.lookFor].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && (state.librarySource==='all'||h.source===state.librarySource) && (state.libraryCategory==='all'||h.category===state.libraryCategory);
  }).sort((a,b)=>a.priority-b.priority || a.name.localeCompare(b.name));
}

function renderLibraryList() {
  const list = $('#heuristicList');
  const arr = getFilteredHeuristics();
  list.innerHTML = arr.length ? arr.map(h=>`<div class="heuristic-list-item ${state.librarySelectedId===h.id?'active':''}" data-library-id="${escapeHTML(h.id)}"><div class="source">${escapeHTML(h.source)}</div><div class="name">${escapeHTML(h.name)}</div><div class="category">${escapeHTML(h.category)}</div></div>`).join('') : '<div class="detail-empty">No matching heuristics.</div>';
  $$('#heuristic-list-item',list);
  $$('.heuristic-list-item',list).forEach(x=>x.addEventListener('click',()=>{state.librarySelectedId=x.dataset.libraryId; renderLibraryList(); renderLibraryDetail();}));
  if (!state.librarySelectedId && arr[0]) state.librarySelectedId = arr[0].id;
  if (state.librarySelectedId && !arr.some(h=>h.id===state.librarySelectedId) && arr[0]) state.librarySelectedId=arr[0].id;
  renderLibraryDetail();
}

function renderLibraryDetail() {
  const h = HEURISTICS.find(x=>x.id===state.librarySelectedId);
  $('#selectHeuristicBtn').disabled = !h;
  const detail = $('#heuristicDetail');
  if (!h) { detail.innerHTML='<div class="detail-empty">Select a heuristic.</div>'; $('#libraryContext').textContent=''; return; }
  $('#libraryContext').textContent = `${h.source} · ${h.category}`;
  const related = (h.related||[]).map(id=>HEURISTICS.find(x=>x.id===id)).filter(Boolean);
  detail.innerHTML = `<div class="detail-kicker">${escapeHTML(h.source)}</div><div class="detail-title">${escapeHTML(h.name)}</div><div class="detail-category">${escapeHTML(h.category)}</div>
    <div class="detail-section"><h3>What it means</h3><p>${escapeHTML(h.summary)}</p></div>
    <div class="detail-section"><h3>Look for</h3><ul>${h.lookFor.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul></div>
    <div class="detail-section"><h3>Example</h3><div class="example-box">${escapeHTML(h.example)}</div></div>
    <div class="detail-section"><h3>Related principles</h3><div class="related-detail">${related.length?related.map(x=>`<span>${escapeHTML(x.name)} · ${escapeHTML(x.sourceShort)}</span>`).join(''):'<span>None noted</span>'}</div></div>`;
}

function applyLibrarySelection() {
  const h = HEURISTICS.find(x=>x.id===state.librarySelectedId);
  const f = state.currentFindingForLibrary;
  if (!h || !f) return;
  f.heuristicId = h.id;
  f.relatedIds = (h.related||[]).slice();
  if (!f.category) f.category = h.category;
  f.modified = nowISO();
  currentReport().modified = nowISO();
  persist();
  closeModal('libraryModal');
  $('#saveState').textContent='Saved';
  openFindingEditor(f.id);
}

function openModal(id) { const el=$('#'+id); el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
function closeModal(id) { const el=$('#'+id); if(el){el.classList.add('hidden'); el.setAttribute('aria-hidden','true');} }

function renderReports() {
  const list = $('#reportsList');
  const arr = Object.values(state.reports).sort((a,b)=>b.modified.localeCompare(a.modified));
  list.innerHTML = arr.map(r=>`<div class="report-row"><div><div class="report-name">${escapeHTML(r.title)}${r.id===state.activeId?' · open':''}</div><div class="report-meta-line">${r.findings.length} ${r.findings.length===1?'finding':'findings'} · edited ${formatDate(r.modified)}</div></div><div class="report-actions"><button class="button secondary" data-report-open="${escapeHTML(r.id)}">Open</button><button class="button secondary" data-report-rename="${escapeHTML(r.id)}">Rename</button><button class="button secondary" data-report-duplicate="${escapeHTML(r.id)}">Duplicate</button><button class="button secondary" data-report-delete="${escapeHTML(r.id)}">Delete</button></div></div>`).join('');
  $$('[data-report-open]',list).forEach(b=>b.onclick=()=>{state.activeId=b.dataset.reportOpen; state.editingFindingId=null; persist(); populateContext(); renderFindings(); renderReports(); closeModal('reportsModal');});
  $$('[data-report-rename]',list).forEach(b=>b.onclick=()=>renameReport(b.dataset.reportRename));
  $$('[data-report-duplicate]',list).forEach(b=>b.onclick=()=>duplicateReport(b.dataset.reportDuplicate));
  $$('[data-report-delete]',list).forEach(b=>b.onclick=()=>{state.reportToDelete=b.dataset.reportDelete;openModal('confirmModal');});
}

function createReport() {
  const name = prompt('Name this report','Untitled usability report');
  if (name===null) return;
  const r = defaultReport(name.trim() || 'Untitled usability report');
  state.reports[r.id]=r; state.activeId=r.id; state.editingFindingId=null; persist(); populateContext(); renderFindings(); renderReports(); closeModal('reportsModal');
}
function renameReport(id) {
  const r=state.reports[id]; const name=prompt('Rename report',r.title); if(name===null)return;
  r.title=name.trim()||r.title; r.modified=nowISO(); persist(); populateContext(); renderReports();
}
function duplicateReport(id) {
  const src=state.reports[id]; const name=prompt('Name the duplicate',`${src.title} copy`); if(name===null)return;
  const copy=JSON.parse(JSON.stringify(src)); copy.id=uid('report'); copy.title=name.trim()||`${src.title} copy`; copy.created=nowISO(); copy.modified=copy.created;
  state.reports[copy.id]=copy; state.activeId=copy.id; state.editingFindingId=null; persist(); populateContext(); renderFindings(); renderReports(); closeModal('reportsModal');
}
function deleteConfirmed() {
  const id=state.reportToDelete; if(!state.reports[id])return;
  delete state.reports[id];
  if(!Object.keys(state.reports).length){ const r=defaultReport(); state.reports[r.id]=r; state.activeId=r.id; }
  else if(id===state.activeId) state.activeId=Object.keys(state.reports)[0];
  state.reportToDelete=null; state.editingFindingId=null; persist(); populateContext(); renderFindings(); renderReports(); closeModal('confirmModal');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify({schema:'ddes-usability-report/v2', exported:nowISO(), report:currentReport()},null,2)],{type:'application/json'});
  downloadBlob(blob,`${slug(currentReport().title)}.json`); toast('JSON exported');
}
async function handleImport(e) {
  const file=e.target.files[0]; if(!file)return;
  try {
    const data=JSON.parse(await file.text()); const src=normaliseReport(data.report||data);
    if(!src.findings||!src.metadata) throw new Error('Not a supported report');
    const copy=JSON.parse(JSON.stringify(src)); copy.id=uid('report'); copy.title=copy.title||'Imported usability report'; copy.modified=nowISO();
    state.reports[copy.id]=copy; state.activeId=copy.id; state.editingFindingId=null; persist(); populateContext(); renderFindings(); renderReports(); closeModal('reportsModal'); toast('Report imported');
  } catch(err) { alert('Could not import this file. Please use JSON exported by this tool.'); }
  finally { e.target.value=''; }
}
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function printReport() {
  renderPrintContext();
  $('#printTimestamp').textContent = `Generated: ${formatDate(nowISO())}`;
  state.editingFindingId=null;
  $('#findingEditor').classList.add('hidden');
  window.print();
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1700); }

function bindStaticEvents() {
  $('#reportsBtn').addEventListener('click',()=>{renderReports();openModal('reportsModal');});
  $('#libraryBtn').addEventListener('click',()=>openLibrary(null));
  $('#printBtn').addEventListener('click',printReport);
  $('#addFindingBtn').addEventListener('click',addFinding);
  $('#emptyAddBtn').addEventListener('click',addFinding);
  $('#newReportBtn').addEventListener('click',createReport);
  $('#exportBtn').addEventListener('click',exportJSON);
  $('#importBtn').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',handleImport);
  $('#confirmDeleteBtn').addEventListener('click',deleteConfirmed);
  $('#confirmDeleteFindingBtn').addEventListener('click',deleteFindingConfirmed);
  $('#selectHeuristicBtn').addEventListener('click',applyLibrarySelection);
  ['reportTitle','evaluator','interfaceName','goal'].forEach(id=>$('#'+id).addEventListener('input',updateMetadata));
  $('#method').addEventListener('change',updateMetadata);
  ['findingSearch','severityFilter','categoryFilter','heuristicFilter','sortFindings'].forEach(id=>{
    const el=$('#'+id); el.addEventListener('input',renderFindings); el.addEventListener('change',renderFindings);
  });
  $('#librarySearch').addEventListener('input',renderLibraryList);
  $('#sourceChips').addEventListener('click',e=>{const b=e.target.closest('[data-library-source]'); if(!b)return; state.librarySource=b.dataset.librarySource; $$('#sourceChips .chip').forEach(x=>x.classList.toggle('active',x===b)); renderLibraryList();});
  $('#libraryCategoryChips').addEventListener('click',e=>{const b=e.target.closest('[data-library-category]'); if(!b)return; state.libraryCategory=b.dataset.libraryCategory; $$('#libraryCategoryChips .chip').forEach(x=>x.classList.toggle('active',x===b)); renderLibraryList();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-close]'); if(b)closeModal(b.dataset.close);});
  document.addEventListener('keydown',handleFindingTableKeys);
}

init();
