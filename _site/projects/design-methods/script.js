const stageOrder = ['Discovery', 'Define', 'Develop', 'Deliver'];
const grid = document.getElementById('method-grid');

// Load index file to render method cards
fetch('data/methods.index.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(method => {
      const methodDiv = document.createElement('div');
      methodDiv.classList.add('method');

      // Span columns according to stages
      const first = stageOrder.indexOf(method.stages[0]) + 1;
      const last = stageOrder.indexOf(method.stages[method.stages.length - 1]) + 1;
      const span = last - first + 1;

      methodDiv.style.gridColumn = `${first} / span ${span}`;
      methodDiv.setAttribute('data-span', span);
      methodDiv.textContent = method.name;

      // Click to load full details
      methodDiv.addEventListener('click', () => {
        loadMethodDetails(method.id);
      });

      grid.appendChild(methodDiv);
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

