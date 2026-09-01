let state = loadState();
let activeSection = state.activeSection || 'explore';
let pendingProjectAction = null;
let currentHelpSection = 'explore';
let libraryActive = 'trigger';

function defaultState(title = 'Untitled interaction') {
  return {
    version: 6,
    title,
    activeSection: 'explore',
    input: 'Touch',
    output: 'Light',
    behaviour: 'Trigger',
    compound: {
      extraOutput: null,
      nextStage: null
    },
    explore: { notes: '' },
    define: {
      intent: '',
      response: '',
      why: '',
      notes: ''
    },
    make: {
      changes: '',
      problems: ''
    },
    test: {
      expected: '',
      observed: '',
      actual: '',
      surprise: '',
      change: '',
      notes: ''
    },
    reflect: {
      discovery: '',
      thinking: '',
      importance: '',
      next: '',
      notes: ''
    },
    reports: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw);
    const base = defaultState(parsed.title || 'Untitled interaction');
    const compound = { ...base.compound, ...parsed.compound };

    if (compound.extraOutput === '') {
      compound.extraOutput = null;
    }

    return {
      ...base,
      ...parsed,
      compound,
      explore: { ...base.explore, ...parsed.explore },
      define: { ...base.define, ...parsed.define },
      make: { ...base.make, ...parsed.make },
      test: { ...base.test, ...parsed.test },
      reflect: { ...base.reflect, ...parsed.reflect },
      reports: Array.isArray(parsed.reports) ? parsed.reports : []
    };
  } catch (error) {
    return defaultState();
  }
}

function saveState() {
  state.activeSection = activeSection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const saveLabel = document.getElementById('saveState');
  if (saveLabel) {
    saveLabel.textContent = `Saved locally · ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  renderHeader();
}

function renderHeader() {
  const title = document.getElementById('projectTitle');
  const reportTitle = document.getElementById('reportProjectTitle');
  const reportSummary = document.getElementById('reportSummary');

  if (title) title.textContent = state.title;
  if (reportTitle) reportTitle.textContent = state.title;

  const count = state.reports.length;
  if (reportSummary) {
    reportSummary.textContent = count
      ? `${count} report snapshot${count === 1 ? '' : 's'} saved in this project.`
      : 'No report snapshots yet.';
  }
}
