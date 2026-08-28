(() => {
  const STORAGE_KEY = 'interaction2_accessibility_audits_v2';
  const ACTIVE_KEY = 'interaction2_accessibility_active_v2';

  const lenses = [
    { key:'access', number:'01', title:'Access', question:'Can the interaction be perceived and reached at all?', guidance:'Can information be seen, heard, or otherwise perceived? Can controls be reached or activated? Is access dependent on one sense or ability?' },
    { key:'action', number:'02', title:'Action', question:'Can the user physically or cognitively perform the required actions?', guidance:'Look for motor and cognitive demands like precision, speed, or repetition. Is there an element of fatigue?' },
    { key:'understanding', number:'03', title:'Understanding', question:'Is it clear what is happening and what to do next?', guidance:'Look for cognition, language, and feedback cues. Are instructions clear? Is feedback present? Is there error tolerance? Does the interaction assume prior knowledge?' },
    { key:'adaptability', number:'04', title:'Adaptability', question:'Can the interaction adjust to different user needs or contexts?', guidance:'Look for resilience. Are there multiple ways to complete tasks? How about redundant modalities (visual + audio)? Is it compatible with assistive technologies?' },
    { key:'dignity', number:'05', title:'Dignity', question:'Does the interaction preserve autonomy and respect?', guidance:'Consider forced disclosures or dependence on staff, risk of public failure or embarrassment, and loss of agency.' }
  ];

  let audits = loadAudits();
  let activeId = localStorage.getItem(ACTIVE_KEY);
  let editorKey = null;

  if (!audits.length) {
    const fresh = makeAudit('Untitled interaction');
    audits = [fresh];
    activeId = fresh.id;
    persist();
  } else if (!audits.some(a => a.id === activeId)) {
    activeId = audits[0].id;
    persist();
  }

  const $ = id => document.getElementById(id);
  const active = () => audits.find(a => a.id === activeId);

  function nowIso() { return new Date().toISOString(); }

  function formatDate(iso) {
    if (!iso) return '';
    return new Intl.DateTimeFormat(undefined, {
      year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'
    }).format(new Date(iso));
  }

  function makeAudit(name) {
    const now = nowIso();
    return {
      id:'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      name,
      createdAt:now,
      updatedAt:now,
      interaction:'',
      location:'',
      auditor:'',
      notes:'',
      guidance:{},
      answers:{ access:'', action:'', understanding:'', adaptability:'', dignity:'' }
    };
  }

  function loadAudits() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
    localStorage.setItem(ACTIVE_KEY, activeId);
  }

  function touch() {
    const a = active();
    if (!a) return;
    a.updatedAt = nowIso();
    persist();
    $('updatedAt').textContent = formatDate(a.updatedAt);
    $('saveState').textContent = 'Saved';
    $('saveStatus').textContent = 'Saved locally · ' + formatDate(a.updatedAt);
    updatePrintContext();
  }

  function toast(message) {
    const t = $('toast');
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[character]));
  }

  function renderFramework() {
    const wrap = $('framework');
    wrap.innerHTML = '';

    lenses.forEach(lens => {
      const section = document.createElement('section');
      section.className = 'lens';
      section.dataset.key = lens.key;
      section.innerHTML = `
        <div class="lens-header">
          <div class="lens-number">${lens.number}</div>
          <div class="lens-title-row">
            <h3>${lens.title}</h3>
            <div class="lens-actions no-print">
              <button class="button small edit-content-btn" data-editor-key="${lens.key}" data-editor-title="${lens.title}">Edit</button>
            </div>
          </div>
          <p class="lens-question">${lens.question}</p>
          <div class="guidance" id="guidance-${lens.key}">${lens.guidance}</div>
        </div>
        <div class="lens-body">
          <div class="editable-content empty" data-editor-key="${lens.key}" data-editor-title="${lens.title}" tabindex="0" role="button" aria-label="Edit ${lens.title} observations"></div>
          <div class="wordcount" data-count="${lens.key}">0 characters</div>
        </div>`;
      wrap.appendChild(section);
    });

    bindFrameworkControls();
  }

  function bindFrameworkControls() {
    document.querySelectorAll('.edit-content-btn').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        openEditor(button.dataset.editorKey, button.dataset.editorTitle);
      });
    });

    document.querySelectorAll('.editable-content').forEach(element => {
      element.addEventListener('click', () => openEditor(element.dataset.editorKey, element.dataset.editorTitle));
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openEditor(element.dataset.editorKey, element.dataset.editorTitle);
        }
      });
    });
  }

  function valueFor(key) {
    const a = active();
    if (!a) return '';
    return key === 'notes' ? (a.notes || '') : ((a.answers && a.answers[key]) || '');
  }

  function setValueFor(key, value) {
    const a = active();
    if (!a) return;
    if (key === 'notes') a.notes = value;
    else {
      a.answers = a.answers || {};
      a.answers[key] = value;
    }
  }

  function renderContent() {
    lenses.forEach(lens => renderEditorContent(lens.key));
    renderEditorContent('notes');
  }

  function renderEditorContent(key) {
    const content = valueFor(key);
    document.querySelectorAll(`.editable-content[data-editor-key="${CSS.escape(key)}"]`).forEach(element => {
      const title = element.dataset.editorTitle || 'response';
      element.classList.toggle('empty', !content.trim());
      element.classList.toggle('has-content', !!content.trim());
      element.innerHTML = '';
      if (content.trim()) {
        const text = document.createElement('span');
        text.textContent = content;
        element.appendChild(text);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'edit-placeholder';
        placeholder.textContent = key === 'notes' ? 'No further notes recorded. Select Edit to add notes.' : `No observations recorded for ${title}. Select Edit to add observations.`;
        element.appendChild(placeholder);
      }
    });

    const count = content.length;
    const counter = document.querySelector(`[data-count="${CSS.escape(key)}"]`);
    if (counter) counter.textContent = count + ' characters';
  }

  function populate() {
    const a = active();
    if (!a) return;
    a.answers = a.answers || {};

    $('auditName').value = a.name || '';
    $('auditor').value = a.auditor || '';
    $('interaction').value = a.interaction || '';
    $('location').value = a.location || '';
    $('createdAt').textContent = formatDate(a.createdAt);
    $('updatedAt').textContent = formatDate(a.updatedAt);
    $('saveStatus').textContent = 'Saved locally · ' + formatDate(a.updatedAt);

    renderContent();
    updatePrintContext();
  }

  function updatePrintContext() {
    const a = active();
    if (!a) return;

    $('printContext').innerHTML = `
      <div class="print-context-header">
        <div class="eyebrow">01 · CONTEXT</div>
        <h2>Accessibility audit</h2>
      </div>
      <dl class="print-context-grid">
        <div><dt>Audit name</dt><dd>${escapeHtml(a.name || 'Untitled accessibility audit')}</dd></div>
        <div><dt>Auditor</dt><dd>${escapeHtml(a.auditor || 'Not specified')}</dd></div>
        <div><dt>Interaction / scenario</dt><dd>${escapeHtml(a.interaction || 'Not specified')}</dd></div>
        <div><dt>Location / context</dt><dd>${escapeHtml(a.location || 'Not specified')}</dd></div>
      </dl>`;

    const generated = formatDate(nowIso());
    $('printTimestamp').textContent = 'Generated: ' + generated;
    $('printFooterName').textContent = (a.name || 'Untitled accessibility audit') + ' · ' + (a.interaction || 'No interaction specified');
    $('printFooterTime').textContent = 'Generated ' + generated;
  }

  function bindField(id, key) {
    $(id).addEventListener('input', event => {
      const a = active();
      if (!a) return;
      a[key] = event.target.value;
      touch();
    });
  }

  function openEditor(key, title) {
    editorKey = key;
    $('editorHeading').textContent = 'Edit ' + title;
    $('editorInstruction').textContent = key === 'notes'
      ? 'Add any contextual notes, patterns, questions or other observations.'
      : 'Record your observations in context while conducting the audit.';
    $('editorInput').value = valueFor(key);
    updateEditorCount();
    $('editorModal').classList.remove('hidden');
    $('editorModal').setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => $('editorInput').focus());
  }

  function closeEditor() {
    editorKey = null;
    $('editorModal').classList.add('hidden');
    $('editorModal').setAttribute('aria-hidden', 'true');
  }

  function updateEditorCount() {
    const count = $('editorInput').value.length;
    $('editorCount').textContent = count + ' characters';
  }

  function saveEditor() {
    if (!editorKey) return;
    setValueFor(editorKey, $('editorInput').value);
    touch();
    renderContent();
    closeEditor();
    toast('Response saved');
  }

  function renameActive() {
    const a = active();
    if (!a) return;
    const name = prompt('Rename audit', a.name);
    if (name === null) return;
    a.name = name.trim() || a.name;
    touch();
    populate();
    toast('Audit renamed');
  }

  function createNewAudit() {
    const name = prompt('Name this audit', 'Untitled interaction');
    if (name === null) return;
    const fresh = makeAudit(name.trim() || 'Untitled interaction');
    audits.unshift(fresh);
    activeId = fresh.id;
    persist();
    renderFramework();
    populate();
    toast('New audit created');
  }

  function duplicateActive() {
    const a = active();
    if (!a) return;
    const name = prompt('Name the duplicate', a.name + ' copy');
    if (name === null) return;
    const copy = JSON.parse(JSON.stringify(a));
    copy.id = 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    copy.name = name.trim() || a.name + ' copy';
    copy.createdAt = nowIso();
    copy.updatedAt = copy.createdAt;
    audits.unshift(copy);
    activeId = copy.id;
    persist();
    renderFramework();
    populate();
    toast('Audit duplicated');
  }

  function openAudits() {
    const list = $('auditsList');
    if (!audits.length) {
      list.innerHTML = '<div class="empty-state">No saved audits.</div>';
    } else {
      list.innerHTML = '<div>' + audits.map(a => `
        <div class="audit-row">
          <div>
            <div class="audit-name">${escapeHtml(a.name)}</div>
            <div class="audit-meta-line">Updated ${escapeHtml(formatDate(a.updatedAt))} · ${escapeHtml(a.interaction || 'No interaction specified')}</div>
          </div>
          <div class="audit-actions">
            <button class="button small" data-open="${a.id}">Open</button>
            <button class="button small" data-rename="${a.id}">Rename</button>
            <button class="button small" data-duplicate="${a.id}">Duplicate</button>
            <button class="button small" data-delete="${a.id}">Delete</button>
          </div>
        </div>`).join('') + '</div>';

      list.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
        activeId = button.dataset.open;
        persist();
        renderFramework();
        populate();
        closeModal('auditsModal');
        toast('Audit opened');
      }));

      list.querySelectorAll('[data-rename]').forEach(button => button.addEventListener('click', () => {
        activeId = button.dataset.rename;
        persist();
        renameActive();
        openAudits();
      }));

      list.querySelectorAll('[data-duplicate]').forEach(button => button.addEventListener('click', () => {
        activeId = button.dataset.duplicate;
        persist();
        duplicateActive();
        openAudits();
      }));

      list.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteAudit(button.dataset.delete)));
    }

    const modal = $('auditsModal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function deleteAudit(id) {
    const target = audits.find(a => a.id === id);
    if (!target) return;
    if (!confirm('Delete “' + target.name + '”? This cannot be undone.')) return;

    audits = audits.filter(a => a.id !== id);
    if (!audits.length) {
      const fresh = makeAudit('Untitled interaction');
      audits = [fresh];
      activeId = fresh.id;
    } else if (activeId === id) {
      activeId = audits[0].id;
    }
    persist();
    renderFramework();
    populate();
    openAudits();
    toast('Audit deleted');
  }

  function exportAudits() {
    const payload = {
      format:'interaction-design-accessibility-audit',
      version:2,
      exportedAt:nowIso(),
      audits
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'accessibility-audits-' + new Date().toISOString().slice(0,10) + '.json';
    link.click();
    URL.revokeObjectURL(url);
    toast('Audits exported');
  }

  $('auditsBtn').addEventListener('click', openAudits);
  $('newBtn').addEventListener('click', createNewAudit);
  $('renameBtn').addEventListener('click', renameActive);
  $('duplicateBtn').addEventListener('click', duplicateActive);
  $('newAuditModalBtn').addEventListener('click', () => { closeModal('auditsModal'); createNewAudit(); });
  $('printBtn').addEventListener('click', () => { updatePrintContext(); window.print(); });
  $('saveEditorBtn').addEventListener('click', saveEditor);
  $('editorInput').addEventListener('input', updateEditorCount);

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.close));
  });

  ['auditsModal','editorModal'].forEach(id => {
    $(id).addEventListener('click', event => {
      if (event.target.id === id) closeModal(id);
    });
  });

  bindField('auditName','name');
  bindField('auditor','auditor');
  bindField('interaction','interaction');
  bindField('location','location');

  $('exportBtn').addEventListener('click', exportAudits);
  $('exportModalBtn').addEventListener('click', exportAudits);
  $('importBtn').addEventListener('click', () => $('importInput').click());
  $('importModalBtn').addEventListener('click', () => $('importInput').click());
  $('importInput').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const incoming = Array.isArray(payload) ? payload : payload.audits;
      if (!Array.isArray(incoming)) throw new Error('Invalid format');
      const cleaned = incoming
        .filter(a => a && a.name)
        .map(a => ({...makeAudit(a.name), ...a, answers:{...makeAudit(a.name).answers, ...(a.answers || {})}}));
      if (!cleaned.length) throw new Error('No audits found');
      const replace = confirm('Import ' + cleaned.length + ' audit(s). Choose OK to replace local audits, or Cancel to add them.');
      audits = replace ? cleaned : cleaned.concat(audits);
      activeId = audits[0].id;
      persist();
      renderFramework();
      populate();
      closeModal('auditsModal');
      toast('Audits imported');
    } catch (error) {
      alert('Could not import this file. Please use a JSON export from this tool.');
    }
    event.target.value = '';
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal('auditsModal');
      closeEditor();
    }
  });

  renderFramework();
  populate();
})();
