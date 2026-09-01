function openHelp(section) {
  currentHelpSection = section;
  document.getElementById('helpSection').value = section;
  document.getElementById('helpDescription').value = '';
  document.getElementById('helpAudience').value = 'Technical support';
  document.getElementById('helpDialog').showModal();
}

function createHelpReport() {
  const audience = document.getElementById('helpAudience').value;
  const description = document.getElementById('helpDescription').value.trim();
  const report = createReport(
    `Support checkpoint — ${sectionNames[currentHelpSection]}`,
    currentHelpSection
  );

  report.support = {
    audience,
    description
  };

  state.reports[0] = report;
  saveState();
  renderReports();

  document.getElementById('helpDialog').close();
  activeSection = 'reports';
  applySection('reports');
  saveState();
  toast('Support snapshot saved — share it with your tutor or technical support');
}

function openProjectName(mode) {
  pendingProjectAction = mode;
  document.getElementById('projectNameHeading').textContent = mode === 'new'
    ? 'Name new project'
    : mode === 'rename'
      ? 'Rename project'
      : 'Name project';
  document.getElementById('projectNameInput').value = mode === 'new'
    ? 'Untitled interaction'
    : state.title;
  document.getElementById('projectNameDialog').showModal();

  setTimeout(() => document.getElementById('projectNameInput').select(), 50);
}

function confirmProjectName() {
  const title = document.getElementById('projectNameInput').value.trim() || 'Untitled interaction';

  if (pendingProjectAction === 'rename') {
    state.title = title;
    saveState();
    renderHeader();
    document.getElementById('projectNameDialog').close();
    return;
  }

  state = defaultState(title);
  activeSection = 'explore';
  saveState();
  populateFields();
  renderHeader();
  applySection('explore');
  document.getElementById('projectNameDialog').close();
  document.getElementById('projectToolsDialog').close();
}

function handleReset() {
  const confirmed = confirm(
    'Reset the current project? This will clear its current work and report history. Export the project first if you need a copy.'
  );
  if (!confirmed) return;

  const title = state.title;
  state = defaultState(title);
  activeSection = 'explore';
  saveState();
  populateFields();
  renderHeader();
  applySection('explore');
  document.getElementById('projectToolsDialog').close();
}

function exportProject() {
  const payload = JSON.stringify({ ...state, exportedAt: stamp() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const anchor = document.createElement('a');

  anchor.href = URL.createObjectURL(blob);
  anchor.download = (state.title || 'interactive-prototype')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() + '.json';
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(anchor.href), 500);
}

function importProject(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const base = defaultState(parsed.title || 'Imported interaction');

      state = {
        ...base,
        ...parsed,
        compound: { ...base.compound, ...parsed.compound }
      };
      activeSection = state.activeSection || 'explore';

      saveState();
      populateFields();
      renderHeader();
      applySection(activeSection);
      document.getElementById('projectToolsDialog').close();
    } catch (error) {
      alert('That file could not be imported as a project.');
    }
  };

  reader.readAsText(file);
}
