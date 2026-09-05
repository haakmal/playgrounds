(() => {
  'use strict';

  const STORAGE_KEY = 'interaction_research_mapper_v3_documents';
  const ACTIVE_KEY = 'interaction_research_mapper_v3_active';
  const MAX_COMPARE = 4;
  const EMOTIONS = [
    { value: 5, label: 'Very positive', emoji: '😄' },
    { value: 4, label: 'Positive', emoji: '🙂' },
    { value: 3, label: 'Neutral', emoji: '😐' },
    { value: 2, label: 'Low', emoji: '😕' },
    { value: 1, label: 'Very low', emoji: '😣' }
  ];

  let documents = [];
  let activeDocumentId = null;
  let activeProfileId = null;
  let activeEmpathyId = null;
  let activeJourneyId = null;
  let activeTab = 'profiles';
  let compareKeys = [];
  let drawerOpen = false;
  let evidenceFilter = 'all';

  const $ = (id) => document.getElementById(id);
  const now = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const pad = (value) => String(value).padStart(2, '0');
  const displayDate = (iso) => iso ? new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso)) : '';

  function freshCounters() {
    return { PR: 0, MP: 0, JM: 0, PH: 0, ST: 0, IN: 0, EM: 0, OB: 0 };
  }

  function nextCode(doc, prefix) {
    doc.counters[prefix] = (doc.counters[prefix] || 0) + 1;
    return `${prefix}${pad(doc.counters[prefix])}`;
  }

  function makeEntry(doc, prefix, text = '') {
    return { id: uid(prefix.toLowerCase()), code: nextCode(doc, prefix), text: String(text || '') };
  }

  function makeProfile(doc, name) {
    return {
      id: uid('profile'), code: nextCode(doc, 'PR'), name: name || `User ${pad((doc.profiles?.length || 0) + 1)}`,
      age: '', occupation: '', context: '',
      chars: { familiarity: 3, confidence: 3, interest: 3, experience: 3 },
      needs: [], pains: [], motivations: [], constraints: []
    };
  }

  function makeEmpathyMap(doc, profileId) {
    const index = (doc.empathyMaps || []).filter((m) => m.profileId === profileId).length + 1;
    return {
      id: uid('empathy'), code: nextCode(doc, 'MP'), profileId,
      name: `Empathy map ${pad(index)}`,
      entries: { says: [], thinks: [], does: [], feels: [] }
    };
  }

  function localNextCode(items, prefix, field='code') {
    const nums = (items || []).map((item) => parseInt(String(item?.[field] || '').replace(/\D/g, ''), 10) || 0);
    return `${prefix}${pad(Math.max(0, ...nums) + 1)}`;
  }

  function makePhase(doc, journey, index) {
    const defaults = ['Beginning', 'Middle', 'Completion'];
    return {
      id: uid('phase'), code: localNextCode(journey.phases, 'PH'), name: defaults[index - 1] || `Phase ${index}`,
      steps: [], emotion: 3, insight: { id: uid('in'), code: 'IN01', text: '' }
    };
  }

  function makeJourney(doc, profileId) {
    const index = (doc.journeys || []).filter((j) => j.profileId === profileId).length + 1;
    const journey = {
      id: uid('journey'), code: nextCode(doc, 'JM'), profileId,
      name: `Interaction journey ${pad(index)}`, scenario: '', goal: '', phases: []
    };
    journey.phases.push(makePhase(doc, journey, 1), makePhase(doc, journey, 2), makePhase(doc, journey, 3));
    return journey;
  }

  function makeDocument(name = 'Untitled research') {
    const doc = {
      id: uid('document'), name, createdAt: now(), updatedAt: now(), interaction: '',
      profiles: [], empathyMaps: [], journeys: [], comparisonHistory: [], counters: freshCounters()
    };
    const profile = makeProfile(doc);
    doc.profiles.push(profile);
    doc.empathyMaps.push(makeEmpathyMap(doc, profile.id));
    doc.journeys.push(makeJourney(doc, profile.id));
    return doc;
  }

  function migrateEntry(doc, value, prefix) {
    const entry = typeof value === 'string' ? { text: value } : (value || {});
    if (!entry.id) entry.id = uid(prefix.toLowerCase());
    if (!entry.code) entry.code = nextCode(doc, prefix);
    else doc.counters[prefix] = Math.max(doc.counters[prefix] || 0, parseInt(String(entry.code).replace(/\D/g, ''), 10) || 0);
    entry.text = String(entry.text ?? '');
    return entry;
  }

  function migrateDocument(doc) {
    doc.counters = Object.assign(freshCounters(), doc.counters || {});
    doc.comparisonHistory = Array.isArray(doc.comparisonHistory) ? doc.comparisonHistory : [];
    doc.profiles = Array.isArray(doc.profiles) ? doc.profiles : [];
    doc.empathyMaps = Array.isArray(doc.empathyMaps) ? doc.empathyMaps : [];
    doc.journeys = Array.isArray(doc.journeys) ? doc.journeys : [];
    doc.profiles.forEach((profile) => {
      profile.id ||= uid('profile');
      if (!profile.code) profile.code = nextCode(doc, 'PR');
      profile.chars = Object.assign({ familiarity: 3, confidence: 3, interest: 3, experience: 3 }, profile.chars || {});
      ['needs', 'pains', 'motivations', 'constraints'].forEach((key) => {
        profile[key] = (profile[key] || []).map((item) => migrateEntry(doc, item, 'OB'));
      });
    });
    doc.empathyMaps.forEach((map) => {
      map.id ||= uid('empathy');
      if (!map.code) map.code = nextCode(doc, 'MP');
      map.entries = map.entries || {};
      ['says', 'thinks', 'does', 'feels'].forEach((key) => {
        map.entries[key] = (map.entries[key] || []).map((item) => migrateEntry(doc, item, 'EM'));
      });
    });
    doc.journeys.forEach((journey) => {
      journey.id ||= uid('journey');
      if (!journey.code) journey.code = nextCode(doc, 'JM');
      journey.phases = (journey.phases || []).map((phase, index) => {
        phase.id ||= uid('phase');
        phase.code ||= `PH${pad(index + 1)}`;
        phase.steps = Array.isArray(phase.steps) ? phase.steps : [];
        let usedStep = phase.steps.map((item, stepIndex) => {
          const migrated = migrateEntry(doc, item, 'ST');
          migrated.code ||= `ST${pad(stepIndex + 1)}`;
          return migrated;
        });
        phase.steps = usedStep;
        phase.emotion = Number(phase.emotion) || 3;
        if (typeof phase.insight === 'string') phase.insight = { text: phase.insight };
        phase.insight = phase.insight || { id: uid('in'), code: 'IN01', text: '' };
        phase.insight.id ||= uid('in'); phase.insight.code ||= 'IN01'; phase.insight.text = String(phase.insight.text ?? '');
        phase.name ||= `Phase ${index + 1}`;
        return phase;
      });
      while (journey.phases.length < 3) journey.phases.push(makePhase(doc, journey, journey.phases.length + 1));
    });
    doc.updatedAt ||= now();
    return doc;
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    if (activeDocumentId) localStorage.setItem(ACTIVE_KEY, activeDocumentId);
  }

  function load() {
    try { documents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') || []; }
    catch { documents = []; }
    if (!documents.length) documents.push(makeDocument());
    documents = documents.map(migrateDocument);
    activeDocumentId = localStorage.getItem(ACTIVE_KEY);
    if (!documents.some((doc) => doc.id === activeDocumentId)) activeDocumentId = documents[0].id;
    persist();
  }

  function currentDocument() { return documents.find((doc) => doc.id === activeDocumentId) || null; }
  function currentProfile() {
    const doc = currentDocument();
    if (!doc || !doc.profiles.length) return null;
    if (!doc.profiles.some((p) => p.id === activeProfileId)) activeProfileId = doc.profiles[0].id;
    return doc.profiles.find((p) => p.id === activeProfileId) || doc.profiles[0];
  }
  function currentEmpathy() {
    const doc = currentDocument(), profile = currentProfile();
    const maps = doc?.empathyMaps.filter((map) => map.profileId === profile?.id) || [];
    if (!maps.length) return null;
    if (!maps.some((map) => map.id === activeEmpathyId)) activeEmpathyId = maps[0].id;
    return maps.find((map) => map.id === activeEmpathyId) || maps[0];
  }
  function currentJourney() {
    const doc = currentDocument(), profile = currentProfile();
    const journeys = doc?.journeys.filter((journey) => journey.profileId === profile?.id) || [];
    if (!journeys.length) return null;
    if (!journeys.some((journey) => journey.id === activeJourneyId)) activeJourneyId = journeys[0].id;
    return journeys.find((journey) => journey.id === activeJourneyId) || journeys[0];
  }

  function touch() {
    const doc = currentDocument();
    if (!doc) return;
    doc.updatedAt = now();
    persist();
    const status = $('saveStatus');
    const title = $('docTitleDisplay');
    if (status) status.textContent = `Saved locally · ${displayDate(doc.updatedAt)}`;
    if (title) title.textContent = doc.name;
  }

  function setTab(tab) {
    activeTab = tab;
    if (tab !== 'analyse') drawerOpen = false;
    document.querySelectorAll('.section-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    renderTools();
    render();
    syncWorkspace();
  }

  function syncWorkspace() {
    const shell = $('workspaceShell');
    if (!shell) return;
    shell.classList.toggle('analyse-mode', activeTab === 'analyse');
    shell.classList.toggle('drawer-open', activeTab === 'analyse' && drawerOpen);
    const drawer = $('evidenceDrawer');
    if (drawer) drawer.setAttribute('aria-hidden', String(!(activeTab === 'analyse' && drawerOpen)));
    const rail = document.querySelector('.drawer-rail');
    if (rail) {
      rail.setAttribute('aria-expanded', String(activeTab === 'analyse' && drawerOpen));
      const label = rail.querySelector('[data-rail-label]');
      const arrow = rail.querySelector('b');
      if (label) label.textContent = drawerOpen ? 'Hide evidence' : 'Evidence index';
      if (arrow) arrow.textContent = drawerOpen ? '›' : '‹';
    }
  }

  function render() {
    const root = $('canvas');
    if (!root) return;
    const doc = currentDocument();
    try {
      if (!doc) { root.innerHTML = '<div class="empty error-state">No research document is available.</div>'; return; }
      const interaction = $('interactionInput');
      if (interaction && interaction.value !== doc.interaction) interaction.value = doc.interaction || '';
      if ($('docTitleDisplay')) $('docTitleDisplay').textContent = doc.name;
      if ($('saveStatus')) $('saveStatus').textContent = `Saved locally · ${displayDate(doc.updatedAt)}`;
      const renderers = { profiles: renderProfiles, empathy: renderEmpathy, journeys: renderJourneys, analyse: renderAnalyse };
      (renderers[activeTab] || renderProfiles)();
      if (activeTab === 'analyse') renderEvidenceDrawer();
    } catch (error) {
      console.error('Render error:', error);
      root.innerHTML = `<div class="empty error-state"><strong>Unable to render this section.</strong><br>${esc(error.message || error)}</div>`;
    }
  }

  function intro(kicker, title, description, tag = '') {
    return `<div class="section-intro"><div><div class="overline">${kicker}</div><h2>${title}</h2><p>${description}</p></div>${tag ? `<div class="code-note">${tag}</div>` : ''}</div>`;
  }

  function renderTools() {
    const root = $('viewTools');
    if (!root) return;
    const doc = currentDocument();
    const profile = currentProfile();
    let html = '';
    if (activeTab !== 'analyse') {
      html += `<label class="view-tools-label"><span class="mini-label">User</span><select id="userSelect" class="view-select">${doc.profiles.map((p) => `<option value="${p.id}" ${p.id === profile?.id ? 'selected' : ''}>${esc(p.code)} · ${esc(p.name)}</option>`).join('')}</select></label>`;
    }
    if (activeTab === 'profiles') html += '<button class="outline-btn" data-action="profile-new">+ New profile</button>';
    if (activeTab === 'empathy') {
      const maps = doc.empathyMaps.filter((map) => map.profileId === profile?.id);
      const map = currentEmpathy();
      html += `<label class="view-tools-label"><span class="mini-label">Map</span><select id="artifactSelect" class="view-select">${maps.map((m) => `<option value="${m.id}" ${m.id === map?.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label><button class="outline-btn" data-action="empathy-new">+ New map</button><button class="outline-btn danger-btn" data-action="empathy-rename">Rename</button>`;
    }
    if (activeTab === 'journeys') {
      const journeys = doc.journeys.filter((journey) => journey.profileId === profile?.id);
      const journey = currentJourney();
      html += `<label class="view-tools-label"><span class="mini-label">Journey</span><select id="artifactSelect" class="view-select">${journeys.map((j) => `<option value="${j.id}" ${j.id === journey?.id ? 'selected' : ''}>${esc(j.name)}</option>`).join('')}</select></label><button class="outline-btn" data-action="journey-new">+ New journey</button><button class="outline-btn danger-btn" data-action="journey-rename">Rename</button>`;
    }
    if (activeTab === 'analyse') html += '<button class="solid-btn" data-action="analyse-clear">Clear comparison</button>';
    root.innerHTML = html;
  }

  function renderProfiles() {
    const profile = currentProfile();
    $('canvas').innerHTML = intro('01 · Profiles', 'User profile', 'Describe the person in relation to the interaction. Keep the profile relevant to this task.', profile.code) + `
      <div class="profile-layout"><div class="sheet">
        <div class="sheet-head">
          ${field('Name / pseudonym', 'profileName', profile.name)}
          ${field('Age', 'profileAge', profile.age, 'number', '0', '120')}
          ${field('Occupation', 'profileOccupation', profile.occupation)}
        </div>
        <div class="block"><h3>Context</h3><textarea data-field="profile-context" placeholder="How are they associated with this task?">${esc(profile.context)}</textarea></div>
        <div class="characteristics"><h3>Characteristics</h3>${['familiarity','confidence','interest','experience'].map((key) => `<div class="range-row"><label>${key[0].toUpperCase()+key.slice(1)}</label><input type="range" min="1" max="5" step="1" value="${profile.chars[key]}" data-char="${key}"><span class="range-val">${profile.chars[key]}</span></div>`).join('')}</div>
        <div class="block-grid">${repeatBlock('Needs','needs',profile)}${repeatBlock('Pain points','pains',profile)}${repeatBlock('Motivations','motivations',profile)}${repeatBlock('Constraints','constraints',profile)}</div>
      </div><aside class="side-panel"><div class="side-label">Profile key</div><strong>${esc(profile.code)}</strong><p>Profile identifiers remain stable so references do not change when items are deleted.</p></aside></div>`;
  }

  function field(label, id, value, type = 'text', min = '', max = '') {
    const bounds = type === 'number' ? ` min="${min}" max="${max}" step="1" inputmode="numeric"` : '';
    return `<div class="field"><label>${label}</label><input id="${id}" type="${type}"${bounds} value="${esc(value)}"></div>`;
  }

  function repeatBlock(title, key, profile) {
    return `<div class="block"><h3>${title}</h3><div class="entry-list">${(profile[key] || []).map((entry, index) => `<div class="entry"><input data-repeat="${key}" data-index="${index}" value="${esc(entry.text)}"><span class="entry-code">${esc(profileEntryKey(profile, key, entry))}</span><button class="entry-delete" data-action="profile-delete" data-key="${key}" data-index="${index}">×</button></div>`).join('')}</div><button class="add-btn" data-action="profile-add" data-key="${key}">+ Add</button></div>`;
  }

  function renderEmpathy() {
    const map = currentEmpathy(), profile = currentProfile();
    if (!map || !profile) { $('canvas').innerHTML = '<div class="empty">Create a profile first.</div>'; return; }
    $('canvas').innerHTML = intro('02 · Empathy maps', map.name, 'Capture Says, Thinks, Does and Feels around the person. This is not a timeline.', 'EM = empathy evidence') + `
      <div class="empathy-wrap"><div class="empathy-user"><strong>${esc(profile.name)}</strong><span>${esc(profile.context || 'Interaction context not yet described')}</span></div><div class="map-grid">${quadrant(map, profile, 'says', 'Says', 'What did the person actually say?')}${quadrant(map, profile, 'thinks', 'Thinks', 'What appears to occupy their thoughts? Mark inference carefully.')}${quadrant(map, profile, 'does', 'Does', 'What observable actions, pauses, repetitions or changes occurred?')}${quadrant(map, profile, 'feels', 'Feels', 'What emotional qualities are evident from observation or what they tell you?')}</div></div>`;
  }

  function quadrant(map, profile, key, title, help) {
    return `<section class="quad"><h3>${title}</h3><p>${help}</p><div class="note-list">${map.entries[key].map((entry, index) => `<div class="note" data-evidence-key="${esc(empathyEntryKey(profile, map, key, entry))}"><div class="note-main"><textarea data-empathy="${key}" data-index="${index}" placeholder="Add an observation...">${esc(entry.text)}</textarea><span class="note-key">${esc(empathyEntryKey(profile, map, key, entry))}</span></div><button class="entry-delete" data-action="empathy-delete" data-key="${key}" data-index="${index}">×</button></div>`).join('')}</div><button class="add-btn" data-action="empathy-add" data-key="${key}">+ Add observation</button></section>`;
  }

  function renderJourneys() {
    const journey = currentJourney(), profile = currentProfile();
    if (!journey || !profile) { $('canvas').innerHTML = '<div class="empty">Create a profile first.</div>'; return; }
    $('canvas').innerHTML = intro('03 · Journeys', journey.name, 'Map a specific interaction from left to right. Start with three phases and add phases only when needed.', 'JN = journey · PH / ST / IN = journey evidence') + `
      <div class="journey-page"><div class="journey-setup">${field('Journey name', 'journeyName', journey.name)}<div></div><div class="field"><label>Scenario</label><textarea data-field="journey-scenario">${esc(journey.scenario)}</textarea></div><div class="field"><label>User goal</label><textarea data-field="journey-goal">${esc(journey.goal)}</textarea></div></div>
      <div class="journey-scroll"><div class="journey-board">${journeyHeaders(journey)}${journeyRowSteps(journey)}${journeyRowEmotion(journey)}${journeyRowInsights(journey)}</div></div></div>`;
  }

  function journeyHeaders(journey) {
    return `<div class="journey-row phase-header-row"><div class="row-label">Phases</div>${journey.phases.map((phase, index) => `<div class="phase-head"><span>${esc(phase.code)}</span><input data-phase-name="${index}" value="${esc(phase.name)}">${journey.phases.length > 3 ? `<button class="mini phase-delete" data-action="phase-delete" data-index="${index}">×</button>` : ''}</div>`).join('')}<div class="add-phase-cell"><button class="add-btn" data-action="phase-add">+ Add phase</button></div></div>`;
  }

  function journeyRowSteps(journey) {
    return `<div class="journey-row"><div class="row-label">Steps</div>${journey.phases.map((phase, phaseIndex) => `<div class="phase-cell"><div class="steps-list">${phase.steps.map((step, index) => `<div class="step-entry" data-evidence-key="${esc(journeyStepKey(journey, phase, step))}"><span>${index + 1}</span><input data-step="${phaseIndex}:${index}" value="${esc(step.text)}" placeholder="What happened?"><span class="entry-code">${esc(journeyStepKey(journey, phase, step))}</span><button class="entry-delete" data-action="step-delete" data-phase="${phaseIndex}" data-index="${index}">×</button></div>`).join('')}</div><button class="add-btn" data-action="step-add" data-phase="${phaseIndex}">+ Add step</button></div>`).join('')}<div class="add-phase-cell"></div></div>`;
  }

  function journeyRowEmotion(journey) {
    return `<div class="journey-row emotion-row"><div class="row-label">Emotion</div><div class="emotion-track-wrap" style="--phase-count:${journey.phases.length}">${journey.phases.map((phase, index) => `<div class="emotion-cell"><select data-emotion="${index}" aria-label="Emotion for ${esc(phase.name)}">${EMOTIONS.map((emotion) => `<option value="${emotion.value}" ${emotion.value === phase.emotion ? 'selected' : ''}>${emotion.emoji} ${emotion.label}</option>`).join('')}</select></div>`).join('')}<div class="emotion-line-area">${emotionSvg(journey)}</div></div><div class="add-phase-cell"></div></div>`;
  }

  function emotionSvg(journey) {
    if (journey.phases.length < 2) return '';
    const width = journey.phases.length * 300;
    const height = 86;
    const points = journey.phases.map((phase, index) => [150 + index * 300, 70 - (phase.emotion - 1) * 13]);
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], mid = (a[0] + b[0]) / 2;
      path += ` C ${mid} ${a[1]}, ${mid} ${b[1]}, ${b[0]} ${b[1]}`;
    }
    return `<svg class="emotion-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${path}" fill="none" stroke="#111" stroke-width="2.5"></path>${points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#111" stroke-width="2"></circle>`).join('')}</svg>`;
  }

  function journeyRowInsights(journey) {
    return `<div class="journey-row"><div class="row-label">Insights</div>${journey.phases.map((phase, index) => `<div class="phase-cell insight-cell" data-evidence-key="${esc(journeyInsightKey(journey, phase))}"><textarea data-insight="${index}" placeholder="What does this phase reveal?">${esc(phase.insight.text)}</textarea><span class="entry-code">${esc(journeyInsightKey(journey, phase))}</span></div>`).join('')}<div class="add-phase-cell"></div></div>`;
  }

  function renderAnalyse() {
    const doc = currentDocument();
    const valid = compareKeys.map(evidenceByKey).filter(Boolean);
    compareKeys = valid.map((item) => item.key);
    const cards = valid.map((item) => `<article class="evidence-card" data-evidence-key="${esc(item.key)}"><div class="evidence-card-head"><div><div class="hier-key">${esc(item.key)}</div><div class="evidence-type">${esc(item.label)}</div></div><button class="entry-delete" data-action="compare-remove" data-key="${esc(item.key)}">×</button></div><div class="evidence-card-body">${esc(item.text || 'No content recorded.')}</div><div class="evidence-card-foot"><span>${esc(item.location)}</span><button class="outline-btn" data-action="open-source" data-key="${esc(item.key)}">Open source</button></div></article>`).join('');
    const emptyCount = Math.max(0, 4 - valid.length);
    const empties = Array.from({ length: emptyCount }, () => '<div class="evidence-card empty-card"><span>Select evidence from the index →</span></div>').join('');
    const history = (doc.comparisonHistory || []).map((keys, index) => `<div class="recent-row"><div class="recent-keys">${keys.map((key) => `<code>${esc(key)}</code>`).join('')}</div><button class="outline-btn" data-action="history-restore" data-index="${index}">Restore</button></div>`).join('');
    $('canvas').innerHTML = intro('04 · Analyse', 'Compare evidence', 'Bring evidence into the same view and inspect it yourself. The tool does not interpret, correlate or annotate relationships.', 'Up to four evidence items') + `<div class="analyse-shell"><div class="analyse-toolbar"><p>Select evidence from the persistent index. Use the hierarchical keys to trace where each item came from.</p><span class="analyse-note">Comparison only · no notes stored</span></div><div class="compare-grid">${cards}${empties}</div><section class="recent-comparisons"><h3>Recent comparisons</h3>${history ? `<div class="recent-list">${history}</div><button class="outline-btn" data-action="history-clear" style="margin-top:8px">Clear history</button>` : '<div class="empty">Two or more selected evidence items will appear here as a restorable combination.</div>'}</section></div>`;
  }

  function evidenceObjects(doc) {
    const items = [];
    doc.profiles.forEach((profile) => {
      items.push({ key: profile.code, type: 'profile', label: 'Profile', location: profile.name, text: [profile.context, profile.occupation && `Occupation: ${profile.occupation}`, profile.age && `Age: ${profile.age}`].filter(Boolean).join('\n'), profileId: profile.id, sourceType: 'profile' });
      ['needs','pains','motivations','constraints'].forEach((key) => (profile[key] || []).forEach((entry) => items.push({ key: profileEntryKey(profile,key,entry), type: 'profile', label: key === 'pains' ? 'Pain point' : key[0].toUpperCase()+key.slice(1), location: profile.name, text: entry.text, profileId: profile.id, sourceType: 'profile' })));
    });
    doc.empathyMaps.forEach((map) => {
      const profile = doc.profiles.find((p) => p.id === map.profileId);
      ['says','thinks','does','feels'].forEach((quadrant) => map.entries[quadrant].forEach((entry) => items.push({ key: empathyEntryKey(profile,map,quadrant,entry), type: 'empathy', label: quadrant.toUpperCase(), location: `${profile?.name || 'User'} · ${map.name}`, text: entry.text, profileId: map.profileId, mapId: map.id, quadrant, entryId: entry.id, sourceType: 'empathy' })));
    });
    doc.journeys.forEach((journey) => journey.phases.forEach((phase) => {
      const profile = doc.profiles.find((p) => p.id === journey.profileId);
      phase.steps.forEach((step) => items.push({ key: journeyStepKey(journey,phase,step), type: 'journey', label: 'STEP', location: `${profile?.name || 'User'} · ${journey.name} · ${phase.name}`, text: step.text, profileId: journey.profileId, journeyId: journey.id, phaseId: phase.id, entryId: step.id, sourceType: 'journey' }));
      items.push({ key: journeyInsightKey(journey,phase), type: 'journey', label: 'INSIGHT', location: `${profile?.name || 'User'} · ${journey.name} · ${phase.name}`, text: phase.insight.text, profileId: journey.profileId, journeyId: journey.id, phaseId: phase.id, entryId: phase.insight.id, sourceType: 'journey' });
    }));
    return items;
  }

  function profileEntryKey(profile, category, entry) {
    const codeMap = { needs: 'NE', pains: 'PA', motivations: 'MO', constraints: 'CO' };
    return `${profile.code}-${codeMap[category] || 'OB'}${String(entry.code).replace(/\D/g,'').padStart(2,'0')}`;
  }
  function empathyEntryKey(profile, map, quadrant, entry) {
    const codeMap = { says: 'SA', thinks: 'TH', does: 'DO', feels: 'FE' };
    return `${profile?.code || 'PR00'}/${mapDisplayCode(map)}-${codeMap[quadrant]}${String(entry.code).replace(/\D/g,'').padStart(2,'0')}`;
  }
  function mapDisplayCode(map) { return `EM${String(map.code).replace(/\D/g,'').padStart(2,'0')}`; }
  function journeyDisplayCode(journey) { return `JN${String(journey.code).replace(/\D/g,'').padStart(2,'0')}`; }
  function phaseKey(journey, phase) { const profile = currentDocument().profiles.find((p) => p.id === journey.profileId); return `${profile?.code || 'PR00'}/${journeyDisplayCode(journey)}-${phase.code}`; }
  function journeyStepKey(journey, phase, entry) { return `${phaseKey(journey,phase)}-ST${String(entry.code).replace(/\D/g,'').padStart(2,'0')}`; }
  function journeyInsightKey(journey, phase) { return `${phaseKey(journey,phase)}-IN${String(phase.insight.code).replace(/\D/g,'').padStart(2,'0')}`; }

  function evidenceByKey(key) { return evidenceObjects(currentDocument()).find((item) => item.key === key); }

  function renderEvidenceDrawer() {
    const root = $('evidenceDrawerList');
    if (!root) return;
    const search = ($('evidenceSearch')?.value || '').toLowerCase().trim();
    const doc = currentDocument();
    const all = evidenceObjects(doc).filter((item) => {
      const filterMatch = evidenceFilter === 'all' || item.sourceType === evidenceFilter;
      const textMatch = !search || `${item.key} ${item.label} ${item.location} ${item.text}`.toLowerCase().includes(search);
      return filterMatch && textMatch;
    });
    root.innerHTML = doc.profiles.map((profile) => {
      const items = all.filter((item) => item.profileId === profile.id);
      if (!items.length) return '';
      return `<section class="drawer-group"><div class="drawer-profile-band"><span>${esc(profile.code)}</span><strong>${esc(profile.name)}</strong></div>${items.map((item) => `<div class="drawer-item"><div><div class="drawer-key">${esc(item.key)}</div><div class="drawer-meta">${esc(item.label)} · ${esc(item.location)}</div><div class="drawer-preview">${esc(item.text || 'No content recorded.')}</div></div>${compareKeys.includes(item.key) ? '' : `<button class="drawer-add" data-action="compare-add" data-key="${esc(item.key)}" ${compareKeys.length >= MAX_COMPARE ? 'disabled' : ''}>+</button>`}</div>`).join('')}</section>`;
    }).join('') || '<div class="empty">No evidence matches this filter.</div>';
  }

  function toggleDrawer() {
    if (activeTab !== 'analyse') return;
    drawerOpen = !drawerOpen;
    syncWorkspace();
    renderEvidenceDrawer();
  }

  function addComparison(key) {
    if (compareKeys.includes(key) || compareKeys.length >= MAX_COMPARE) return;
    compareKeys.push(key);
    saveComparisonHistory();
    renderAnalyse();
    renderEvidenceDrawer();
  }

  function removeComparison(key) {
    compareKeys = compareKeys.filter((item) => item !== key);
    renderAnalyse();
    renderEvidenceDrawer();
  }

  function saveComparisonHistory() {
    if (compareKeys.length < 2) return;
    const doc = currentDocument();
    const signature = compareKeys.join('|');
    doc.comparisonHistory = (doc.comparisonHistory || []).filter((keys) => keys.join('|') !== signature);
    doc.comparisonHistory.unshift([...compareKeys]);
    doc.comparisonHistory = doc.comparisonHistory.slice(0, 5);
    touch();
  }

  function openSource(key) {
    const item = evidenceByKey(key);
    if (!item) return;
    if (item.sourceType === 'empathy') { activeTab = 'empathy'; activeProfileId = item.profileId; activeEmpathyId = item.mapId; }
    else if (item.sourceType === 'journey') { activeTab = 'journeys'; activeProfileId = item.profileId; activeJourneyId = item.journeyId; }
    else { activeTab = 'profiles'; activeProfileId = item.profileId; }
    drawerOpen = false;
    document.querySelectorAll('.section-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === activeTab));
    renderTools(); render(); syncWorkspace();
    setTimeout(() => {
      const source = document.querySelector(`[data-evidence-key="${CSS.escape(key)}"]`);
      if (source) { source.classList.add('source-flash'); source.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => source.classList.remove('source-flash'), 1400); }
    }, 20);
  }

  function openModal(kicker, title, content) {
    const modal = $('modal'); if (!modal) return;
    $('modalKicker').textContent = kicker; $('modalTitle').textContent = title; $('modalBody').innerHTML = content; modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  }
  function closeModal() { const modal=$('modal'); if (!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

  function documentsModal() {
    openModal('MY DOCUMENTS','Research documents', `<div class="modal-copy">Create separate research records, return to saved work, or duplicate a document.</div><div>${documents.map((doc) => `<div class="doc-row"><div><strong>${esc(doc.name)}</strong><small>${esc(displayDate(doc.updatedAt))}</small></div><div class="doc-actions"><button class="outline-btn" data-action="doc-open" data-id="${doc.id}">Open</button><button class="outline-btn" data-action="doc-rename" data-id="${doc.id}">Rename</button><button class="outline-btn" data-action="doc-duplicate" data-id="${doc.id}">Duplicate</button><button class="danger-btn" data-action="doc-delete" data-id="${doc.id}">Delete</button></div></div>`).join('')}</div>`);
  }

  function mapToolsModal() {
    openModal('MAP TOOLS','Manage research maps', `<div class="modal-grid"><button class="modal-action" data-action="doc-new"><strong>New document</strong><span>Start a separate research record.</span></button><button class="modal-action" data-action="doc-rename-current"><strong>Rename current</strong><span>Change the current document name.</span></button><button class="modal-action" data-action="json-export"><strong>Export JSON</strong><span>Save the current document.</span></button><button class="modal-action" data-action="json-import"><strong>Import JSON</strong><span>Restore an exported document.</span></button><button class="modal-action" data-action="print-full"><strong>Print / save PDF</strong><span>Print the complete research document.</span></button><button class="modal-action danger-btn" data-action="doc-reset"><strong>Reset current</strong><span>Reset the current research document.</span></button></div>`);
  }

  function helpModal() {
    openModal('HOW TO USE','Research Mapper', `<p><b>01 Profiles</b><br>Start with the person in relation to the interaction. Profile keys and evidence keys are generated automatically.</p><p><b>02 Empathy maps</b><br>Map Says, Thinks, Does and Feels. Each entry receives a hierarchical key such as <span class="modal-code">PR01/EM01-SA03</span>.</p><p><b>03 Journeys</b><br>Map one interaction from left to right. Start with three phases. Steps and insights receive keys such as <span class="modal-code">PR01/JN01-PH02-ST03</span>.</p><p><b>04 Analyse</b><br>Use the evidence index to bring up to four items into the main canvas. The tool does not interpret the relationship between them.</p><p>Everything is stored in this browser. Export JSON regularly when moving between devices.</p>`);
  }

  function exportJson() {
    const doc = currentDocument();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${(doc.name || 'research-map').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function importJson() { $('importInput')?.click(); }

  function printFull() {
    const doc = currentDocument(); if (!doc) return;
    const list = (items) => items.length ? items.map((item) => `<li><span class="code">${esc(item.code)}</span> ${esc(item.text)}</li>`).join('') : '<li class="muted">No entries recorded.</li>';
    const profiles = doc.profiles.map((p) => `<section><h2>${esc(p.code)} · ${esc(p.name)}</h2><p><b>Age:</b> ${esc(p.age)||'—'} &nbsp; <b>Occupation:</b> ${esc(p.occupation)||'—'}</p><h3>Context</h3><p>${esc(p.context)||'—'}</p><div class="g2"><div><h3>Needs</h3><ul>${list(p.needs)}</ul></div><div><h3>Pain points</h3><ul>${list(p.pains)}</ul></div><div><h3>Motivations</h3><ul>${list(p.motivations)}</ul></div><div><h3>Constraints</h3><ul>${list(p.constraints)}</ul></div></div></section>`).join('');
    const empathy = doc.empathyMaps.map((map) => { const profile=doc.profiles.find((p)=>p.id===map.profileId); return `<section><h2>${esc(mapDisplayCode(map))} · ${esc(map.name)}</h2><p class="muted">${esc(profile?.name||'User')}</p><div class="emap">${['says','thinks','does','feels'].map((q)=>`<div><h3>${q}</h3>${map.entries[q].map((entry)=>`<p><span class="code">${esc(empathyEntryKey(profile,map,q,entry))}</span> ${esc(entry.text)||'—'}</p>`).join('')||'<p class="muted">—</p>'}</div>`).join('')}</div></section>`; }).join('');
    const journeys = doc.journeys.map((journey) => `<section><h2>${esc(journeyDisplayCode(journey))} · ${esc(journey.name)}</h2><p><b>User:</b> ${esc(doc.profiles.find((p)=>p.id===journey.profileId)?.name||'User')}</p><p><b>Scenario:</b> ${esc(journey.scenario)||'—'}<br><b>User goal:</b> ${esc(journey.goal)||'—'}</p><table class="jt"><thead><tr>${journey.phases.map((phase)=>`<th>${esc(phaseKey(journey,phase))}<br>${esc(phase.name)}</th>`).join('')}</tr></thead><tbody><tr><th>Steps</th>${journey.phases.map((phase)=>`<td>${phase.steps.map((step)=>`<div><span class="code">${esc(journeyStepKey(journey,phase,step))}</span> ${esc(step.text)||'—'}</div>`).join('')||'—'}</td>`).join('')}</tr><tr><th>Emotion</th>${journey.phases.map((phase)=>{const e=EMOTIONS.find((v)=>v.value===phase.emotion)||EMOTIONS[2];return `<td>${e.emoji} ${e.label}</td>`}).join('')}</tr><tr><th>Insights</th>${journey.phases.map((phase)=>`<td><span class="code">${esc(journeyInsightKey(journey,phase))}</span> ${esc(phase.insight.text)||'—'}</td>`).join('')}</tr></tbody></table></section>`).join('');
    const evidence = evidenceObjects(doc).map((item)=>`<tr><td class="code">${esc(item.key)}</td><td>${esc(item.label)}</td><td>${esc(item.location)}</td><td>${esc(item.text)||'—'}</td></tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { alert('The print window was blocked. Allow pop-ups for this site and try again.'); return; }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.name)}</title><style>@page{margin:14mm}body{font-family:Arial,sans-serif;color:#111;font-size:10.5pt}h1{font-size:24pt}h2{font-size:17pt;border-bottom:2px solid #111;padding-bottom:5pt}h3{font-size:9pt;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #aaa;padding-bottom:3pt}.cover{border-top:7px solid #111;padding:10pt 0 15pt}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10pt}.emap{display:grid;grid-template-columns:1fr 1fr;border:1px solid #111}.emap>div{padding:8pt;border-right:1px solid #111;border-bottom:1px solid #111;min-height:100pt}.emap>div:nth-child(2n){border-right:0}.jt{width:100%;border-collapse:collapse}.jt th,.jt td{border:1px solid #999;padding:6pt;vertical-align:top}.jt thead th{background:#eee;text-align:left}.jt tbody>tr>th{background:#111;color:#fff;text-transform:uppercase;font-size:8pt}.code{font:8.5pt ui-monospace,monospace}.muted{color:#666}.evidence{width:100%;border-collapse:collapse}.evidence th,.evidence td{border:1px solid #aaa;padding:5pt;vertical-align:top;text-align:left}.evidence th{background:#eee;font-size:8pt;text-transform:uppercase}section{break-before:page}</style></head><body><div class="cover"><div class="muted">INTERACTION STREAM · RESEARCH MAPPER</div><h1>${esc(doc.name)}</h1><div>Interaction / task: ${esc(doc.interaction)||'—'}</div></div><section><h2>01 · Profiles</h2>${profiles}</section><section><h2>02 · Empathy maps</h2>${empathy}</section><section><h2>03 · Interaction journeys</h2>${journeys}</section><section><h2>04 · Analyse</h2><p class="muted">Analyse is an on-screen comparison workspace. No interpretations or notes are stored by the tool.</p><h3>Evidence index</h3><table class="evidence"><thead><tr><th>Key</th><th>Type</th><th>Location</th><th>Content</th></tr></thead><tbody>${evidence}</tbody></table></section></body></html>`);
    win.document.close(); setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  function newDocument() { const doc=makeDocument(); documents.push(doc); activeDocumentId=doc.id; activeProfileId=null; activeEmpathyId=null; activeJourneyId=null; compareKeys=[]; persist(); closeModal(); renderTools(); render(); }
  function renameDocument(docId = activeDocumentId) { const doc=documents.find((item)=>item.id===docId); if(!doc)return; const name=prompt('Document name',doc.name); if(name?.trim()){doc.name=name.trim();touch(); if($('docTitleDisplay'))$('docTitleDisplay').textContent=doc.name;} }
  function duplicateDocument(docId = activeDocumentId) { const original=documents.find((item)=>item.id===docId); if(!original)return; const copy=JSON.parse(JSON.stringify(original)); copy.id=uid('document'); copy.name=`${original.name} copy`; copy.createdAt=now(); copy.updatedAt=now(); documents.push(copy); activeDocumentId=copy.id; compareKeys=[]; persist(); closeModal(); renderTools(); render(); }
  function deleteDocument(docId) { if(documents.length<2){alert('Keep at least one document.');return;} if(!confirm('Delete this document?'))return; documents=documents.filter((doc)=>doc.id!==docId); if(!documents.some((doc)=>doc.id===activeDocumentId))activeDocumentId=documents[0].id; compareKeys=[]; persist(); documentsModal(); renderTools(); render(); }

  function addProfile() {
    const doc=currentDocument(); const profile=makeProfile(doc); doc.profiles.push(profile); doc.empathyMaps.push(makeEmpathyMap(doc,profile.id)); doc.journeys.push(makeJourney(doc,profile.id)); activeProfileId=profile.id; activeEmpathyId=null; activeJourneyId=null; touch(); renderTools(); render();
  }
  function deleteProfile(id) { const doc=currentDocument(); if(doc.profiles.length<2){alert('Keep at least one profile.');return;} if(!confirm('Delete this profile and its linked maps?'))return; doc.profiles=doc.profiles.filter((p)=>p.id!==id); doc.empathyMaps=doc.empathyMaps.filter((m)=>m.profileId!==id); doc.journeys=doc.journeys.filter((j)=>j.profileId!==id); activeProfileId=doc.profiles[0].id; activeEmpathyId=null; activeJourneyId=null; compareKeys=[]; touch(); renderTools(); render(); }
  function addEmpathy() { const doc=currentDocument(), profile=currentProfile(); const map=makeEmpathyMap(doc,profile.id); doc.empathyMaps.push(map); activeEmpathyId=map.id; touch(); renderTools(); render(); }
  function addJourney() { const doc=currentDocument(), profile=currentProfile(); const journey=makeJourney(doc,profile.id); doc.journeys.push(journey); activeJourneyId=journey.id; touch(); renderTools(); render(); }
  function addPhase() { const journey=currentJourney(); if(!journey)return; journey.phases.push(makePhase(currentDocument(),journey,journey.phases.length+1)); touch(); renderJourneys(); }
  function addStep(phaseIndex) { const journey=currentJourney(); if(!journey)return; const phase=journey.phases[phaseIndex]; phase.steps.push({id:uid('st'),code:localNextCode(phase.steps,'ST'),text:''}); touch(); renderJourneys(); }

  function onClick(event) {
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) { setTab(tabButton.dataset.tab); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    switch (action) {
      case 'profile-new': addProfile(); break;
      case 'profile-add': { const p=currentProfile(); p[actionButton.dataset.key].push(makeEntry(currentDocument(),'OB','')); touch(); renderProfiles(); break; }
      case 'profile-delete': { const p=currentProfile(); p[actionButton.dataset.key].splice(Number(actionButton.dataset.index),1); touch(); renderProfiles(); break; }
      case 'profile-delete-user': deleteProfile(actionButton.dataset.id); break;
      case 'empathy-new': addEmpathy(); break;
      case 'empathy-rename': { const m=currentEmpathy(); const name=prompt('Empathy map name',m.name); if(name?.trim()){m.name=name.trim();touch();renderTools();render();} break; }
      case 'empathy-add': { const m=currentEmpathy(); m.entries[actionButton.dataset.key].push(makeEntry(currentDocument(),'EM','')); touch(); renderEmpathy(); break; }
      case 'empathy-delete': { const m=currentEmpathy(); m.entries[actionButton.dataset.key].splice(Number(actionButton.dataset.index),1); touch(); renderEmpathy(); break; }
      case 'journey-new': addJourney(); break;
      case 'journey-rename': { const j=currentJourney(); const name=prompt('Journey name',j.name); if(name?.trim()){j.name=name.trim();touch();renderTools();render();} break; }
      case 'step-add': addStep(Number(actionButton.dataset.phase)); break;
      case 'step-delete': { const j=currentJourney(); j.phases[Number(actionButton.dataset.phase)].steps.splice(Number(actionButton.dataset.index),1); touch(); renderJourneys(); break; }
      case 'phase-add': addPhase(); break;
      case 'phase-delete': { const j=currentJourney(); if(j.phases.length<=3){alert('Journeys start with a minimum of three phases.');break;} j.phases.splice(Number(actionButton.dataset.index),1); touch(); renderJourneys(); break; }
      case 'analyse-clear': compareKeys=[]; renderAnalyse(); renderEvidenceDrawer(); break;
      case 'drawer-toggle': toggleDrawer(); break;
      case 'compare-add': addComparison(actionButton.dataset.key); break;
      case 'compare-remove': removeComparison(actionButton.dataset.key); break;
      case 'open-source': openSource(actionButton.dataset.key); break;
      case 'history-restore': { const h=currentDocument().comparisonHistory?.[Number(actionButton.dataset.index)] || []; compareKeys=h.filter((key)=>evidenceByKey(key)).slice(0,MAX_COMPARE); renderAnalyse(); renderEvidenceDrawer(); break; }
      case 'history-clear': currentDocument().comparisonHistory=[]; touch(); renderAnalyse(); break;
      case 'evidence-filter': evidenceFilter=actionButton.dataset.filter; document.querySelectorAll('.drawer-filters button').forEach((button)=>button.classList.toggle('active',button.dataset.filter===evidenceFilter)); renderEvidenceDrawer(); break;
      case 'documents-open': documentsModal(); break;
      case 'map-tools-open': mapToolsModal(); break;
      case 'help-open': helpModal(); break;
      case 'modal-close': closeModal(); break;
      case 'doc-open': activeDocumentId=actionButton.dataset.id; compareKeys=[]; activeProfileId=null; activeEmpathyId=null; activeJourneyId=null; persist(); closeModal(); renderTools(); render(); break;
      case 'doc-rename': renameDocument(actionButton.dataset.id); documentsModal(); break;
      case 'doc-duplicate': duplicateDocument(actionButton.dataset.id); break;
      case 'doc-delete': deleteDocument(actionButton.dataset.id); break;
      case 'doc-new': newDocument(); break;
      case 'doc-rename-current': renameDocument(); closeModal(); break;
      case 'doc-reset': { if(!confirm('Reset the current research map?'))break; const replacement=makeDocument(); documents=documents.length===1?[replacement]:documents.map((doc)=>doc.id===activeDocumentId?replacement:doc); activeDocumentId=replacement.id; compareKeys=[]; persist(); closeModal(); renderTools(); render(); break; }
      case 'json-export': exportJson(); break;
      case 'json-import': importJson(); break;
      case 'print-full': printFull(); break;
      default: break;
    }
  }

  function onInput(event) {
    const target=event.target, doc=currentDocument(); if(!doc)return;
    if(target.id==='interactionInput'){doc.interaction=target.value;touch();return;}
    const profile=currentProfile();
    if(target.id==='profileName') profile.name=target.value;
    else if(target.id==='profileAge') profile.age=target.value;
    else if(target.id==='profileOccupation') profile.occupation=target.value;
    else if(target.dataset.field==='profile-context') profile.context=target.value;
    else if(target.dataset.char){profile.chars[target.dataset.char]=Number(target.value);const value=target.parentElement.querySelector('.range-val');if(value)value.textContent=target.value;}
    else if(target.dataset.repeat){profile[target.dataset.repeat][Number(target.dataset.index)].text=target.value;}
    else if(target.dataset.empathy){const map=currentEmpathy();map.entries[target.dataset.empathy][Number(target.dataset.index)].text=target.value;}
    else if(target.id==='journeyName'){const journey=currentJourney();journey.name=target.value;}
    else if(target.dataset.field==='journey-scenario'){currentJourney().scenario=target.value;}
    else if(target.dataset.field==='journey-goal'){currentJourney().goal=target.value;}
    else if(target.dataset.phaseName){currentJourney().phases[Number(target.dataset.phaseName)].name=target.value;}
    else if(target.dataset.step){const [phaseIndex,stepIndex]=target.dataset.step.split(':').map(Number);currentJourney().phases[phaseIndex].steps[stepIndex].text=target.value;}
    else if(target.dataset.insight){currentJourney().phases[Number(target.dataset.insight)].insight.text=target.value;}
    else return;
    touch();
  }

  function onChange(event) {
    const target=event.target;
    if(target.id==='userSelect'){activeProfileId=target.value;activeEmpathyId=null;activeJourneyId=null;renderTools();render();return;}
    if(target.id==='artifactSelect'){if(activeTab==='empathy')activeEmpathyId=target.value;else activeJourneyId=target.value;renderTools();render();return;}
    if(target.dataset.emotion){const journey=currentJourney();journey.phases[Number(target.dataset.emotion)].emotion=Number(target.value);touch();renderJourneys();}
  }

  function boot() {
    load();
    const interaction=$('interactionInput'); if(interaction)interaction.addEventListener('input',onInput);
    document.addEventListener('click',onClick); document.addEventListener('input',onInput); document.addEventListener('change',onChange);
    const search=$('evidenceSearch'); if(search)search.addEventListener('input',renderEvidenceDrawer);
    $('modal')?.addEventListener('click',(event)=>{if(event.target.id==='modal')closeModal();});
    $('modalClose')?.addEventListener('click',closeModal);
    $('documentsBtn')?.addEventListener('click',()=>documentsModal());
    $('mapToolsBtn')?.addEventListener('click',()=>mapToolsModal());
    $('helpBtn')?.addEventListener('click',()=>helpModal());
    $('printBtn')?.addEventListener('click',printFull);
    $('importInput')?.addEventListener('change',(event)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);const imported=Array.isArray(parsed)?parsed:[parsed];documents=imported.map(migrateDocument);activeDocumentId=documents[0].id;activeProfileId=null;activeEmpathyId=null;activeJourneyId=null;compareKeys=[];persist();closeModal();renderTools();render();}catch(error){console.error('Import error:',error);alert('That JSON file could not be imported.')}event.target.value='';};reader.readAsText(file);});
    setTab('profiles');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
