(function () {
  function downloadJson(project) {
    const clean = JSON.parse(JSON.stringify(project));
    const blob = new Blob([JSON.stringify({ app: 'Interaction Context Map', version: 1, project: clean }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = (project.title || 'interaction-context-map').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'interaction-context-map';
    a.href = url;
    a.download = `${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function validateImport(payload) {
    if (!payload || payload.app !== 'Interaction Context Map' || !payload.project) throw new Error('This file is not a valid Interaction Context Map session.');
    const p = payload.project;
    if (!p.title || !Array.isArray(p.observations) || !p.ipo || !p.ptc) throw new Error('The session file appears incomplete.');
    return p;
  }

  window.ICMExport = { downloadJson, validateImport };
})();
