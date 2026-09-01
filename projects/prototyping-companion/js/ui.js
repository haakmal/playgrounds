function syncChoices() {
  document.querySelectorAll('#inputChoices .choice-card').forEach((button) => {
    button.classList.toggle('selected', button.dataset.value === state.input);
  });

  document.querySelectorAll('#outputChoices .choice-card').forEach((button) => {
    button.classList.toggle('selected', button.dataset.value === state.output);
  });

  const exploreInput = document.getElementById('exploreInput');
  const exploreOutput = document.getElementById('exploreOutput');
  const defineInput = document.getElementById('defineInput');
  const defineOutput = document.getElementById('defineOutput');

  if (exploreInput) exploreInput.textContent = state.input || 'Choose an input';
  if (exploreOutput) exploreOutput.textContent = state.output || 'Choose an output';
  if (defineInput) defineInput.textContent = state.input || 'Choose an input';
  if (defineOutput) defineOutput.textContent = state.output || 'Choose an output';

  const processSelect = document.getElementById('behaviourSelect');
  if (processSelect) processSelect.value = state.behaviour;

  const pattern = processPatterns[state.behaviour];
  if (pattern) {
    const processHint = document.getElementById('processHint');
    if (processHint) processHint.textContent = pattern.hint || '';
  }

  const inputEntry = libraryEntries.find(
    (entry) => entry.group === 'SENSE' && (entry.ipo || '').includes(`· ${state.input}`)
  );
  const outputEntry =
    libraryEntries.find(
      (entry) => entry.group === 'RESPOND' && (entry.ipo || '').includes(`· ${state.output}`)
    ) || libraryEntries.find(
      (entry) => entry.group === 'RESPOND' && entry.title === state.output
    );

  const inputTitle = document.getElementById('exploreInputLearnTitle');
  const inputText = document.getElementById('exploreInputLearnText');
  const inputButton = document.getElementById('exploreInputLearnBtn');

  if (inputTitle) {
    const entry = inputEntry || libraryEntries.find((item) => item.id === 'touch');
    inputTitle.textContent = `Learn more about ${String(state.input || 'this input').toLowerCase()}`;
    inputText.textContent = entry
      ? entry.lead
      : 'Explore how this input can be used in an interaction.';
    inputButton.dataset.libraryEntry = entry ? entry.id : 'touch';
  }

  const outputTitle = document.getElementById('exploreOutputLearnTitle');
  const outputText = document.getElementById('exploreOutputLearnText');
  const outputButton = document.getElementById('exploreOutputLearnBtn');

  if (outputTitle) {
    const entry = outputEntry || libraryEntries.find((item) => item.id === 'light-output');
    outputTitle.textContent = `Learn more about ${String(state.output || 'this output').toLowerCase()}`;
    outputText.textContent = entry
      ? entry.lead
      : 'Explore how this output can communicate feedback.';
    outputButton.dataset.libraryEntry = entry ? entry.id : 'light-output';
  }

  const processTitle = document.getElementById('defineProcessLearnTitle');
  const processText = document.getElementById('defineProcessLearnText');
  const processButton = document.getElementById('defineProcessLearnBtn');

  if (processTitle && pattern) {
    processTitle.textContent = `Learn more about ${state.behaviour.toLowerCase()}`;
    processText.textContent = pattern.hint || pattern.summary;
    processButton.dataset.libraryEntry = pattern.library;
  }
}

function populateFields() {
  document.querySelectorAll('[data-field]').forEach((element) => {
    const [group, key] = element.dataset.field.split('.');
    if (state[group] && state[group][key] !== undefined) {
      element.value = state[group][key];
    }
  });

  syncChoices();
  renderCompound();
  renderRecipeDetail();
  renderReports();
}

function fieldChanged(element) {
  const [group, key] = element.dataset.field.split('.');
  state[group][key] = element.value;
  saveState();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function nl2br(value) {
  return escapeHtml(value || '').replace(/\n/g, '<br>');
}

function stamp() {
  return new Date().toISOString();
}

function prettyDate(value) {
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toast(message) {
  const element = document.getElementById('toast');
  if (!element) return;

  element.textContent = message;
  element.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}
