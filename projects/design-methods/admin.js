const STAGES = ['Discovery', 'Define', 'Develop', 'Deliver'];
const INDEX_PATH = ['data', 'methods.index.json'];
const METHODS_DIR = ['data', 'methods'];

const state = {
  rootHandle: null,
  methods: [],
  index: [],
  files: new Map(),
  selectedId: null,
  isNew: false,
  originalId: null,
  dirty: false,
  activeTab: 'process',
  lastFocusedField: null,
  formatTarget: null
};

const elements = {
  connect: document.getElementById('connect-project'),
  environment: document.getElementById('environment-banner'),
  projectName: document.getElementById('project-name'),
  projectStatus: document.getElementById('project-status'),
  projectStats: document.getElementById('project-stats'),
  methodCount: document.getElementById('method-count'),
  errorCount: document.getElementById('error-count'),
  workspace: document.getElementById('workspace'),
  methodList: document.getElementById('method-list'),
  search: document.getElementById('method-search'),
  newMethod: document.getElementById('new-method'),
  form: document.getElementById('method-form'),
  editorMode: document.getElementById('editor-mode'),
  editorTitle: document.getElementById('editor-title'),
  name: document.getElementById('method-name'),
  id: document.getElementById('method-id'),
  description: document.getElementById('method-description'),
  whenToUse: document.getElementById('method-when-to-use'),
  lookout: document.getElementById('lookout-list'),
  addLookout: document.getElementById('add-lookout'),
  stageOptions: document.getElementById('stage-options'),
  steps: document.getElementById('steps-list'),
  resources: document.getElementById('resources-list'),
  preview: document.getElementById('method-preview'),
  addStep: document.getElementById('add-step'),
  addResource: document.getElementById('add-resource'),
  duplicate: document.getElementById('duplicate-method'),
  delete: document.getElementById('delete-method'),
  save: document.getElementById('save-method'),
  toast: document.getElementById('toast')
};

function isLocalHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function supportsFileSystemAccess() {
  return 'showDirectoryPicker' in window && 'FileSystemDirectoryHandle' in window;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatInline(value = '') {
  let text = escapeHtml(value);
  text = text.replace(/\r?\n/g, '<br>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\[u\](.+?)\[\/u\]/g, '<u>$1</u>');
  return text;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? '#b00020' : '#111';
  elements.toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove('show'), 2800);
}

function setDirty(value) {
  state.dirty = value;
  const label = state.isNew ? 'Create method' : 'Edit method';
  elements.editorMode.textContent = state.dirty ? `${label} · unsaved` : label;
}

function confirmDiscard() {
  return !state.dirty || window.confirm('You have unsaved changes. Discard them?');
}

function getStageChecks() {
  return [...elements.stageOptions.querySelectorAll('input[type="checkbox"]')];
}

function getCurrentMethod() {
  return {
    name: elements.name.value.trim(),
    stages: getStageChecks().filter(input => input.checked).map(input => input.value),
    description: elements.description.value.trim(),
    whenToUse: elements.whenToUse.value.trim(),
    steps: [...elements.steps.querySelectorAll('textarea[data-field="step"]')]
      .map(input => input.value.trim())
      .filter(Boolean),
    lookOutFor: [...elements.lookout.querySelectorAll('textarea[data-field="lookout"]')]
      .map(input => input.value.trim())
      .filter(Boolean),
    resources: [...elements.resources.querySelectorAll('.resource-row')]
      .map(row => {
        const type = row.querySelector('[data-field="type"]').value;
        if (type === 'reference') {
          return {
            type,
            citation: row.querySelector('[data-field="citation"]')?.value.trim() || ''
          };
        }
        return {
          type,
          title: row.querySelector('[data-field="title"]').value.trim(),
          url: row.querySelector('[data-field="url"]').value.trim()
        };
      })
      .filter(item => item.type === 'reference' ? item.citation : (item.title || item.url))
  };
}

function renderStageOptions(selected = []) {
  elements.stageOptions.innerHTML = STAGES.map(stage => `
    <label class="check-option">
      <input type="checkbox" value="${escapeHtml(stage)}" ${selected.includes(stage) ? 'checked' : ''}>
      <span>${escapeHtml(stage)}</span>
    </label>
  `).join('');
}

function setFormattingTarget(field) {
  if (!field || !['TEXTAREA', 'INPUT'].includes(field.tagName)) return;
  if (field.dataset.field === 'title' || field.id === 'method-id' || field.id === 'method-name') return;

  state.formatTarget = field;
  state.lastFocusedField = field;

  const toolbar = document.getElementById('shared-format-toolbar');
  const targetLabel = document.getElementById('format-target');
  if (!toolbar || !targetLabel) return;

  toolbar.querySelectorAll('.format-button').forEach(button => {
    button.disabled = false;
  });

  const labels = {
    'method-description': 'Description',
    'method-when-to-use': 'When to use'
  };

  let label = labels[field.id];
  if (!label && field.dataset.field === 'step') label = 'Process step';
  if (!label && field.dataset.field === 'lookout') label = 'Look out for';
  if (!label && field.dataset.field === 'citation') label = 'Reference';

  targetLabel.textContent = label || 'Active text field';
}

function clearFormattingTarget() {
  const toolbar = document.getElementById('shared-format-toolbar');
  const targetLabel = document.getElementById('format-target');
  if (!toolbar || !targetLabel) return;

  toolbar.querySelectorAll('.format-button').forEach(button => {
    button.disabled = !state.formatTarget;
  });

  if (!state.formatTarget) targetLabel.textContent = 'Select a text field to format';
}

function applyFormatting(field, format) {
  const textarea = typeof field === 'string' ? document.querySelector(field) : field;
  if (!textarea) return;

  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const selected = textarea.value.slice(start, end);
  const markers = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    underline: ['[u]', '[/u]']
  };
  const [open, close] = markers[format] || markers.bold;
  const replacement = `${open}${selected || 'text'}${close}`;

  textarea.setRangeText(replacement, start, end, 'select');
  textarea.focus();
  handleEditorInput();
}

