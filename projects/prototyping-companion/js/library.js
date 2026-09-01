function openLibrary(entry = 'trigger') {
  libraryActive = entry;
  renderLibrary();

  const dialog = document.getElementById('patternLibraryDialog');
  if (!dialog.open) dialog.showModal();
}

function renderLibrary() {
  const groups = ['SENSE', 'PROCESS', 'RESPOND', 'EXTEND'];

  document.getElementById('libraryNav').innerHTML = groups
    .map((group) => `
      <div class="library-group">
        <div class="eyebrow">${group}</div>
        ${libraryEntries
          .filter((entry) => entry.group === group)
          .map((entry) => `
            <button
              class="library-nav-item ${entry.id === libraryActive ? 'active' : ''}"
              data-library-id="${entry.id}"
              type="button"
            >
              ${escapeHtml(entry.title)}
            </button>
          `)
          .join('')}
      </div>
    `)
    .join('');

  const entry = libraryEntries.find((item) => item.id === libraryActive) || libraryEntries[0];

  document.getElementById('libraryContent').innerHTML = `
    <div class="eyebrow">${entry.group}</div>
    <h2>${escapeHtml(entry.title)}</h2>
    <p class="library-lead">${escapeHtml(entry.lead)}</p>

    <section>
      <h3>What it means</h3>
      <p>${escapeHtml(entry.body)}</p>
    </section>

    <section class="library-ipo">
      <h3>IPO connection</h3>
      <strong>${escapeHtml(entry.ipo)}</strong>
    </section>

    <section>
      <h3>On Circuit Playground</h3>
      <p>${escapeHtml(entry.cpx)}</p>
    </section>

    <section>
      <h3>References and next steps</h3>
      ${entry.links
        .map(
          (link) => `
            <a class="resource-link" href="${link[1]}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(link[0])} ↗
            </a>
          `
        )
        .join('')}
    </section>
  `;
}

function openResource(key) {
  const map = {
    systems: 'trigger',
    states: 'state',
    debugging: 'beyond',
    inputs: 'touch'
  };

  openLibrary(map[key] || key || 'trigger');
}
