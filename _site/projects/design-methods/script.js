const stageOrder = ['Discovery', 'Define', 'Develop', 'Deliver'];

const grid = document.getElementById('method-grid');
const modal = document.getElementById('modal');

// Prefer the actual close button element.
// Keep #close-btn as a fallback for compatibility with the existing markup.
const closeBtn =
  modal?.querySelector('.close-button') ||
  document.getElementById('close-btn');

const helpModal = document.getElementById('help-modal');
const helpBtn = document.getElementById('help-btn');

const helpCloseBtn =
  helpModal?.querySelector('.close-button') ||
  document.getElementById('help-close-btn');

const searchInput = document.getElementById('search');
const phaseCheckboxes = document.querySelectorAll(
  '.filters input[type="checkbox"]'
);

const methodEntries = [];

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

  // Protect simple line breaks before applying inline formatting.
  text = text.replace(/\r?\n/g, '<br>');

  // Bold, italic, and underline are deliberately limited to this small syntax.
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\[u\](.+?)\[\/u\]/g, '<u>$1</u>');

  return text;
}

function openModal(target) {
  if (!target) return;

  target.classList.remove('hidden');

  requestAnimationFrame(() => {
    target.classList.add('active');
  });
}

function closeModal(target) {
  if (!target) return;

  target.classList.remove('active');

  const finish = event => {
    if (event.target !== target) return;
    if (event.propertyName !== 'opacity') return;

    target.classList.add('hidden');
    target.removeEventListener('transitionend', finish);
  };

  target.addEventListener('transitionend', finish);

  // Safety fallback in case the transition is disabled or not fired.
  window.setTimeout(() => {
    if (!target.classList.contains('active')) {
      target.classList.add('hidden');
      target.removeEventListener('transitionend', finish);
    }
  }, 300);
}

function renderMethods(data) {
  grid.innerHTML = '';
  methodEntries.length = 0;

  [...data]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(method => {
      const methodDiv = document.createElement('div');

      methodDiv.classList.add('method');

      methodDiv.dataset.stages = (method.stages || []).join(',');
      methodDiv.dataset.name = method.name || '';

      const first = stageOrder.indexOf(method.stages?.[0]);
      const last = stageOrder.indexOf(
        method.stages?.[method.stages.length - 1]
      );

      if (first < 0 || last < 0 || last < first) return;

      methodDiv.style.gridColumn =
        `${first + 1} / span ${last - first + 1}`;

      for (let i = first; i <= last; i += 1) {
        const phase = stageOrder[i];

        const segment = document.createElement('div');

        segment.classList.add(
          'phase-segment',
          method.stages.includes(phase) ? 'solid' : 'dashed'
        );

        if (i === first) {
          const label = document.createElement('span');

          label.classList.add('method-label');
          label.textContent = method.name;

          segment.appendChild(label);
        }

        methodDiv.appendChild(segment);
      }

      methodDiv.addEventListener('click', () => {
        if (!methodDiv.classList.contains('disabled')) {
          loadMethodDetails(method.id);
        }
      });

      grid.appendChild(methodDiv);
      methodEntries.push(methodDiv);
    });
}