function bindSharedFormattingToolbar() {
  const toolbar = document.getElementById('shared-format-toolbar');
  if (!toolbar) return;

  document.addEventListener('focusin', event => {
    if (event.target.matches('#method-description, #method-when-to-use, textarea[data-field="step"], textarea[data-field="lookout"], textarea[data-field="citation"]')) {
      setFormattingTarget(event.target);
    }
  });

  toolbar.addEventListener('mousedown', event => {
    if (event.target.closest('.format-button')) event.preventDefault();
  });

  toolbar.querySelectorAll('.format-button').forEach(button => {
    button.addEventListener('click', () => {
      if (state.formatTarget) applyFormatting(state.formatTarget, button.dataset.format);
    });
  });
}

function addStep(value = '') {
  const row = document.createElement('div');
  row.className = 'repeat-row';

  const content = document.createElement('div');
  content.className = 'repeat-row-content';

  const textarea = document.createElement('textarea');
  textarea.rows = 2;
  textarea.placeholder = 'Describe this step';
  textarea.dataset.field = 'step';
  textarea.value = value;
  textarea.addEventListener('input', handleEditorInput);


  const remove = document.createElement('button');
  remove.className = 'icon-button';
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Remove step');
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    row.remove();
    setDirty(true);
    updatePreview();
  });

  content.append(textarea);
  row.append(content, remove);
  elements.steps.appendChild(row);
}

function addLookout(value = '') {
  const row = document.createElement('div');
  row.className = 'repeat-row lookout-row';

  const content = document.createElement('div');
  content.className = 'repeat-row-content';

  const textarea = document.createElement('textarea');
  textarea.rows = 2;
  textarea.placeholder = 'Describe something to look out for';
  textarea.dataset.field = 'lookout';
  textarea.value = value;
  textarea.addEventListener('input', handleEditorInput);


  const remove = document.createElement('button');
  remove.className = 'icon-button';
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Remove consideration');
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    row.remove();
    setDirty(true);
    updatePreview();
  });

  content.append(textarea);
  row.append(content, remove);
  elements.lookout.appendChild(row);
}

