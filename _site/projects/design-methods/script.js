const stageOrder = ['Discovery', 'Define', 'Develop', 'Deliver'];
const grid = document.getElementById('method-grid');

// Load index file to render method cards
fetch('data/methods.index.json')
  .then(res => res.json())
  .then(data => {
    // Sort method alphabetically by name
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    // console.log('Sorted methods:', data.map(m => m.name));
    data.forEach(method => {
      const methodDiv = document.createElement('div');
      methodDiv.classList.add('method');
      methodDiv.setAttribute('data-stages', method.stages.join(','));

      const first = stageOrder.indexOf(method.stages[0]);
      const last = stageOrder.indexOf(method.stages[method.stages.length - 1]);
      const span = last - first + 1;

      methodDiv.style.gridColumn = `${first + 1} / span ${span}`;

      // Add phase segments inside method box
      for (let i = first; i <= last; i++) {
        const phase = stageOrder[i];
        const segment = document.createElement('div');
        segment.classList.add('phase-segment');

        if (method.stages.includes(phase)) {
          segment.classList.add('solid');
        } else {
          segment.classList.add('dashed');
        }

        // Attach label in first used phase
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

      grid.appendChild(methodDiv)
    });
  });

// Load full method details for modal view
function loadMethodDetails(id) {
  fetch(`data/methods/${id}.json`)
    .then(res => res.json())
    .then(method => {
      showModal(method);
    })
    .catch(err => {
      console.error('Failed to load method:', id, err);
    });
}

// Populate modal with method details
function showModal(method) {
  document.getElementById('method-title').textContent = method.name;
  document.getElementById('method-description').textContent = method.description || '';

  let stepsHtml = '';
  if (method.steps && method.steps.length) {
    stepsHtml = '<h4>Step-by-Step Guide</h4><ul>';
    method.steps.forEach(step => {
      stepsHtml += `<li>${step}</li>`;
    });
    stepsHtml += '</ul>';
  }

  let resourcesHtml = '';
  if (method.resources && method.resources.length) {
    resourcesHtml = '<h4>Resources</h4><ul>';
    method.resources.forEach(res => {
      const icon = res.type === 'download' ? '📥' : '🔗';
      resourcesHtml += `<li>${icon} <a href="${res.url}" target="_blank" rel="noopener">${res.title}</a></li>`;
    });
    resourcesHtml += '</ul>';
  }

  document.getElementById('method-details').innerHTML = stepsHtml + resourcesHtml;
  document.getElementById('modal').classList.remove('hidden');
}

// Close modal
document.getElementById('close-btn').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});

// Optional: close modal on click outside content
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') {
    document.getElementById('modal').classList.add('hidden');
  }
});

// Get all phase checkboxes inside .filters
const phaseCheckboxes = document.querySelectorAll('.filters input[type="checkbox"]');

phaseCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', updatePhaseFilter);
});

function updatePhaseFilter() {
  const activePhases = Array.from(phaseCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  //console.log('Active phases:', activePhases);

  const noFilter = activePhases.length === 0;

  document.querySelectorAll('.method').forEach(methodDiv => {
    const methodStages = methodDiv.getAttribute('data-stages')?.split(',') || [];

    const matches = noFilter || methodStages.some(stage => activePhases.includes(stage));
    methodDiv.classList.toggle('disabled', !matches);
  });
}

// Search function 
document.getElementById('search').addEventListener('input', function (e) {
  const query = e.target.value.toLowerCase();

  document.querySelectorAll('.method').forEach(methodDiv => {
    const name = methodDiv.textContent.toLowerCase();
    const match = fuzzyMatch(query, name);
    methodDiv.style.display = match ? '' : 'none';
  });
});

function fuzzyMatch(needle, haystack) {
  if (!needle) return true;
let hIndex = 0;
  for (let i = 0; i < needle.length; i++) {
    const nChar = needle[i];
    hIndex = haystack.indexOf(nChar, hIndex);
    if (hIndex === -1) return false;
  hIndex++;
  }
  return true;
}

// Help modal
const helpModal = document.getElementById('help-modal');
const helpBtn = document.getElementById('help-btn');
const helpCloseBtn = document.getElementById('help-close-btn');

helpBtn.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

helpCloseBtn.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
  if (e.target.id === 'help-modal') {
    helpModal.classList.add('hidden');
  }
});

