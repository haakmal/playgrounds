function updateActiveSection(section) {
  if (section === activeSection) return;

  activeSection = section;
  applySection(section);
  saveState();
}

function applySection(section) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.section === section);
  });

  document.querySelectorAll('.section-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === section);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