function renderResourceFields(row, resource = {}) {
  const type = row.querySelector('[data-field="type"]').value;
  const target = row.querySelector('.resource-target');
  const titleInput = row.querySelector('[data-field="title"]');

  row.classList.toggle('resource-reference', type === 'reference');

  if (type === 'reference') {
    titleInput.hidden = true;
    titleInput.value = '';
    target.innerHTML = `
      <textarea data-field="citation" rows="3" placeholder="Full citation"></textarea>
      <p class="field-note">Add the bibliographic citation. It will appear as text in Further Material.</p>
    `;
    target.querySelector('[data-field="citation"]').value = resource.citation || '';
  } else {
    titleInput.hidden = false;
    target.innerHTML = `
      <input data-field="url" type="text" inputmode="url" autocomplete="off" placeholder="https://... or assets/...">
      <p class="field-note">Use a web URL or a path inside this project.</p>
    `;
    target.querySelector('[data-field="url"]').value = resource.url || '';
  }

  target.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', handleEditorInput);
  });
}

function addResource(resource = {}) {
  const row = document.createElement('div');
  row.className = 'resource-row';
  row.innerHTML = `
    <select data-field="type" aria-label="Resource type">
      <option value="link">Link</option>
      <option value="download">Download</option>
      <option value="reference">Reference</option>
    </select>
    <input data-field="title" type="text" placeholder="Resource title">
    <div class="resource-target"></div>
    <button class="icon-button" type="button" aria-label="Remove resource">×</button>
  `;

  const select = row.querySelector('[data-field="type"]');
  select.value = resource.type || 'link';
  row.querySelector('[data-field="title"]').value = resource.title || '';
  row.querySelector('[data-field="title"]').addEventListener('input', handleEditorInput);
  select.addEventListener('change', () => {
    renderResourceFields(row, resource);
    handleEditorInput();
  });

  row.querySelector('button').addEventListener('click', () => {
    row.remove();
    setDirty(true);
    updatePreview();
  });

  renderResourceFields(row, resource);
  elements.resources.appendChild(row);
}

function clearEditor() {
  elements.name.value = '';
  elements.id.value = '';
  elements.description.value = '';
  elements.whenToUse.value = '';
  renderStageOptions([]);
  elements.steps.innerHTML = '';
  elements.lookout.innerHTML = '';
  elements.resources.innerHTML = '';
  state.formatTarget = null;
  clearFormattingTarget();
  addStep();
  setActiveTab('process');
  updatePreview();
}

function setEditorHeader(mode, title, { showActions = false } = {}) {
  elements.editorMode.textContent = mode;
  elements.editorTitle.textContent = title;
  elements.duplicate.hidden = !showActions;
  elements.delete.hidden = !showActions;
  elements.save.hidden = !showActions;
}

function showProjectEmptyEditor() {
  state.isNew = false;
  state.selectedId = null;
  state.originalId = null;
  elements.form.hidden = true;
  setEditorHeader('Project connected', 'Select a method');
  setDirty(false);
}

function populateEditor(method, { isNew = false } = {}) {
  state.isNew = isNew;
  state.selectedId = method?.id || null;
  state.originalId = method?.id || null;
  elements.form.hidden = false;
  setEditorHeader(isNew ? 'Create method' : 'Edit method', method?.name || 'New method', { showActions: true });
  elements.name.value = method?.name || '';
  elements.id.value = method?.id || '';
  elements.description.value = method?.description || '';
  elements.whenToUse.value = method?.whenToUse || '';
  renderStageOptions(method?.stages || []);
  elements.steps.innerHTML = '';
  (method?.steps || []).forEach(addStep);
  if (!elements.steps.children.length) addStep();
  elements.lookout.innerHTML = '';
  (method?.lookOutFor || []).forEach(addLookout);
  elements.resources.innerHTML = '';
  (method?.resources || []).forEach(addResource);
  state.formatTarget = null;
  clearFormattingTarget();
  updatePreview();
  setDirty(false);
  renderMethodList();
}

