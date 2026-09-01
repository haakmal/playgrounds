document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => updateActiveSection(button.dataset.section));
});

document.getElementById('patternLibraryBtn').addEventListener('click', () => {
  openLibrary(processPatterns[state.behaviour]?.library || 'trigger');
});

document.getElementById('projectToolsBtn').addEventListener('click', () => {
  document.getElementById('projectToolsDialog').showModal();
});

document.getElementById('interfaceHelpBtn').addEventListener('click', () => {
  document.getElementById('interfaceHelpDialog').showModal();
});

document.getElementById('storageReportsBtn').addEventListener('click', () => {
  updateActiveSection('reports');
});

document.getElementById('exportProjectBtn').addEventListener('click', exportProject);
document.getElementById('exportProjectBtn2').addEventListener('click', exportProject);

document.querySelectorAll('#inputChoices .choice-card').forEach((button) => {
  button.addEventListener('click', () => {
    state.input = button.dataset.value;
    syncChoices();
    renderCompound();
    saveState();
  });
});

document.querySelectorAll('#outputChoices .choice-card').forEach((button) => {
  button.addEventListener('click', () => {
    state.output = button.dataset.value;
    syncChoices();
    renderCompound();
    saveState();
  });
});

document.getElementById('behaviourSelect').addEventListener('change', (event) => {
  state.behaviour = event.target.value;
  syncChoices();
  renderCompound();
  saveState();
});

document.getElementById('useInteractionBtn').addEventListener('click', () => {
  updateActiveSection('define');
});

document.querySelectorAll('[data-field]').forEach((element) => {
  element.addEventListener('input', () => fieldChanged(element));
});

document.getElementById('addResponseBtn').addEventListener('click', addResponse);
document.getElementById('addStageBtn').addEventListener('click', addStage);

document.getElementById('compoundChain').addEventListener('click', (event) => {
  const remove = event.target.dataset.remove;
  if (!remove) return;

  if (remove === 'extra') state.compound.extraOutput = null;
  if (remove === 'stage') state.compound.nextStage = null;

  saveState();
  renderCompound();
});

document.getElementById('compoundChain').addEventListener('change', (event) => {
  const key = event.target.dataset.chain;

  if (key === 'baseProcess') {
    state.behaviour = event.target.value;
    syncChoices();
  }

  if (key === 'baseOutput') {
    state.output = event.target.value;
    syncChoices();
  }

  if (key === 'extraOutput') {
    state.compound.extraOutput = event.target.value;
  }

  if (key === 'stageProcess' && state.compound.nextStage) {
    state.compound.nextStage.process = event.target.value;
  }

  if (key === 'stageOutput' && state.compound.nextStage) {
    state.compound.nextStage.output = event.target.value;
  }

  saveState();
  renderCompound();
});

document.querySelectorAll('[data-library-open]').forEach((button) => {
  button.addEventListener('click', () => {
    openLibrary(
      button.dataset.libraryOpen === 'beyond'
        ? 'beyond'
        : processPatterns[state.behaviour]?.library || 'trigger'
    );
  });
});

document.querySelectorAll('[data-library-entry]').forEach((button) => {
  button.addEventListener('click', () => openLibrary(button.dataset.libraryEntry));
});

document.querySelectorAll('[data-resource]').forEach((button) => {
  button.addEventListener('click', () => openResource(button.dataset.resource));
});

document.getElementById('libraryNav').addEventListener('click', (event) => {
  const id = event.target.dataset.libraryId;
  if (!id) return;

  libraryActive = id;
  renderLibrary();
});

document.querySelectorAll('.help-button').forEach((button) => {
  button.addEventListener('click', () => openHelp(button.dataset.helpSection));
});

document.getElementById('complexitySnapshotBtn').addEventListener('click', () => {
  document.getElementById('complexityDialog').close();
  openHelp('define');
  document.getElementById('helpDescription').value =
    'My interaction has reached the complexity limit in the companion. I want advice before adding more inputs, outputs, conditions or stages.';
});

document.getElementById('createReportBtn').addEventListener('click', () => {
  createReport(`${sectionNames[activeSection]} checkpoint`, activeSection);
  toast('Report snapshot saved');
});

document.getElementById('exportReportsBtn').addEventListener('click', exportAllReports);

document.getElementById('reportsList').addEventListener('click', (event) => {
  const viewId = event.target.dataset.viewReport;
  if (viewId) {
    const report = state.reports.find((item) => item.id === viewId);
    if (report) viewReport(report);
    return;
  }

  const exportId = event.target.dataset.exportReport;
  if (exportId) exportReport(exportId);
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.closeDialog).close();
  });
});

['projectToolsDialog', 'resourceDialog', 'patternLibraryDialog', 'complexityDialog', 'interfaceHelpDialog'].forEach((id) => {
  document.getElementById(id).addEventListener('click', (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
});

document.getElementById('helpForm').addEventListener('submit', (event) => {
  if (event.submitter?.id === 'generateHelpBtn') {
    event.preventDefault();
    createHelpReport();
  }
});

document.getElementById('renameProjectBtn').addEventListener('click', () => openProjectName('rename'));
document.getElementById('newProjectBtn').addEventListener('click', () => openProjectName('new'));
document.getElementById('resetProjectBtn').addEventListener('click', handleReset);

document.getElementById('importProjectBtn').addEventListener('click', () => {
  document.getElementById('importProjectFile').click();
});

document.getElementById('importProjectFile').addEventListener('change', (event) => {
  if (event.target.files[0]) importProject(event.target.files[0]);
});

document.getElementById('projectNameForm').addEventListener('submit', (event) => {
  if (event.submitter?.id === 'projectNameConfirm') {
    event.preventDefault();
    confirmProjectName();
  }
});

populateFields();
renderHeader();
applySection(activeSection);
