(function () {
  'use strict';

  const STORAGE_KEY = 'ddes1150-interaction-map-v2';
  const fields = {
    title: document.querySelector('#interactionTitle'),
    context: document.querySelector('#context'),
    task: document.querySelector('#task'),
    notes: document.querySelector('#notes')
  };
  const rowsContainer = document.querySelector('#mapRows');
  const tabsContainer = document.querySelector('#mapTabs');
  const saveStatus = document.querySelector('#saveStatus');
  const activeMapName = document.querySelector('#activeMapName');
  const printMaps = document.querySelector('#printMaps');
  const mapToolsDialog = document.querySelector('#mapToolsDialog');
  const myMapsDialog = document.querySelector('#myMapsDialog');
  const helpDialog = document.querySelector('#helpDialog');
  const importFileInput = document.querySelector('#importFileInput');

  let workspace = loadWorkspace() || createWorkspace();
  let saveTimer;

  function uid() {
    return 'map-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function blankRow() {
    return { doing: '', knowing: '', feeling: '', input: '', process: '', output: '' };
  }

  function blankMap(name) {
    return { id: uid(), name: name || 'Untitled interaction', context: '', task: '', notes: '', rows: [blankRow()], updated: Date.now() };
  }

  function createWorkspace() {
    const map = blankMap();
    return { activeId: map.id, maps: [map] };
  }

  function loadWorkspace() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normaliseWorkspace(saved);
    } catch (error) { return null; }
  }

  function normaliseWorkspace(saved) {
    if (!saved || !Array.isArray(saved.maps) || !saved.maps.length) return null;
    const maps = saved.maps.map(function (map) {
      return {
        id: map.id || uid(), name: map.name || 'Untitled interaction', context: map.context || '', task: map.task || '', notes: map.notes || '',
        rows: Array.isArray(map.rows) && map.rows.length ? map.rows.map(function (row) { return Object.assign(blankRow(), row); }) : [blankRow()],
        updated: map.updated || Date.now()
      };
    });
    return { activeId: maps.some(function (map) { return map.id === saved.activeId; }) ? saved.activeId : maps[0].id, maps: maps };
  }

  function activeMap() {
    return workspace.maps.find(function (map) { return map.id === workspace.activeId; }) || workspace.maps[0];
  }

  function saveWorkspace() {
    const map = activeMap();
    map.updated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    saveStatus.textContent = 'Saved locally';
    saveStatus.classList.remove('is-unsaved');
  }

  function markUnsaved() {
    saveStatus.textContent = 'Saving…';
    saveStatus.classList.add('is-unsaved');
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveWorkspace, 350);
  }

  function render() {
    const map = activeMap();
    fields.title.value = map.name || '';
    fields.context.value = map.context || '';
    fields.task.value = map.task || '';
    fields.notes.value = map.notes || '';
    activeMapName.textContent = map.name || 'Untitled interaction';
    renderTabs();
    rowsContainer.innerHTML = '';
    map.rows.forEach(function (row, index) { rowsContainer.appendChild(createRow(row, index)); });
    renderSavedMaps();
  }

  function renderTabs() {
    tabsContainer.innerHTML = '';
    workspace.maps.forEach(function (map) {
      const tab = document.createElement('div');
      tab.className = 'map-tab' + (map.id === workspace.activeId ? ' is-active' : '');
      tab.setAttribute('role', 'tab');
      tab.tabIndex = 0;
      tab.setAttribute('aria-selected', map.id === workspace.activeId ? 'true' : 'false');
      const label = document.createElement('span');
      label.textContent = map.name || 'Untitled interaction';
      tab.appendChild(label);
      tab.title = map.name || 'Untitled interaction';
      tab.addEventListener('click', function () { workspace.activeId = map.id; render(); saveWorkspace(); });
      tab.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); workspace.activeId = map.id; render(); saveWorkspace(); } });
      const close = document.createElement('button');
      close.className = 'map-tab-close';
      close.type = 'button';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Delete ' + (map.name || 'map'));
      close.addEventListener('click', function (event) { event.stopPropagation(); deleteMap(map); });
      tab.appendChild(close);
      tabsContainer.appendChild(tab);
    });
  }

  function createRow(row, index) {
    const tr = document.createElement('tr');
    const moment = document.createElement('td');
    moment.innerHTML = '<span>Moment ' + String(index + 1).padStart(2, '0') + '</span>';
    if (activeMap().rows.length > 1) {
      const remove = document.createElement('button');
      remove.className = 'row-delete';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', function () {
        activeMap().rows.splice(index, 1);
        render();
        saveWorkspace();
      });
      moment.appendChild(document.createElement('br'));
      moment.appendChild(remove);
    }
    tr.appendChild(moment);
    ['doing', 'knowing', 'feeling', 'input', 'process', 'output'].forEach(function (key) {
      const td = document.createElement('td');
      const textarea = document.createElement('textarea');
      textarea.rows = 4;
      textarea.value = row[key] || '';
      textarea.placeholder = 'Add a note…';
      textarea.setAttribute('aria-label', key + ' for moment ' + (index + 1));
      textarea.addEventListener('input', function () {
        activeMap().rows[index][key] = textarea.value;
        markUnsaved();
      });
      td.appendChild(textarea);
      tr.appendChild(td);
    });
    return tr;
  }

  function newMap() {
    const name = window.prompt('Name this map', 'Untitled interaction');
    if (name === null) return;
    const map = blankMap(name.trim() || 'Untitled interaction');
    workspace.maps.push(map);
    workspace.activeId = map.id;
    render();
    saveWorkspace();
    fields.title.focus();
  }

  function duplicateMap(map) {
    const source = map || activeMap();
    const name = window.prompt('Name the duplicate map', source.name + ' copy');
    if (name === null) return;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = uid();
    copy.name = name.trim() || source.name + ' copy';
    copy.updated = Date.now();
    workspace.maps.push(copy);
    workspace.activeId = copy.id;
    render();
    saveWorkspace();
  }

  function renameMap(map) {
    const name = window.prompt('Rename this map', map.name);
    if (name === null) return;
    map.name = name.trim() || 'Untitled interaction';
    render();
    saveWorkspace();
  }

  function deleteMap(map) {
    if (workspace.maps.length === 1) { window.alert('Keep at least one map in this workspace.'); return; }
    if (!window.confirm('Delete “' + map.name + '”?')) return;
    workspace.maps = workspace.maps.filter(function (item) { return item.id !== map.id; });
    if (workspace.activeId === map.id) workspace.activeId = workspace.maps[0].id;
    render();
    saveWorkspace();
  }

  function renderSavedMaps() {
    const list = document.querySelector('#savedMapsList');
    list.innerHTML = '';
    workspace.maps.forEach(function (map) {
      const item = document.createElement('div');
      item.className = 'saved-map' + (map.id === workspace.activeId ? ' is-current' : '');
      const detail = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'saved-map-name';
      name.textContent = map.name;
      const meta = document.createElement('div');
      meta.className = 'saved-map-meta';
      meta.textContent = map.rows.length + ' moments · edited ' + new Date(map.updated || Date.now()).toLocaleDateString();
      detail.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'saved-map-actions';
      actions.appendChild(actionButton('Open', function () { workspace.activeId = map.id; render(); saveWorkspace(); myMapsDialog.close(); }));
      actions.appendChild(actionButton('Rename', function () { renameMap(map); }));
      actions.appendChild(actionButton('Duplicate', function () { duplicateMap(map); }));
      const deleteButton = actionButton('Delete', function () { deleteMap(map); });
      deleteButton.classList.add('delete');
      actions.appendChild(deleteButton);
      item.append(detail, actions);
      list.appendChild(item);
    });
  }

  function actionButton(label, handler) {
    const button = document.createElement('button');
    button.className = 'mini-button';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]; });
  }

  function renderPrintMaps() {
    printMaps.innerHTML = workspace.maps.map(function (map, mapIndex) {
      const rows = map.rows.map(function (row, index) {
        return '<tr><td>' + String(index + 1).padStart(2, '0') + '</td><td>' + escapeHtml(row.doing) + '</td><td>' + escapeHtml(row.knowing) + '</td><td>' + escapeHtml(row.feeling) + '</td><td>' + escapeHtml(row.input) + '</td><td>' + escapeHtml(row.process) + '</td><td>' + escapeHtml(row.output) + '</td></tr>';
      }).join('');
      return '<article class="print-map"><p class="eyebrow">Interaction Map ' + String(mapIndex + 1).padStart(2, '0') + '</p><h2>' + escapeHtml(map.name) + '</h2><p class="print-meta">DDES1150 Interaction 1 · Saved locally</p><div class="print-context"><div><strong>Scenario or context</strong><p>' + escapeHtml(map.context) + '</p></div><div><strong>Person trying to do</strong><p>' + escapeHtml(map.task) + '</p></div></div><table class="print-table"><thead><tr><th>Moment</th><th class="human-print">Doing</th><th class="human-print">Knowing</th><th class="human-print">Feeling</th><th class="system-print">Input</th><th class="system-print">Process</th><th class="system-print">Output</th></tr></thead><tbody>' + rows + '</tbody></table><div class="print-notes"><strong>Working notes</strong>' + escapeHtml(map.notes) + '</div></article>';
    }).join('');
  }

  function exportJson() {
    saveWorkspace();
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'interaction-map-session.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importJson() {
    importFileInput.value = '';
    importFileInput.click();
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const imported = normaliseWorkspace(JSON.parse(reader.result));
        if (!imported) throw new Error('Invalid workspace');
        if (!window.confirm('Import this session and replace the maps currently open?')) return;
        workspace = imported;
        render();
        saveWorkspace();
      } catch (error) {
        window.alert('This file does not contain a valid Interaction Map session.');
      }
    };
    reader.readAsText(file);
  }

  function printWorkspace() {
    saveWorkspace();
    renderPrintMaps();
    window.print();
  }

  fields.title.addEventListener('input', function () { activeMap().name = fields.title.value || 'Untitled interaction'; activeMapName.textContent = activeMap().name; renderTabs(); markUnsaved(); });
  fields.context.addEventListener('input', function () { activeMap().context = fields.context.value; markUnsaved(); });
  fields.task.addEventListener('input', function () { activeMap().task = fields.task.value; markUnsaved(); });
  fields.notes.addEventListener('input', function () { activeMap().notes = fields.notes.value; markUnsaved(); });

  document.querySelector('#addRowButton').addEventListener('click', function () { activeMap().rows.push(blankRow()); render(); saveWorkspace(); rowsContainer.lastElementChild.querySelector('textarea').focus(); });
  document.querySelector('#addMapButton').addEventListener('click', newMap);
  document.querySelector('#duplicateButton').addEventListener('click', function () { duplicateMap(); });
  document.querySelector('#mapToolsButton').addEventListener('click', function () { mapToolsDialog.showModal(); });
  document.querySelector('#myMapsButton').addEventListener('click', function () { mapToolsDialog.close(); renderSavedMaps(); myMapsDialog.showModal(); });
  document.querySelector('#newMapToolButton').addEventListener('click', function () { mapToolsDialog.close(); newMap(); });
  document.querySelector('#dialogNewMapButton').addEventListener('click', function () { myMapsDialog.close(); newMap(); });
  document.querySelector('#exportJsonButton').addEventListener('click', function () { mapToolsDialog.close(); exportJson(); });
  document.querySelector('#dialogExportJsonButton').addEventListener('click', exportJson);
  document.querySelector('#importJsonButton').addEventListener('click', function () { mapToolsDialog.close(); importJson(); });
  document.querySelector('#dialogImportJsonButton').addEventListener('click', function () { myMapsDialog.close(); importJson(); });
  importFileInput.addEventListener('change', handleImport);
  document.querySelector('#printToolButton').addEventListener('click', function () { mapToolsDialog.close(); printWorkspace(); });
  document.querySelector('#topPrintButton').addEventListener('click', printWorkspace);
  document.querySelector('#bottomPrintButton').addEventListener('click', printWorkspace);
  document.querySelector('#helpButton').addEventListener('click', function () { helpDialog.showModal(); });
  document.querySelectorAll('[data-close-dialog]').forEach(function (button) { button.addEventListener('click', function () { document.querySelector('#' + button.dataset.closeDialog).close(); }); });

  render();
  saveWorkspace();
})();