function updatePreview() {
  const method = getCurrentMethod();
  const stages = method.stages.length
    ? method.stages.map(stage => `<span class="preview-stage">${escapeHtml(stage)}</span>`).join('')
    : '<span class="muted">No phases selected</span>';

  const steps = method.steps.length
    ? `<ol class="preview-list">${method.steps.map(step => `<li>${formatInline(step)}</li>`).join('')}</ol>`
    : '<p class="muted">No steps added.</p>';

  const whenToUse = method.whenToUse
    ? `<div class="preview-when"><strong>When to use</strong><p>${formatInline(method.whenToUse)}</p></div>`
    : '';

  const lookout = method.lookOutFor.length
    ? `<div class="preview-lookout"><strong>Look out for</strong><ul class="preview-lookout-list">${method.lookOutFor.map(item => `<li>${formatInline(item)}</li>`).join('')}</ul></div>`
    : '';

  const resources = method.resources.length
    ? `<div class="preview-resources"><strong>Further material</strong><ul class="preview-list">${method.resources.map(resource => {
        if (resource.type === 'reference') {
          return `<li class="preview-reference">${formatInline(resource.citation)}</li>`;
        }
        return `<li>${escapeHtml(resource.type)} — ${formatInline(resource.title || resource.url || 'Untitled')}</li>`;
      }).join('')}</ul></div>`
    : '';

  elements.preview.innerHTML = `
    <p class="eyebrow">${escapeHtml(state.isNew ? 'New record' : 'Method record')}</p>
    <h3>${escapeHtml(method.name || 'Untitled method')}</h3>
    <div class="preview-stage-row">${stages}</div>
    <p class="preview-description">${formatInline(method.description || 'No description added yet.')}</p>
    ${whenToUse}
    <h4>Steps</h4>
    ${steps}
    ${lookout}
    ${resources}
  `;
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  state.formatTarget = null;
  clearFormattingTarget();
  document.querySelectorAll('.editor-tab').forEach(tab => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.editor-tab-panel').forEach(panel => {
    panel.hidden = panel.id !== `tab-${tabName}`;
    panel.classList.toggle('active', !panel.hidden);
  });
}

function handleEditorInput() {
  if (elements.name.value.trim()) elements.editorTitle.textContent = elements.name.value.trim();
  setDirty(true);
  updatePreview();
}

function isValidResourceTarget(value) {
  const target = String(value || '').trim();
  if (!target) return false;

  // Allow normal web URLs.
  try {
    const url = new URL(target);
    if (['http:', 'https:'].includes(url.protocol)) return true;
  } catch {
    // Treat non-URL values as project-relative paths below.
  }

  // Allow project-relative assets without allowing traversal outside the connected project.
  if (target.startsWith('/') || target.startsWith('\\') || /^[a-zA-Z]:[\\/]/.test(target)) return false;
  if (target.split('/').includes('..') || target.split('\\').includes('..')) return false;
  if (target.includes('\\')) return false;
  return /^[^?#]+(?:[?#].*)?$/.test(target);
}

function validateMethod(method, id, existingId = null) {
  const issues = [];
  if (!method.name) issues.push('Name is required.');
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) issues.push('ID must use lowercase letters, numbers and hyphens.');
  if (method.stages.length === 0) issues.push('Select at least one design phase.');
  if (existingId !== id && state.files.has(id)) issues.push(`A method with ID "${id}" already exists.`);

  for (const resource of method.resources) {
    if (resource.type === 'reference') {
      if (!resource.citation) issues.push('Each reference needs a citation.');
      continue;
    }

    if (!resource.title || !resource.url) {
      issues.push('Each link or download needs a title and a URL or project-relative path.');
    }

    if (resource.url && !isValidResourceTarget(resource.url)) {
      issues.push(`Resource target "${resource.url}" must be a web URL or a project-relative path such as assets/templates/file.pdf.`);
    }

    if (!['link', 'download'].includes(resource.type)) {
      issues.push('Resource type must be link, download, or reference.');
    }
  }

  return issues;
}

async function getMethodsDirectory() {
  let dataHandle;
  try {
    dataHandle = await state.rootHandle.getDirectoryHandle('data');
    return await dataHandle.getDirectoryHandle('methods');
  } catch {
    throw new Error('Could not find data/methods/. Select the design-methods project folder itself.');
  }
}

