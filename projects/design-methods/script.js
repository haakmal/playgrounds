const stageOrder = ['Discovery', 'Define', 'Develop', 'Deliver'];

const methodEntries = [];
const methodData = new Map();

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
      methodDiv.dataset.id = method.id;

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

      methodDiv.dataset.originalOrder = methodEntries.length;
      
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

    const indexData = await response.json();

    renderMethods(indexData);

    // Load the complete record for every method so search
    // can consider description, whenToUse, steps, etc.
    const methodRecords = await Promise.all(
      indexData.map(async method => {
        try {
          const recordResponse = await fetch(
            `data/methods/${encodeURIComponent(method.id)}.json`,
            { cache: 'no-store' }
          );

          if (!recordResponse.ok) {
            throw new Error(`HTTP ${recordResponse.status}`);
          }

          const record = await recordResponse.json();

          methodData.set(method.id, {
            ...method,
            ...record
          });
        } catch (error) {
          console.warn(
            `Could not load method record: ${method.id}`,
            error
          );

          // Keep the index record available even if the
          // detailed record cannot be loaded.
          methodData.set(method.id, method);
        }
      })
    );

    await Promise.all(methodRecords);

  } catch (error) {
    console.error(error);
    grid.innerHTML =
      '<p style="padding:1rem">The method library could not be loaded.</p>';
  }
}
/*
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
*/
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

function getWords(text = '') {
  return String(text)
    .toLowerCase()
    .match(/\b[\p{L}\p{N}'-]+\b/gu) || [];
}

function hasExactWord(text, query) {
  return getWords(text).includes(query);
}

function fuzzyMatch(needle, haystack) {
  if (!needle) return false;

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

function scoreMethod(method, query) {
  if (!query) return 0;

  const normalizedQuery = query.toLowerCase();

  let score = 0;

  /*
   * METHOD NAME
   * Highest priority.
   */

  if (hasExactWord(method.name, normalizedQuery)) {
    score += 100;
  } else if (
    method.name.toLowerCase().includes(normalizedQuery)
  ) {
    score += 70;
  } else if (
    fuzzyMatch(
      normalizedQuery,
      method.name.toLowerCase()
    )
  ) {
    score += 40;
  }


  /*
   * DESCRIPTION
   */

  if (
    hasExactWord(
      method.description,
      normalizedQuery
    )
  ) {
    score += 30;
  }


  /*
   * WHEN TO USE
   */

  if (
    hasExactWord(
      method.whenToUse,
      normalizedQuery
    )
  ) {
    score += 20;
  }


  /*
   * LOOK OUT FOR
   */

  if (
    Array.isArray(method.lookOutFor) &&
    method.lookOutFor.some(item =>
      hasExactWord(item, normalizedQuery)
    )
  ) {
    score += 15;
  }


  /*
   * PROCESS STEPS
   */

  if (
    Array.isArray(method.steps) &&
    method.steps.some(step =>
      hasExactWord(step, normalizedQuery)
    )
  ) {
    score += 10;
  }


  return score;
}

function filterMethods() {
  const query = searchInput.value
    .trim()
    .toLowerCase();

  /*
   * No search term:
   * restore normal ordering and visibility.
   */

  if (!query) {
    methodEntries.forEach(methodDiv => {
      methodDiv.style.display = '';
    });

    return;
  }


  /*
   * Score every visible method.
   */

  const rankedMethods = methodEntries
    .map(methodDiv => {
      const method = methodData.get(
        methodDiv.dataset.id
      );

      if (!method) {
        return {
          element: methodDiv,
          score: 0
        };
      }

      return {
        element: methodDiv,
        score: scoreMethod(method, query)
      };
    })
    .sort((a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return (
    Number(a.element.dataset.originalOrder) -
    Number(b.element.dataset.originalOrder)
  );
});


  /*
   * Apply ranking and visibility.
   */

  rankedMethods.forEach(result => {
    result.element.style.display =
      result.score > 0 ? '' : 'none';

    if (result.score > 0) {
      grid.appendChild(result.element);
    }
  });
}
/* ------ old setuup for search, not used anymore

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
*/
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