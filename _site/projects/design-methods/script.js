fetch('methods.json')
  .then(res => res.json())
  .then(data => {
    const stageOrder = ['Discovery', 'Define', 'Develop', 'Deliver'];
    const grid = document.getElementById('method-grid');

    data.forEach(method => {
      const methodDiv = document.createElement('div');
      methodDiv.classList.add('method');

      // Determine starting column and span
      const stages = method.stages;
      const first = stageOrder.indexOf(stages[0]) + 1;
      const last = stageOrder.indexOf(stages[stages.length - 1]) + 1;
      const span = last - first + 1;

      methodDiv.style.gridColumn = `${first} / span ${span}`;
      methodDiv.setAttribute('data-span', span);
      methodDiv.textContent = method.name;
      methodDiv.addEventListener('click', () => showModal(method));
      grid.appendChild(methodDiv);
    });
  });

function showModal(method) {
  document.getElementById('method-title').textContent = method.name;
  document.getElementById('method-description').textContent = method.description || '';
  // Placeholder for future fields like steps/examples
  document.getElementById('method-details').innerHTML = method.steps 
    ? `<h4>Steps</h4><ul>${method.steps.map(s => `<li>${s}</li>`).join('')}</ul>`
    : '';
  document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id == 'modal') {
    document.getElementById('modal').classList.add('hidden');
  }
});

document.getElementById('close-btn').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});