async function readJsonFile(dirHandle, filename) {
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function writeJsonFile(dirHandle, filename, data) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(`${JSON.stringify(data, null, 2)}\n`);
    await writable.close();
  } catch (error) {
    await writable.abort();
    throw error;
  }
}

async function deleteFile(dirHandle, filename) {
  await dirHandle.removeEntry(filename);
}

async function connectProject() {
  if (!supportsFileSystemAccess()) {
    showToast('This browser does not support local file authoring. Try a Chromium-based browser.', true);
    return;
  }
  if (!isLocalHost()) {
    showToast('Authoring is available only on localhost.', true);
    return;
  }
  try {
    state.rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await initialiseProject();
  } catch (error) {
    if (error?.name !== 'AbortError') showToast(error.message || 'Could not connect to the project.', true);
  }
}

async function initialiseProject() {
  const permission = await state.rootHandle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted') {
    const requested = await state.rootHandle.requestPermission({ mode: 'readwrite' });
    if (requested !== 'granted') throw new Error('Write permission was not granted.');
  }

  const indexHandle = await state.rootHandle.getDirectoryHandle('data');
  const indexFile = await indexHandle.getFileHandle('methods.index.json');
  const index = JSON.parse(await (await indexFile.getFile()).text());
  if (!Array.isArray(index)) throw new Error('methods.index.json must contain an array.');

  const methodsDir = await getMethodsDirectory();
  const files = new Map();

  for await (const [name, handle] of methodsDir.entries()) {
    if (handle.kind !== 'file' || !name.endsWith('.json')) continue;
    try {
      const method = JSON.parse(await (await handle.getFile()).text());
      files.set(name.replace(/\.json$/, ''), method);
    } catch (error) {
      console.warn(`Could not parse ${name}`, error);
    }
  }

  const missing = index.filter(entry => !files.has(entry.id));
  const orphan = [...files.keys()].filter(id => !index.some(entry => entry.id === id));
  state.index = clone(index);
  state.files = files;
  state.methods = index.map(entry => ({ ...(files.get(entry.id) || {}), ...entry, id: entry.id }));

  elements.projectName.textContent = state.rootHandle.name;
  elements.projectStatus.textContent = `${state.methods.length} indexed methods loaded from data/methods/.`;
  elements.methodCount.textContent = state.methods.length;
  elements.errorCount.textContent = missing.length + orphan.length;
  elements.projectStats.hidden = false;
  elements.workspace.hidden = false;

  const issues = [];
  if (missing.length) issues.push(`Missing method file: ${missing.join(', ')}`);
  if (orphan.length) issues.push(`Unindexed method file: ${orphan.join(', ')}`);
  if (issues.length) {
    elements.environment.hidden = false;
    elements.environment.textContent = `Data check: ${issues.join(' ')} The editor will not delete or overwrite these files unless you explicitly edit the affected record.`;
  } else {
    elements.environment.hidden = true;
  }

  renderMethodList();
  showProjectEmptyEditor();
  showToast('Project connected.');
}

function renderMethodList() {
  const query = elements.search.value.trim().toLowerCase();
  const methods = [...state.methods]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(method => `${method.name} ${method.id}`.toLowerCase().includes(query));

  if (!methods.length) {
    elements.methodList.innerHTML = '<div class="method-list-empty"><p class="muted">No matching methods.</p></div>';
    return;
  }

  elements.methodList.innerHTML = methods.map(method => `
    <button class="method-item ${method.id === state.selectedId ? 'active' : ''}" type="button" data-id="${escapeHtml(method.id)}">
      <strong>${escapeHtml(method.name)}</strong>
      <small>${escapeHtml(method.id)} · ${(method.stages || []).join(' / ')}</small>
    </button>
  `).join('');

  elements.methodList.querySelectorAll('.method-item').forEach(button => {
    button.addEventListener('click', () => selectMethod(button.dataset.id));
  });
}

function selectMethod(id) {
  if (!confirmDiscard()) return;
  const method = state.methods.find(item => item.id === id);
  if (!method) return;
  populateEditor(method);
}

function startNewMethod() {
  if (!confirmDiscard()) return;
  populateEditor({ id: '', name: '', stages: [], description: '', whenToUse: '', steps: [], lookOutFor: [], resources: [] }, { isNew: true });
}

