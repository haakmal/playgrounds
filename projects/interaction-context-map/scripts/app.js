(function () {
  const app = {
    project: null,
    openSections: new Set(['setup', 'observe', 'capture']),
    drag: null,
    connectionMode: { map: null, sourceId: null },
    saveTimer: null
  };

  const workspace = document.getElementById('workspace');
  const sessionName = document.getElementById('sessionName');
  const saveStatus = document.getElementById('saveStatus');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const fileInput = document.getElementById('fileInput');

  const SECTION_META = [
    ['setup', '01', 'Set up the interaction', 'Create the context for this mapping'],
    ['observe', '02', 'Observe an interaction', 'Collect evidence without helping or correcting'],
    ['capture', '03', 'Capture the interaction', 'Put observations into a simple sequence'],
    ['ipo', '04', 'Build an IPO map', 'Look at the interaction from the perspective of the technology'],
    ['ptc', '05', 'Build a People / Technology / Context map', 'Step back and observe the wider context'],
    ['review', '06', 'Connect and revisit the maps', 'Compare what you have seen and what you now understand']
  ];

  const HELP = {
    general: {
      title: 'Using the toolkit',
      html: `<h3>What this tool is for</h3>
      <p>This digital version supports the Interaction Context Mapping Toolkit. Use it to record observations, build IPO and PTC maps, and revisit the same interaction as your understanding develops.</p>
      <h3>Local sessions</h3>
      <p>Your work is automatically saved to this browser on this device. It is not submitted or stored online by this tool. Browser data can be cleared, so export a copy when you want a backup or need to move to another device.</p>
      <h3>Working with maps</h3>
      <p>Add notes, drag them to reorder them, and use <strong>Connect</strong> to draw simple relationships. The map is deliberately constrained: it is not intended to be an infinite whiteboard.</p>
      <h3>Revisiting</h3>
      <p>Return to the same interaction at any time. Edit existing observations or add new reflections. Keep earlier evidence visible where possible rather than replacing it.</p>`
    },
    examples: {
      title: 'Examples and tips',
      html: `<h3>Possible observation tasks</h3>
      <ul><li>Use the printer</li><li>Search for something online</li><li>Navigate to a location in the library</li><li>Submit something through Moodle</li><li>Use a ticketing, payment, or vending machine</li><li>Find information on a university website</li><li>Complete another everyday technology-based task</li></ul>
      <h3>Moments worth recording</h3>
      <p>Look for pauses, hesitation, repetition, backtracking, looking away from the technology, looking at another source of information, asking a question, checking whether something worked, changing approaches, making an error, receiving or looking for feedback.</p>`
    },
    input: { title: 'What is an Input?', html: `<p>Inputs are things a person provides or does in the situation, such as clicking, tapping, typing, selecting, scanning, moving, speaking, or entering information.</p>` },
    process: { title: 'What is a Process?', html: `<p>The Process is what happens within the technology or system, such as information being searched, a selection being checked, a request being processed, information being retrieved, or a system state changing.</p><p><strong>Do not invent or infer the hidden technical process.</strong> Ask your tutor if you are not clear.</p>` },
    output: { title: 'What is an Output?', html: `<p>The Output is what the technology produces or communicates back to the person, such as information appearing, a message being displayed, a sound occurring, a light changing, a page changing, or an action being confirmed or rejected.</p>` },
    people: { title: 'Who are the People?', html: `<p>Ask who is involved in this situation, who is acting, who else is involved or affected, and what they are trying to accomplish.</p>` },
    technology: { title: 'What is the Technology?', html: `<p>Ask what they are interacting with. Is it a system, interface, information, object, service or mechanism? What does it allow the person to do?</p>` },
    context: { title: 'What is the Context?', html: `<p>Ask where and when the situation occurs and what is happening around the person. Are they rushed, distracted, interrupted or unfamiliar with the situation? Does the physical or social environment affect what they do?</p>` }
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  function setSaveState(state, text) {
    saveStatus.className = `save-status ${state || ''}`;
    saveStatus.textContent = text;
  }

  function scheduleSave() {
    setSaveState('unsaved', 'Unsaved changes');
    clearTimeout(app.saveTimer);
    app.saveTimer = setTimeout(() => {
      ICMStorage.saveProject(app.project);
      setSaveState('saved', `Saved locally · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 350);
  }

  function ensureProject() {
    let project = ICMStorage.getActive();
    if (!project) project = ICMStorage.createProject('Untitled interaction');
    // Lightweight compatibility defaults.
    project.setup ||= { task: '', observedPerson: '', technology: '', notes: '' };
    project.observations ||= [];
    project.ipo ||= { input: [], process: [], output: [], connections: [] };
    project.ptc ||= { people: [], technology: [], context: [], connections: [] };
    project.review ||= { reflections: [] };
    app.project = project;
  }

  function render() {
    sessionName.textContent = app.project.title || 'Untitled interaction';
    workspace.innerHTML = SECTION_META.map(([key, n, title, summary]) => renderSection(key, n, title, summary)).join('');
    bindDynamicEvents();
    requestAnimationFrame(drawAllLines);
  }

  function isOpen(key) { return app.openSections.has(key); }

  function renderSection(key, number, title, summary) {
    const open = isOpen(key) ? ' open' : '';
    let body = '';
    if (key === 'setup') body = renderSetup();
    if (key === 'observe') body = renderObserve();
    if (key === 'capture') body = renderCapture();
    if (key === 'ipo') body = renderMap('ipo');
    if (key === 'ptc') body = renderMap('ptc');
    if (key === 'review') body = renderReview();
    return `<details class="section" data-section="${key}"${open}>
  <summary>
    <span class="section-title">
      <span>${number}</span>
      <span>${title}</span>
      <span class="section-summary">${summary}</span>
    </span>
    <button class="section-focus" data-focus-section="${key}" type="button">Focus</button>
  </summary>
  <div class="section-content">${body}</div>
</details>`;
  }

  function renderSetup() {
    return `<div class="setup-grid">
      <div class="copy">
        <p>This small setup section separates the digital working record from the manual toolkit. Give this interaction enough context that you can understand what your maps refer to when you return later.</p>
        <p>Do not add personal information unless you choose to for your own working record.</p>
      </div>
      <div class="callout">
        <h3>Local session</h3>
        <p>Your work is saved locally in this browser on this device. Nothing is submitted.</p>
        <p><button class="help-link" data-help="general">Help about sessions</button></p>
      </div>
    </div>
    <div class="form-grid">
      ${field('Interaction / task', 'task', app.project.setup.task)}
      ${field('Observed person / people', 'observedPerson', app.project.setup.observedPerson)}
      ${field('Technology / system', 'technology', app.project.setup.technology)}
      ${field('Additional context', 'notes', app.project.setup.notes, true)}
    </div>`;
  }

  function field(label, key, value, full = false) {
    return `<div class="field ${full ? 'full' : ''}"><label for="setup-${key}">${label}</label><textarea id="setup-${key}" data-setup="${key}" rows="${full ? 3 : 1}">${escapeHtml(value)}</textarea></div>`;
  }

  function renderObserve() {
    return `<div class="intro-grid">
      <div class="copy">
        <p>Your task is to observe the user without helping or correcting them. Pay attention to both the person and the system they are involved in. Your user should be thinking aloud where appropriate.</p>
        <p>Record moments such as a pause, hesitation, repetition, backtracking, looking away from the technology, looking at another source of information, asking a question, checking whether something worked, changing approaches, making an error, receiving or looking for feedback, etc.</p>
      </div>
      <div class="callout">
        <h3>Task</h3>
        <p><strong>Observe your user as they think aloud</strong></p>
        <p>Record what they say as evidence of:</p>
        <ul><li>What they expect</li><li>What they are looking for</li><li>What they think has happened</li><li>What they are unsure about</li></ul>
        <p>Do not help them or interpret their comments for them. Simply record what they actually say.</p>
      </div>
    </div>
    <div class="section-toolbar"><div class="hint">Tip: collect notes here or transfer them later from rough notes and documentation.</div><button class="button button-secondary" data-help="examples">Examples &amp; tips</button></div>`;
  }

  function renderCapture() {
    const rows = app.project.observations;
    const rowHtml = rows.length ? rows.map((row, i) => `<tr data-observation-row="${row.id}">
      <td><div class="obs-cell" data-cell="person">${escapeHtml(row.person)}</div></td>
      <td><div class="obs-cell" data-cell="technology">${escapeHtml(row.technology)}</div></td>
      <td><div class="obs-cell" data-cell="observe">${escapeHtml(row.observe)}</div></td>
      <td class="obs-row-actions"><div class="row-actions"><button class="small-button" data-edit-observation="${row.id}">Edit</button><button class="small-button danger" data-delete-observation="${row.id}">Del</button></div></td>
    </tr>`).join('') : `<tr><td colspan="4"><div class="empty">No observations yet. Add your first row below.</div></td></tr>`;
    return `<div class="copy"><p>Before the map can be made, put your observations into a simple sequence. Look for moments where something changes.</p><p>For example: person searches → clicks a button → page changes → they pause → look back at the menu → clicks again.</p><p><strong>Hint. If you cannot define the technology here, ask your tutor for help.</strong></p></div>
    <div class="section-toolbar"><div class="hint">Add rows as needed. Existing observations remain editable when you return.</div><button class="button" data-add-observation>Add observation</button></div>
    <div class="table-wrap"><table class="obs-table"><thead><tr><th>What did the person do?</th><th>What did the technology do?</th><th>What did you observe?</th><th class="obs-row-actions">Edit</th></tr></thead><tbody>${rowHtml}</tbody></table></div>`;
  }

  function renderMap(type) {
    const isIpo = type === 'ipo';
    const map = app.project[type];
    const columns = isIpo ? [
      ['input', 'Input', 'input', 'What a person provides or does'],
      ['process', 'Process', 'process', 'What happens within the technology/system'],
      ['output', 'Output', 'output', 'What the technology produces or communicates']
    ] : [
      ['people', 'People', 'people', 'Who is involved or affected?'],
      ['technology', 'Technology', 'technology', 'What are they interacting with?'],
      ['context', 'Context', 'context', 'Where, when and what is happening around them?']
    ];
    const cols = columns.map(([key, title, help, hint]) => {
      const cards = ICMMaps.sortCards(map[key]);
      return `<div class="map-column" data-map-type="${type}" data-column="${key}">
        <div class="map-column-header">${title} <button class="help-link" data-help="${help}">?</button></div>
        <div class="map-card-list" data-drop-column="${key}" data-drop-map="${type}">
          ${cards.length ? cards.map(c => renderCard(c, type)).join('') : `<div class="empty">No notes yet.</div>`}
        </div>
      </div>`;
    }).join('');
    const modeActive = app.connectionMode.map === type;
    return `<div class="map-intro"><div class="copy"><p>${isIpo ? 'Now look at the interaction from the perspective of the technology. IPO is used to understand how the technical aspects of an interaction operate.' : 'Now step back from the technology and observe the wider context. IPO showed you what the system does. Now ask what happens around it.'}</p>
      <p><strong>${isIpo ? 'Input → Process → Output' : 'People → Technology → Context'}</strong></p>
      <p>${isIpo ? 'Outputs often lead to a new input, creating a feedback loop. You can use the \'Connect\' button to link notes together.' : 'Look for overlaps: multiple people engaging with the same context or technology. These overlaps define the building blocks of your interaction. You can use the \'Connect\' button to link notes together.'}</p></div>
      <div class="map-actions"><button class="button" data-add-card="${type}">+ Add note</button><button class="button button-secondary ${modeActive ? 'connection-mode' : ''}" data-connect-map="${type}">${modeActive ? 'Connecting…' : 'Connect'}</button></div></div>
      <div class="connection-help ${modeActive ? 'active' : ''}" data-connection-help="${type}">${app.connectionMode.sourceId ? 'Select a second note to create a connection.' : 'Select one note, then select another note. Use the same control again to leave connection mode.'}</div>
      <div class="map-board" data-map-board="${type}">
        <svg class="map-overlay" aria-hidden="true"></svg>
        <div class="map-columns">${cols}</div>
      </div>`;
  }

  function renderCard(card, mapType) {
    const selected = app.connectionMode.map === mapType && app.connectionMode.sourceId === card.id;
    return `<div class="map-card ${selected ? 'selected' : ''}" draggable="true" data-card-id="${card.id}" data-map="${mapType}" title="Drag to reorder">
      <div class="card-type">${escapeHtml(card.type)}</div>
      <div class="card-text">${escapeHtml(card.text) || '<span class="hint">Empty note</span>'}</div>
      <div class="card-controls"><button data-edit-card="${card.id}" data-map="${mapType}">Edit</button><button data-delete-card="${card.id}" data-map="${mapType}">Delete</button></div>
    </div>`;
  }

  function renderReview() {
    const observations = app.project.observations;
    const mapSummary = (map, keys) => keys.flatMap(k => map[k].map(c => c.text).filter(Boolean));
    const previous = [
      ...observations.flatMap(o => [o.person, o.technology, o.observe]),
      ...mapSummary(app.project.ipo, ['input', 'process', 'output']),
      ...mapSummary(app.project.ptc, ['people', 'technology', 'context'])
    ].filter(Boolean);
    const refs = previous.length ? `<ul class="review-list">${previous.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '<div class="empty">Your previous work will appear here as you build it.</div>';
    const prompts = [
      'When the person pauses, what caused the pause?',
      'When they repeat an action, what happened in the technology?',
      'When they look away, what information were they seeking?',
      'When they change their approach, what did they understand from the previous response and what was missing?',
      'When something in the context changes, does the interaction also change with it?'
    ];
    const reflections = app.project.review.reflections.map(r => `<div class="review-item" data-reflection="${r.id}"><div class="review-date">${formatDate(r.createdAt)}</div><div>${escapeHtml(r.text)}</div><button class="small-button" data-delete-reflection="${r.id}">Delete</button></div>`).join('');
    return `<div class="copy"><p>With both maps built, place them side by side and compare. You are beginning to identify where user behaviour, technology, and context come together.</p></div>
      <div class="review-grid"><section class="review-panel"><h3>What you have recorded</h3><div class="review-content">${refs}</div></section><section class="review-panel"><h3>New reflection</h3><div class="review-content"><textarea id="reflectionText" placeholder="Append a new observation, interpretation, question, or connection…"></textarea><div class="section-toolbar"><span class="hint">Keep earlier evidence; add what you now notice.</span><button class="button" data-add-reflection>Add reflection</button></div></div></section></div>
      <div class="callout" style="margin-top:14px"><h3>Look for connections such as…</h3><ul>${prompts.map(p => `<li>${p}</li>`).join('')}</ul><p><strong>Revisit freely.</strong> There is no week counter. Return to this interaction whenever a new research method or UX concept changes what you notice.</p></div>
      ${reflections ? `<div style="margin-top:14px"><div class="section-kicker">Added reflections</div><div class="reflection-list">${reflections}</div></div>` : ''}`;
  }

  function focusSection(key) {
  const currentlyFocused =
    document.querySelector('.section-focused')?.dataset.section;

  const focusing = currentlyFocused !== key;

  document.body.classList.toggle('focus-mode', focusing);

  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle(
      'section-focused',
      focusing && section.dataset.section === key
    );
  });

  document.querySelectorAll('[data-focus-section]').forEach(btn => {
    btn.textContent =
      focusing && btn.dataset.focusSection === key
        ? 'Exit focus'
        : 'Focus';
  });
}
  function bindDynamicEvents() {
    document.querySelectorAll('[data-focus-section]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    focusSection(btn.dataset.focusSection);
  });
});
    document.querySelectorAll('.section').forEach(section => {
      section.addEventListener('toggle', () => {
        const key = section.dataset.section;
        if (section.open) app.openSections.add(key); else app.openSections.delete(key);
      });
    });
    document.querySelectorAll('[data-help]').forEach(el => el.addEventListener('click', () => openHelp(el.dataset.help)));
    document.querySelectorAll('[data-setup]').forEach(el => el.addEventListener('input', e => {
      app.project.setup[e.target.dataset.setup] = e.target.value;
      scheduleSave();
    }));
    document.querySelector('[data-add-observation]')?.addEventListener('click', addObservation);
    document.querySelectorAll('[data-edit-observation]').forEach(btn => btn.addEventListener('click', () => editObservation(btn.dataset.editObservation)));
    document.querySelectorAll('[data-delete-observation]').forEach(btn => btn.addEventListener('click', () => deleteObservation(btn.dataset.deleteObservation)));
    document.querySelectorAll('[data-add-card]').forEach(btn => btn.addEventListener('click', () => addMapCard(btn.dataset.addCard)));
    document.querySelectorAll('[data-edit-card]').forEach(btn => btn.addEventListener('click', () => editMapCard(btn.dataset.map, btn.dataset.editCard)));
    document.querySelectorAll('[data-delete-card]').forEach(btn => btn.addEventListener('click', () => deleteMapCard(btn.dataset.map, btn.dataset.deleteCard)));
    document.querySelectorAll('[data-connect-map]').forEach(btn => btn.addEventListener('click', () => toggleConnectionMode(btn.dataset.connectMap)));
    document.querySelectorAll('[data-card-id]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        handleCardConnection(card.dataset.map, card.dataset.cardId);
      });
      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragover', e => { e.preventDefault(); });
      card.addEventListener('drop', onCardDrop);
    });
    document.querySelectorAll('[data-drop-column]').forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); });
      zone.addEventListener('drop', onColumnDrop);
    });
    document.querySelector('[data-add-reflection]')?.addEventListener('click', addReflection);
    document.querySelectorAll('[data-delete-reflection]').forEach(btn => btn.addEventListener('click', () => deleteReflection(btn.dataset.deleteReflection)));
  }

  function addObservation() {
    app.project.observations.push({ id: crypto.randomUUID(), person: '', technology: '', observe: '' });
    scheduleSave();
    render();
    document.querySelector('[data-edit-observation]:last-of-type')?.click();
  }

  function editObservation(id) {
    const row = app.project.observations.find(r => r.id === id);
    if (!row) return;
    const html = `<h3>Observation row</h3><div class="form-grid">
      <div class="field"><label>What did the person do?</label><textarea id="edit-person">${escapeHtml(row.person)}</textarea></div>
      <div class="field"><label>What did the technology do?</label><textarea id="edit-tech">${escapeHtml(row.technology)}</textarea></div>
      <div class="field full"><label>What did you observe?</label><textarea id="edit-observe">${escapeHtml(row.observe)}</textarea></div>
    </div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="button button-secondary" data-action="close-modal">Cancel</button><button class="button" id="saveObservation">Save row</button></div>`;
    openModal('Edit observation', html);
    document.getElementById('saveObservation').addEventListener('click', () => {
      row.person = document.getElementById('edit-person').value;
      row.technology = document.getElementById('edit-tech').value;
      row.observe = document.getElementById('edit-observe').value;
      scheduleSave(); closeModal(); render(); openSection('capture');
    });
  }

  function deleteObservation(id) {
    if (!confirm('Delete this observation row?')) return;
    app.project.observations = app.project.observations.filter(r => r.id !== id);
    scheduleSave(); render(); openSection('capture');
  }

  function mapCollection(mapType, cardType) { return app.project[mapType][cardType]; }

  function addMapCard(mapType) {
    const isIpo = mapType === 'ipo';
    const options = isIpo ? ['input', 'process', 'output'] : ['people', 'technology', 'context'];
    openModal('Add map note', `<div class="form-grid"><div class="field"><label>Type</label><select id="cardType">${options.map(o => `<option value="${o}">${o.charAt(0).toUpperCase()+o.slice(1)}</option>`).join('')}</select></div><div class="field full"><label>Note</label><textarea id="cardText" placeholder="Write what you observed or can evidence."></textarea></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="button" id="saveCard">Add note</button></div>`);
    document.getElementById('saveCard').addEventListener('click', () => {
      const type = document.getElementById('cardType').value;
      const text = document.getElementById('cardText').value.trim();
      if (!text) return;
      ICMMaps.addCard(mapCollection(mapType, type), type, text);
      scheduleSave(); closeModal(); render(); openSection(mapType);
    });
  }

  function editMapCard(mapType, id) {
    const card = ICMMaps.findCard(app.project[mapType], id);
    if (!card) return;
    const options = mapType === 'ipo' ? ['input', 'process', 'output'] : ['people', 'technology', 'context'];
    openModal('Edit map note', `<div class="form-grid"><div class="field"><label>Type</label><select id="cardType">${options.map(o => `<option value="${o}" ${o === card.type ? 'selected' : ''}>${o.charAt(0).toUpperCase()+o.slice(1)}</option>`).join('')}</select></div><div class="field full"><label>Note</label><textarea id="cardText">${escapeHtml(card.text)}</textarea></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="button" id="saveCard">Save note</button></div>`);
    document.getElementById('saveCard').addEventListener('click', () => {
      const nextType = document.getElementById('cardType').value;
      const text = document.getElementById('cardText').value.trim();
      Object.keys(app.project[mapType]).filter(k => Array.isArray(app.project[mapType][k])).forEach(k => { if (k !== 'connections') ICMMaps.removeCard(app.project[mapType][k], id); });
      if (text) ICMMaps.addCard(app.project[mapType][nextType], nextType, text).id = id;
      app.project[mapType].connections = app.project[mapType].connections.filter(c => c.from !== id && c.to !== id);
      scheduleSave(); closeModal(); render(); openSection(mapType);
    });
  }

  function deleteMapCard(mapType, id) {
    if (!confirm('Delete this map note and its connections?')) return;
    Object.keys(app.project[mapType]).filter(k => Array.isArray(app.project[mapType][k])).forEach(k => { if (k !== 'connections') ICMMaps.removeCard(app.project[mapType][k], id); });
    ICMMaps.removeConnectionsFor(app.project[mapType], id);
    scheduleSave(); render(); openSection(mapType);
  }

  function toggleConnectionMode(mapType) {
    if (app.connectionMode.map === mapType) { app.connectionMode = { map: null, sourceId: null }; }
    else { app.connectionMode = { map: mapType, sourceId: null }; }
    render(); openSection(mapType);
  }

  function handleCardConnection(mapType, cardId) {
    if (app.connectionMode.map !== mapType) return;
    if (!app.connectionMode.sourceId) { app.connectionMode.sourceId = cardId; render(); openSection(mapType); return; }
    const source = app.connectionMode.sourceId;
    if (source !== cardId) {
      const connections = app.project[mapType].connections;
      const duplicate = connections.find(c => (c.from === source && c.to === cardId) || (c.from === cardId && c.to === source));
      if (duplicate) app.project[mapType].connections = connections.filter(c => c !== duplicate);
      else connections.push({ id: crypto.randomUUID(), from: source, to: cardId });
      scheduleSave();
    }
    app.connectionMode.sourceId = null;
    render(); openSection(mapType);
  }

  function onDragStart(e) {
    if (app.connectionMode.map) { e.preventDefault(); return; }
    app.drag = { cardId: e.currentTarget.dataset.cardId, mapType: e.currentTarget.dataset.map };
    e.dataTransfer.effectAllowed = 'move';
  }

  function onCardDrop(e) {
    e.preventDefault();
    if (!app.drag) return;
    reorderCard(app.drag.mapType, app.drag.cardId, e.currentTarget.dataset.cardId);
    app.drag = null;
  }

  function onColumnDrop(e) {
    e.preventDefault();
    if (!app.drag) return;
    const mapType = app.drag.mapType;
    const targetColumn = e.currentTarget.dataset.dropColumn;
    const sourceCard = ICMMaps.findCard(app.project[mapType], app.drag.cardId);
    if (!sourceCard) return;
    Object.keys(app.project[mapType]).filter(k => Array.isArray(app.project[mapType][k]) && k !== 'connections').forEach(k => ICMMaps.removeCard(app.project[mapType][k], app.drag.cardId));
    app.project[mapType][targetColumn].push(sourceCard);
    sourceCard.type = targetColumn;
    sourceCard.order = Date.now();
    scheduleSave(); render(); openSection(mapType); app.drag = null;
  }

  function reorderCard(mapType, cardId, targetId) {
    const map = app.project[mapType];
    const source = ICMMaps.findCard(map, cardId);
    const target = ICMMaps.findCard(map, targetId);
    if (!source || !target || source.type !== target.type) return;
    const list = map[source.type];
    const sourceIndex = list.findIndex(c => c.id === cardId);
    const targetIndex = list.findIndex(c => c.id === targetId);
    if (sourceIndex === targetIndex) return;
    const [item] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, item);
    list.forEach((c, i) => { c.order = i + 1; });
    scheduleSave(); render(); openSection(mapType);
  }

  function addReflection() {
    const text = document.getElementById('reflectionText')?.value.trim();
    if (!text) return;
    app.project.review.reflections.push({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
    scheduleSave(); render(); openSection('review');
  }

  function deleteReflection(id) {
    app.project.review.reflections = app.project.review.reflections.filter(r => r.id !== id);
    scheduleSave(); render(); openSection('review');
  }

  function drawAllLines() {
    ['ipo', 'ptc'].forEach(drawLines);
  }

  function drawLines(mapType) {
    const board = document.querySelector(`[data-map-board="${mapType}"]`);
    if (!board) return;
    const svg = board.querySelector('svg');
    const rect = board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${rect.width - 24} ${rect.height - 24}`);
    svg.innerHTML = '';
    for (const conn of app.project[mapType].connections) {
      const a = board.querySelector(`[data-card-id="${conn.from}"]`);
      const b = board.querySelector(`[data-card-id="${conn.to}"]`);
      if (!a || !b) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const x1 = ar.left + ar.width / 2 - rect.left - 12;
      const y1 = ar.top + ar.height / 2 - rect.top - 12;
      const x2 = br.left + br.width / 2 - rect.left - 12;
      const y2 = br.top + br.height / 2 - rect.top - 12;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      svg.appendChild(line);
    }
  }

  function openHelp(key) {
    const content = HELP[key] || HELP.general;
    openModal(content.title, content.html);
  }

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('[data-action="close-modal"]')?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function openSection(key) {
    app.openSections.add(key);
    const section = document.querySelector(`[data-section="${key}"]`);
    if (section) section.open = true;
  }

  function showSessions() {
    const projects = ICMStorage.allProjects();
    const html = `<div class="session-list">${projects.length ? projects.map(p => `<div style="border:1px solid var(--line);padding:12px;margin-bottom:8px"><strong>${escapeHtml(p.title)}</strong><div class="hint">Last edited: ${formatDate(p.modifiedAt)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px"><button class="button button-secondary" data-open-project="${p.id}">Open</button><button class="small-button" data-rename-project="${p.id}">Rename</button><button class="small-button" data-duplicate-project="${p.id}">Duplicate</button><button class="small-button danger" data-delete-project="${p.id}">Delete</button></div></div>`).join('') : '<div class="empty">No saved interactions yet.</div>'}</div>`;
    openModal('My interactions', `${html}<div style="display:flex;justify-content:space-between;gap:8px;margin-top:12px"><button class="button" data-action="new">New interaction</button><button class="button button-secondary" data-action="import">Import session</button></div>`);
    document.querySelectorAll('[data-open-project]').forEach(btn => btn.addEventListener('click', () => {
      ICMStorage.setActive(btn.dataset.openProject); ensureProject(); app.openSections = new Set(['setup','observe','capture']); closeModal(); render();
    }));
    document.querySelectorAll('[data-rename-project]').forEach(btn => btn.addEventListener('click', () => {
  const project = ICMStorage.allProjects().find(
    p => p.id === btn.dataset.renameProject
  );

  if (!project) return;

  const title = prompt('Rename this interaction:', project.title);

  if (title === null) return;

  project.title = title.trim() || 'Untitled interaction';

  ICMStorage.saveProject(project);

  if (app.project?.id === project.id) {
    app.project.title = project.title;
    sessionName.textContent = project.title;
  }

  closeModal();
  showSessions();
}));
    document.querySelectorAll('[data-duplicate-project]').forEach(btn => btn.addEventListener('click', () => {
  const source = ICMStorage.allProjects().find(
    p => p.id === btn.dataset.duplicateProject
  );

  if (!source) return;

  const title = prompt(
    'Name the duplicated interaction:',
    `${source.title} copy`
  );

  if (title === null) return;

  const duplicate = ICMStorage.duplicateProject(
    btn.dataset.duplicateProject,
    title.trim() || `${source.title} copy`
  );

  ensureProject();
  closeModal();
  render();
  toast('Interaction duplicated.');
}));
    document.querySelectorAll('[data-delete-project]').forEach(btn => btn.addEventListener('click', () => {
      if (!confirm('Delete this interaction from this browser? Export a backup first if you need it later.')) return;
      ICMStorage.deleteProject(btn.dataset.deleteProject); ensureProject(); closeModal(); render();
    }));
  }

  function newProject() {
    const title = prompt('Name this interaction:', 'Untitled interaction');
    if (title === null) return;
    ICMStorage.createProject(title.trim() || 'Untitled interaction');
    ensureProject(); app.openSections = new Set(['setup','observe','capture']); app.connectionMode = { map: null, sourceId: null }; render();
  }

  function renameProject() {
    const currentTitle = app.project.title || 'Untitled interaction';
    const title = prompt('Rename this interaction:', currentTitle);
    
    if (title === null) return;
    
    app.project.title = title.trim() || 'Untitled interaction';
    sessionName.textContent = app.project.title;
    
    save();
    toast('Interaction renamed.');
  }

  function importSession() { fileInput.value = ''; fileInput.click(); }

  fileInput.addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const imported = ICMExport.validateImport(payload);
      ICMStorage.importProject(imported);
      ensureProject(); render(); toast('Session imported.');
    } catch (error) { toast(error.message || 'Could not import this file.'); }
  });

  function exportSession() { ICMExport.downloadJson(app.project); toast('Session exported.'); }

  function toast(message) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'help') openHelp('general');
    if (action === 'sessions') showSessions();
    if (action === 'new') { closeModal(); newProject(); }
    if (action === 'import') { closeModal(); importSession(); }
    if (action === 'export') exportSession();
    if (action === 'close-modal') closeModal();
    if (action === 'rename') renameProject();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  window.addEventListener('resize', drawAllLines);
  window.addEventListener('beforeunload', () => { if (app.project) ICMStorage.saveProject(app.project); });

  ensureProject();
  render();
  setSaveState('saved', app.project.modifiedAt ? `Saved locally · ${new Date(app.project.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved locally');
})();
