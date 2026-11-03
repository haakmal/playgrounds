/* Inquiry Plates v3. No persistence, network requests, analytics, or input collection.
   A plate consists of three INDEPENDENT authored prompts. Each role has a
   nonrepeating shuffled queue and can be replaced without affecting the others. */
(() => {
  'use strict';
  const library = window.INQUIRY_MODULES;
  const roles = ['focus', 'action', 'opening'];
  const intro = document.getElementById('introduction');
  const examination = document.getElementById('examination');
  const stage = document.getElementById('plate-body');
  const svg = document.getElementById('connectors');
  const modeButtons = [...document.querySelectorAll('.mode-button')];
  const items = { discovery: {}, concept: {} };
  const queues = { discovery: {}, concept: {} };
  const previous = { discovery: {}, concept: {} };
  for (const mode of ['discovery', 'concept']) for (const role of roles) queues[mode][role] = [];
  let mode = 'discovery';
  let active = null;
  let raf = 0;
  let transitionVersion = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const valid = () => library && ['discovery', 'concept'].every(m => roles.every(r => Array.isArray(library[m]?.[r]) && library[m][r].length > 0));

  function shuffled(length, exclude) {
    const order = Array.from({length}, (_, i) => i);
    for (let i=order.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [order[i],order[j]]=[order[j],order[i]];
    }
    if (order.length > 1 && order[0]===exclude) [order[0],order[1]]=[order[1],order[0]];
    return order;
  }
  function sample(role) {
    if (!queues[mode][role].length) queues[mode][role] = shuffled(library[mode][role].length, previous[mode][role]);
    const index = queues[mode][role].shift();
    previous[mode][role] = index;
    items[mode][role] = library[mode][role][index];
  }
  function closeDetails() {
    active = null;
    for (const role of roles) {
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      note.classList.remove('is-open');
      note.querySelector('.note-trigger').setAttribute('aria-expanded','false');
      document.getElementById(`detail-${role}`).hidden = true;
      const phrase = stage.querySelector(`.phrase[data-role="${role}"]`);
      phrase.classList.remove('selected');
      phrase.setAttribute('aria-expanded','false');
    }
    scheduleLines();
  }
  function toggleDetail(role) {
    const opening = active !== role;
    closeDetails();
    if (opening) {
      active = role;
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      note.classList.add('is-open');
      note.querySelector('.note-trigger').setAttribute('aria-expanded','true');
      document.getElementById(`detail-${role}`).hidden = false;
      const phrase = stage.querySelector(`.phrase[data-role="${role}"]`);
      phrase.classList.add('selected');
      phrase.setAttribute('aria-expanded','true');
    }
    scheduleLines();
  }
  function renderRole(role) {
    const entry = items[mode][role];
    if (!entry) return;
    const [phrase, question] = entry;
    document.getElementById(`phrase-${role}`).textContent = phrase;
    // No detached punctuation: punctuation is part of the phrase in one inline element.
    document.getElementById(`summary-${role}`).textContent = role === 'focus' ? 'Focus of scrutiny' : role === 'action' ? 'Expressive action' : 'Interpretive opening';
    const questions = [question];
    const additional = {
      discovery: {
        focus: 'What in your scenario might you be taking for granted?',
        action: 'How might this invite expression instead of a direct answer?',
        opening: 'What would an unexpected response make you reconsider?'
      },
      concept: {
        focus: 'Which assumption does your emerging concept depend on?',
        action: 'Could this be explored before building the prototype?',
        opening: 'What might this change about what you prototype next?'
      }
    };
    questions.push(additional[mode][role]);
    document.getElementById(`queries-${role}`).replaceChildren(...questions.map(q => {
      const li = document.createElement('li'); li.textContent = q; return li;
    }));
  }
  function render() {
    for (const role of roles) renderRole(role);
    modeButtons.forEach(btn => btn.setAttribute('aria-pressed',String(btn.dataset.mode===mode)));
    closeDetails();
    scheduleLines();
  }
  function animateChange(work) {
    const version = ++transitionVersion;
    if (reduceMotion.matches) { work(); return; }
    stage.classList.add('is-fading');
    setTimeout(() => {
      if (version !== transitionVersion) return;
      work();
      requestAnimationFrame(() => {
        if (version === transitionVersion) {
          stage.classList.remove('is-fading');
          scheduleLines();
        }
      });
    }, 170);
  }
  function changeRole(role) {
    animateChange(() => {sample(role);renderRole(role);closeDetails();});
  }
  function changeAll() {
    animateChange(() => {roles.forEach(sample);render();});
  }
  function changeMode(newMode) {
    if (mode===newMode) return;
    animateChange(() => {
      mode = newMode;
      roles.forEach(r => {if (!items[mode][r]) sample(r);});
      render();
    });
  }
  function scheduleLines() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(drawLines);
  }
  function drawLines() {
    svg.replaceChildren();
    if (examination.hidden || matchMedia('(max-width: 800px)').matches) return;
    const root = stage.getBoundingClientRect();
    const position = (rect,x,y) => ({x:rect.left-root.left+x,y:rect.top-root.top+y});
    for (const role of roles) {
      const phrase = document.getElementById(`phrase-${role}`);
      const note = stage.querySelector(`.note[data-role="${role}"]`);
      const textRects = [...phrase.getClientRects()];
      if (!textRects.length) continue;
      const isLeft = role === 'focus';
      const segment = isLeft ? textRects[0] : textRects[textRects.length-1];
      // Endpoint is on the phrase's underline, never within glyphs.
      const endpoint = position(segment, isLeft ? 2 : segment.width-2, segment.height+3);
      const noteRect = note.getBoundingClientRect();
      const anchor = position(noteRect,isLeft?noteRect.width:0,24);
      const outer = isLeft ? anchor.x+16 : anchor.x-16;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${anchor.x} ${anchor.y} H ${outer} V ${endpoint.y} H ${endpoint.x}`);
      if (active===role) path.classList.add('active');
      svg.append(path);
    }
  }
  function start() {
    if (!valid()) {window.alert('The inquiry library could not be loaded.');return;}
    mode = document.querySelector('input[name="orientation"]:checked').value;
    roles.forEach(r => {if (!items[mode][r]) sample(r);});
    ++transitionVersion;
    intro.hidden = true;
    examination.hidden = false;
    document.getElementById('reset').hidden = false;
    render();
    if (!reduceMotion.matches) {
      examination.classList.add('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => examination.classList.remove('entering')));
    }
    document.getElementById('next').focus({preventScroll:true});
  }
  function reset() {
    ++transitionVersion;
    intro.hidden=false;
    examination.hidden=true;
    stage.classList.remove('is-fading');
    examination.classList.remove('entering');
    document.getElementById('reset').hidden=true;
    svg.replaceChildren();
    document.getElementById('begin').focus({preventScroll:true});
  }
  document.getElementById('begin').addEventListener('click',start);
  document.getElementById('reset').addEventListener('click',reset);
  document.getElementById('next').addEventListener('click',changeAll);
  modeButtons.forEach(btn => btn.addEventListener('click',() => changeMode(btn.dataset.mode)));
  stage.querySelectorAll('.note-trigger').forEach(btn => btn.addEventListener('click',() => toggleDetail(btn.dataset.role)));
  stage.querySelectorAll('.phrase').forEach(btn => btn.addEventListener('click',() => toggleDetail(btn.dataset.role)));
  stage.querySelectorAll('[data-shuffle]').forEach(btn => btn.addEventListener('click',() => changeRole(btn.dataset.shuffle)));
  window.addEventListener('resize',scheduleLines,{passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(scheduleLines).observe(stage);
  if (document.fonts) document.fonts.ready.then(scheduleLines);
  if (!valid()) {document.getElementById('begin').disabled=true;}
})();