async function loadIndex() {
  try {
    const response = await fetch('data/methods.index.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    renderMethods(await response.json());
  } catch (error) {
    console.error(error);

    grid.innerHTML =
      '<p style="padding:1rem">The method library could not be loaded.</p>';
  }
}

async function loadMethodDetails(id) {
  try {
    const response = await fetch(
      `data/methods/${encodeURIComponent(id)}.json`,
      {
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showModal(await response.json());
  } catch (error) {
    console.error('Failed to load method:', id, error);

    document.getElementById('method-title').textContent =
      'Method unavailable';

    document.getElementById('method-description').textContent =
      `The record "${id}" could not be loaded.`;

    document.getElementById('method-details').innerHTML = '';

    openModal(modal);
  }
}

function showModal(method) {
  document.getElementById('method-title').textContent =
    method.name || '';

  document.getElementById('method-description').innerHTML =
    formatInline(method.description || '');

  let whenToUseHtml = '';
  if (method.whenToUse) {
    whenToUseHtml = `
      <section class="method-intro-section">
        <h4>When to Use</h4>
        <div class="when-to-use">${formatInline(method.whenToUse)}</div>
      </section>
    `;
  }

  let stepsHtml = '';
  if (Array.isArray(method.steps) && method.steps.length) {
    stepsHtml = `
      <section class="method-process-section">
        <h4>Step-by-Step Guide</h4>
        <ol>
          ${method.steps
            .map(step => `<li>${formatInline(step)}</li>`)
            .join('')}
        </ol>
      </section>
    `;
  }

  let lookOutHtml = '';
  if (Array.isArray(method.lookOutFor) && method.lookOutFor.length) {
    lookOutHtml = `
      <section class="method-lookout-section">
        <h4>Look Out For</h4>
        <ul class="look-out-list">
          ${method.lookOutFor
            .map(item => `<li>${formatInline(item)}</li>`)
            .join('')}
        </ul>
      </section>
    `;
  }

  let resourcesHtml = '';
  if (Array.isArray(method.resources) && method.resources.length) {
    resourcesHtml = `
      <section class="method-resources-section">
        <h4>Further Material</h4>
        <ul>
          ${method.resources
            .map(resource => {
              if (resource.type === 'reference') {
                return `<li class="resource-reference">${formatInline(resource.citation || '')}</li>`;
              }

              const icon = resource.type === 'download' ? '↓' : '↗';
              const target = resource.url || '';
              const title = resource.title || target;

              return `
                <li>
                  ${icon} 
                  <a
                    href="${escapeHtml(target)}"
                    target="_blank"
                    rel="noopener"
                  >${formatInline(title)}</a>
                </li>
              `;
            })
            .join('')}
        </ul>
      </section>
    `;
  }

  document.getElementById('method-details').innerHTML =
    whenToUseHtml + stepsHtml + lookOutHtml + resourcesHtml;

  openModal(modal);
}

function updatePhaseFilter() {
  const activePhases = Array.from(phaseCheckboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  const noFilter = activePhases.length === 0;

  methodEntries.forEach(methodDiv => {
    const methodStages =
      methodDiv.dataset.stages
        ?.split(',')
        .filter(Boolean) || [];

    const matches =
      noFilter ||
      methodStages.some(stage =>
        activePhases.includes(stage)
      );

    methodDiv.classList.toggle(
      'disabled',
      !matches
    );
  });
}

function fuzzyMatch(needle, haystack) {
  if (!needle) return true;

  let hIndex = 0;

  for (const character of needle) {
    hIndex = haystack.indexOf(character, hIndex);

    if (hIndex === -1) {
      return false;
    }

    hIndex += 1;
  }

  return true;
}

function filterMethods() {
  const query =
    searchInput.value.trim().toLowerCase();

  methodEntries.forEach(methodDiv => {
    const name =
      methodDiv.dataset.name.toLowerCase();

    methodDiv.style.display =
      fuzzyMatch(query, name)
        ? ''
        : 'none';
  });
}

/* --------------------------------------------------
   Method modal controls
-------------------------------------------------- */

if (closeBtn && modal) {
  closeBtn.addEventListener('click', () => {
    closeModal(modal);
  });

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}

/* --------------------------------------------------
   Filters and search
-------------------------------------------------- */

phaseCheckboxes.forEach(checkbox => {
  checkbox.addEventListener(
    'change',
    updatePhaseFilter
  );
});

if (searchInput) {
  searchInput.addEventListener(
    'input',
    filterMethods
  );
}

/* --------------------------------------------------
   Help modal controls
-------------------------------------------------- */

if (helpBtn && helpModal) {
  helpBtn.addEventListener('click', () => {
    openModal(helpModal);
  });
}

if (helpCloseBtn && helpModal) {
  helpCloseBtn.addEventListener('click', () => {
    closeModal(helpModal);
  });

  helpModal.addEventListener('click', event => {
    if (event.target === helpModal) {
      closeModal(helpModal);
    }
  });
}

/* --------------------------------------------------
   Escape key
-------------------------------------------------- */

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (modal?.classList.contains('active')) {
    closeModal(modal);
  }

  if (helpModal?.classList.contains('active')) {
    closeModal(helpModal);
  }
});

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

loadIndex();