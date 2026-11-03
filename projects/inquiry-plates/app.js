/* Inquiry Plates / v2. No accounts, storage, analytics, or user-data collection.
   The authored data remains separate; this file only presents and annotates it. */
(() => {
  'use strict';
  const bank = window.PROVOCATIONS;
  const roles = ['focus', 'action', 'opening'];
  const modeButtons = [...document.querySelectorAll('.mode-button')];
  const introduction = document.getElementById('introduction');
  const examination = document.getElementById('examination');
  const stage = document.getElementById('plate-body');
  const statement = document.getElementById('statement');
  const svg = document.getElementById('connectors');
  const svgNS = 'http://www.w3.org/2000/svg';
  const queues = {discovery: [], concept: []};
  const previous = {discovery: null, concept: null};
  const deeper = {
    discovery: {
      focus: ['Which part of your own scenario might you be taking for granted?', 'Whose experience could complicate your current understanding?'],
      action: ['How might this become an invitation rather than a request for an answer?', 'What could the participant choose, change or interpret for themselves?'],
      opening: ['What response might you not anticipate?', 'What would an unexpected interpretation prompt you to reconsider?']
    },
    concept: {
      focus: ['Which assumption must be true for your emerging idea to make sense?', 'What aspect of the context have you not yet examined?'],
      action: ['How could this be explored without presenting your finished design?', 'What could the participant adapt or challenge in the activity?'],
      opening: ['What might contradict the conceptual model you currently hold?', 'How could a different response alter what you prototype next?']
    }
  };
  let mode = 'discovery';
  let current = null;
  let expanded = null;
  let frame = 0;

  const safeArray = value => Array.isArray(value) && value.length > 0;
  function validBank() {
    return bank && safeArray(bank.discovery) && safeArray(bank.concept);
  }
  function shuffled(count, excluded) {
    const items = Array.from({length: count}, (_, i) => i);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    if (items.length > 1 && items[0] === excluded) {
      const j = items.findIndex(i => i !== excluded);
      [items[0], items[j]] = [items[j], items[0]];
    }
    return items;
  }
  function renderParts(source) {
    const fragment = document.createDocumentFragment();
    const rx = /\{(focus|action|opening)\|([^{}]+)\}/g;
    let offset = 0;
    let match;
    const seen = [];
    while ((match = rx.exec(source)) !== null) {
      fragment.append(document.createTextNode(source.slice(offset, match.index)));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'phrase';
      button.dataset.role = match[1];
      button.textContent = match[2];
      button.setAttribute('aria-label', `${match[2]} — examine ${match[1] === 'focus' ? 'Look at' : match[1] === 'action' ? 'Invite' : 'Question'}`);
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => toggle(match[1]));
      fragment.append(button);
      seen.push(match[1]);
      offset = rx.lastIndex;
    }
    fragment.append(document.createTextNode(source.slice(offset)));
    if (roles.some(role => seen.filter(item => item === role).length !== 1)) {
      console.warn('Each statement needs exactly one phrase per anatomy role:', source);
    }
    return fragment;
  }
  function fillNote(role) {
    document.getElementById(`${role}-label`).textContent = current[role][0];
    const list = document.getElementById(`${role}-queries`);
    const questions = [current[role][1], ...deeper[mode][role]];
    list.replaceChildren(...questions.map(question => {
      const li = document.createElement('li');
      li.textContent = question;
      return li;
    }));
  }
  function closeAll() {
    expanded = null;
    roles.forEach(role => {
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      note.classList.remove('is-open');
      const trigger = note.querySelector('.note-trigger');
      trigger.setAttribute('aria-expanded', 'false');
      document.getElementById(`detail-${role}`).hidden = true;
      const phrase = statement.querySelector(`.phrase[data-role="${role}"]`);
      if (phrase) {
        phrase.classList.remove('selected');
        phrase.setAttribute('aria-expanded', 'false');
      }
    });
    scheduleDraw();
  }
  function toggle(role) {
    const shouldOpen = expanded !== role;
    closeAll();
    if (shouldOpen) {
      expanded = role;
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      note.classList.add('is-open');
      note.querySelector('.note-trigger').setAttribute('aria-expanded', 'true');
      document.getElementById(`detail-${role}`).hidden = false;
      const phrase = statement.querySelector(`.phrase[data-role="${role}"]`);
      if (phrase) { phrase.classList.add('selected'); phrase.setAttribute('aria-expanded', 'true'); }
    }
    scheduleDraw();
  }
  function render() {
    if (!current) return;
    document.getElementById('plate-id').textContent = current.id;
    statement.replaceChildren(renderParts(current.text));
    roles.forEach(fillNote);
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    closeAll();
  }
  function next() {
    if (!validBank()) return;
    if (!queues[mode].length) queues[mode] = shuffled(bank[mode].length, previous[mode]);
    const index = queues[mode].shift();
    previous[mode] = index;
    current = bank[mode][index];
    render();
  }
  function scheduleDraw() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(drawConnectors);
  }
  function drawConnectors() {
    svg.replaceChildren();
    if (examination.hidden || matchMedia('(max-width:760px)').matches || !current) return;
    const containerRect = stage.getBoundingClientRect();
    const relative = (rect, x, y) => ({x: rect.left - containerRect.left + x, y: rect.top - containerRect.top + y});
    roles.forEach(role => {
      const phrase = statement.querySelector(`.phrase[data-role="${role}"]`);
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      if (!phrase || !note) return;
      const rects = Array.from(phrase.getClientRects());
      if (!rects.length) return;
      // Connect to the underline, a few pixels BELOW its text fragment.
      // This prevents a leader line from entering the letterforms.
      const side = role === 'focus' ? 'left' : 'right';
      const fragment = side === 'left' ? rects[0] : rects[rects.length - 1];
      const target = relative(fragment, side === 'left' ? 0 : fragment.width, fragment.height + 5);
      const nr = note.getBoundingClientRect();
      const anchor = relative(nr, side === 'left' ? nr.width : 0, 38);
      // Run the leader in the empty line-gutter below the phrase, then along
      // the outer column. Avoid routing through the statement text bounding box.
      const bend = side === 'left' ? anchor.x + 15 : anchor.x - 15;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', `M ${anchor.x} ${anchor.y} H ${bend} V ${target.y} H ${target.x}`);
      if (expanded === role) path.classList.add('active');
      svg.append(path);
    });
  }
  function start() {
    if (!validBank()) { alert('The provocation library could not be loaded.'); return; }
    mode = document.querySelector('input[name="orientation"]:checked').value;
    introduction.hidden = true;
    examination.hidden = false;
    document.getElementById('reset').hidden = false;
    next();
    document.getElementById('next').focus({preventScroll:true});
  }
  function reset() {
    introduction.hidden = false;
    examination.hidden = true;
    document.getElementById('reset').hidden = true;
    current = null;
    svg.replaceChildren();
    document.getElementById('begin').focus({preventScroll:true});
  }
  document.getElementById('begin').addEventListener('click', start);
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('next').addEventListener('click', next);
  modeButtons.forEach(button => button.addEventListener('click', () => {
    if (mode !== button.dataset.mode) {mode = button.dataset.mode;next();}
  }));
  stage.querySelectorAll('.note-trigger').forEach(button => button.addEventListener('click', () => toggle(button.dataset.role)));
  window.addEventListener('resize', scheduleDraw, {passive: true});
  if (document.fonts) document.fonts.ready.then(scheduleDraw);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleDraw).observe(stage);
  if (!validBank()) {
    document.getElementById('begin').disabled = true;
    document.querySelector('.intro-instruction').textContent = 'The provocation library could not be loaded.';
  }
})();