function duplicateMethod() {
  const source = getCurrentMethod();
  const base = slugify(source.name) || 'new-method';
  let id = `${base}-copy`;
  let suffix = 2;
  while (state.files.has(id) || id === state.originalId) {
    id = `${base}-copy-${suffix}`;
    suffix += 1;
  }
  const duplicate = { id, ...clone(source), name: `${source.name} Copy` };
  populateEditor(duplicate, { isNew: true });
}

async function saveMethod(event) {
  event.preventDefault();
  if (!state.rootHandle) return;
  const method = getCurrentMethod();
  const id = elements.id.value.trim();
  const issues = validateMethod(method, id, state.originalId);
  if (issues.length) {
    showToast(issues[0], true);
    return;
  }

  try {
    const methodsDir = await getMethodsDirectory();
    const oldId = state.originalId;

    await writeJsonFile(methodsDir, `${id}.json`, method);
    if (oldId && oldId !== id && state.files.has(oldId)) {
      await deleteFile(methodsDir, `${oldId}.json`);
    }

    const indexEntry = state.index.find(entry => entry.id === oldId || entry.id === id);
    if (indexEntry) {
      indexEntry.id = id;
      indexEntry.name = method.name;
      indexEntry.stages = clone(method.stages);
    } else {
      state.index.push({ id, name: method.name, stages: clone(method.stages), summary: ' ' });
    }

    await writeJsonFile(await state.rootHandle.getDirectoryHandle('data'), 'methods.index.json', state.index);
    await initialiseProject();
    selectMethod(id);
    setDirty(false);
    showToast('Method saved to the local repository.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Could not save method.', true);
  }
}

async function deleteSelectedMethod() {
  if (state.isNew || !state.originalId || !state.rootHandle) return;
  const method = state.methods.find(item => item.id === state.originalId);
  if (!method) return;
  if (!window.confirm(`Delete "${method.name}"? This removes the JSON file and its index entry.`)) return;

  try {
    const methodsDir = await getMethodsDirectory();
    if (state.files.has(state.originalId)) await deleteFile(methodsDir, `${state.originalId}.json`);
    state.index = state.index.filter(entry => entry.id !== state.originalId);
    await writeJsonFile(await state.rootHandle.getDirectoryHandle('data'), 'methods.index.json', state.index);
    await initialiseProject();
    showToast('Method deleted.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Could not delete method.', true);
  }
}

elements.connect.addEventListener('click', connectProject);
elements.newMethod.addEventListener('click', startNewMethod);
elements.search.addEventListener('input', renderMethodList);
elements.form.addEventListener('submit', saveMethod);
elements.addStep.addEventListener('click', () => {
  addStep();
  setDirty(true);
  updatePreview();
});
elements.addResource.addEventListener('click', () => {
  addResource();
  setDirty(true);
  updatePreview();
});
elements.name.addEventListener('input', handleEditorInput);
elements.description.addEventListener('input', handleEditorInput);
elements.whenToUse.addEventListener('input', handleEditorInput);
elements.addLookout.addEventListener('click', () => {
  addLookout();
  setDirty(true);
  updatePreview();
});
document.querySelectorAll('.editor-tab').forEach(tab => {
  tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
});
bindSharedFormattingToolbar();
elements.id.addEventListener('input', handleEditorInput);
elements.stageOptions.addEventListener('change', handleEditorInput);
elements.duplicate.addEventListener('click', duplicateMethod);
elements.delete.addEventListener('click', deleteSelectedMethod);

setEditorHeader('Project', 'Connect a project');
setActiveTab('process');

window.addEventListener('beforeunload', event => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

if (!isLocalHost()) {
  elements.environment.hidden = false;
  elements.environment.textContent = 'Authoring is intentionally disabled on the deployed site. Open this page through your local Jekyll server at localhost:4000/ to edit repository files.';
  elements.connect.disabled = true;
} else if (!supportsFileSystemAccess()) {
  elements.environment.hidden = false;
  elements.environment.textContent = 'This browser does not provide the File System Access API needed to write JSON files directly. The public library still works normally; use a Chromium-based browser for local authoring.';
}
