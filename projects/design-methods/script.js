fetch('methods.json')
	.then(res => res.json())
	.then(data => {
		data.forEach(method => {
			method.stages.forEach(stage => {
				const container = document.getElementById(stage);
				if (container) {
					methodDiv.classList.add('method');
					methodDiv.textContent = method.name;
					methodDiv.addEventListener('click', () => showModal(method));
					container.appendChild(methodDiv);
				}
			});
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

document.getElementById('close-btn').addEventListener('click', () => {
	document.getElementById('modal').classList.add('hidden');
});