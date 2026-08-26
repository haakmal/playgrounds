(function () {
  const KEY = 'interaction-context-map-v1';

  function emptyProject(title) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: title || 'Untitled interaction',
      createdAt: now,
      modifiedAt: now,
      setup: { task: '', observedPerson: '', technology: '', notes: '' },
      observations: [],
      ipo: { input: [], process: [], output: [], connections: [] },
      ptc: { people: [], technology: [], context: [], connections: [] },
      review: { reflections: [] }
    };
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : { version: 1, activeId: null, projects: [] };
      return data;
    } catch (error) {
      return { version: 1, activeId: null, projects: [] };
    }
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function createProject(title) {
    const data = readAll();
    const project = emptyProject(title);
    data.projects.unshift(project);
    data.activeId = project.id;
    writeAll(data);
    return project;
  }

  function getActive() {
    const data = readAll();
    return data.projects.find(p => p.id === data.activeId) || data.projects[0] || null;
  }

  function setActive(id) {
    const data = readAll();
    if (data.projects.some(p => p.id === id)) data.activeId = id;
    writeAll(data);
  }

  function saveProject(project) {
    const data = readAll();
    project.modifiedAt = new Date().toISOString();
    const index = data.projects.findIndex(p => p.id === project.id);
    if (index === -1) data.projects.unshift(project);
    else data.projects[index] = project;
    data.activeId = project.id;
    writeAll(data);
  }

  function deleteProject(id) {
    const data = readAll();
    data.projects = data.projects.filter(p => p.id !== id);
    if (data.activeId === id) data.activeId = data.projects[0]?.id || null;
    writeAll(data);
  }

  function duplicateProject(id, title) {
    const data = readAll();
    const source = data.projects.find(p => p.id === id);
    if (!source) return null;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = crypto.randomUUID();
    copy.title = title || `${source.title} copy`;
    copy.createdAt = new Date().toISOString();
    copy.modifiedAt = copy.createdAt;
    data.projects.unshift(copy);
    data.activeId = copy.id;
    writeAll(data);
    return copy;
  }

  function importProject(project) {
    const data = readAll();
    const incoming = JSON.parse(JSON.stringify(project));
    incoming.id = crypto.randomUUID();
    incoming.modifiedAt = new Date().toISOString();
    incoming.createdAt = incoming.createdAt || incoming.modifiedAt;
    data.projects.unshift(incoming);
    data.activeId = incoming.id;
    writeAll(data);
    return incoming;
  }

  function allProjects() { return readAll().projects; }

  window.ICMStorage = { emptyProject, readAll, createProject, getActive, setActive, saveProject, deleteProject, duplicateProject, importProject, allProjects };
})();
