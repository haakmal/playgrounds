(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const els = {
    input: $('#namesInput'),
    groupSize: $('#groupSize'),
    reviewerSize: $('#reviewerSize'),
    count: $('#nameCount'),
    summary: $('#groupSummary'),
    results: $('#groups'),
    meta: $('#resultMeta'),
    title: $('#resultTitle'),
    generate: $('#generate'),
    groupsControls: $('#groupsControls'),
    assignmentControls: $('#assignmentControls')
  };
  const samples = ['Alex Morgan', 'Ari Patel', 'Casey Nguyen', 'Charlie Smith', 'Drew Wilson', 'Jamie Lee', 'Jordan Brown', 'Kai Taylor', 'Morgan Davis', 'Riley Chen', 'Sam Jones', 'Taylor Kim'];
  let mode = 'groups';
  let result = [];

  const getNames = () => [...new Set(els.input.value.split(/[\n,]/).map((name) => name.trim()).filter(Boolean))];
  const shuffled = (items) => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const setRange = (input, delta) => {
    input.value = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + delta));
    updateSummary();
  };
  const updateSummary = () => {
    const names = getNames();
    const groupSize = Number(els.groupSize.value);
    const reviewers = Number(els.reviewerSize.value);
    $('#sizeOutput').textContent = groupSize;
    $('#reviewerOutput').textContent = reviewers;
    els.count.textContent = `${names.length} name${names.length === 1 ? '' : 's'}`;
    if (!names.length) els.summary.textContent = 'Add names to get started.';
    else if (mode === 'groups') {
      const groupCount = Math.ceil(names.length / groupSize);
      els.summary.textContent = `${groupCount} group${groupCount === 1 ? '' : 's'} · ${names.length % groupSize ? 'last group may be smaller' : 'evenly distributed'}`;
    } else {
      els.summary.textContent = `${reviewers} reviewer${reviewers === 1 ? '' : 's'} assigned to each person · ${names.length} assignments`;
    }
  };
  const createGroups = (names) => {
    const groups = [];
    const shuffledNames = shuffled(names);
    for (let i = 0; i < shuffledNames.length; i += Number(els.groupSize.value)) groups.push({ members: shuffledNames.slice(i, i + Number(els.groupSize.value)) });
    return groups;
  };
  const createAssignments = (names) => {
    const count = Math.min(Number(els.reviewerSize.value), names.length - 1);
    return names.map((owner) => ({ owner, members: shuffled(names.filter((name) => name !== owner)).slice(0, count) }));
  };
  const render = (items) => {
    result = items;
    els.results.className = 'groups';
    els.results.innerHTML = '';
    const headers = mode === 'groups' ? items.map((_, i) => `Group ${String(i + 1).padStart(2, '0')}`) : ['Name', ...Array.from({ length: Math.max(0, ...items.map((item) => item.members.length)) }, (_, i) => `Assigned ${i + 1}`)];
    const maxMembers = mode === 'groups' ? Math.max(0, ...items.map((item) => item.members.length)) : items.length;
    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `<thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody></tbody>`;
    const body = table.querySelector('tbody');
    for (let row = 0; row < maxMembers; row += 1) {
      const tr = document.createElement('tr');
      if (mode === 'groups') items.forEach((item) => { const td = document.createElement('td'); td.textContent = item.members[row] || ''; tr.append(td); });
      else { const item = items[row]; const owner = document.createElement('td'); owner.textContent = item.owner; tr.append(owner); item.members.forEach((name) => { const td = document.createElement('td'); td.textContent = name; tr.append(td); }); }
      body.append(tr);
    }
    els.results.append(table);
    els.meta.textContent = `${getNames().length} people · ${items.length} ${mode === 'groups' ? 'groups' : 'assignments'}`;
    els.title.textContent = mode === 'groups' ? 'Your groups' : 'Review assignments';
  };
  const generate = () => {
    const names = getNames();
    if (!names.length) { els.input.focus(); els.input.classList.add('invalid'); setTimeout(() => els.input.classList.remove('invalid'), 500); return; }
    render(mode === 'groups' ? createGroups(names) : createAssignments(names));
  };
  const shuffleResult = () => {
    if (mode === 'assignments' || !result.length) return generate();
    render(createGroups(result.flatMap((group) => group.members)));
  };

  document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('.mode-button').forEach((item) => item.classList.toggle('active', item === button));
    els.groupsControls.hidden = mode !== 'groups';
    els.assignmentControls.hidden = mode !== 'assignments';
    els.generate.innerHTML = mode === 'groups' ? 'Generate groups <span>↗</span>' : 'Generate assignments <span>↗</span>';
    updateSummary();
  }));
  els.input.addEventListener('input', updateSummary);
  els.groupSize.addEventListener('input', updateSummary);
  els.reviewerSize.addEventListener('input', updateSummary);
  $('#decrease').addEventListener('click', (event) => { event.preventDefault(); setRange(els.groupSize, -1); });
  $('#increase').addEventListener('click', (event) => { event.preventDefault(); setRange(els.groupSize, 1); });
  $('#reviewerDecrease').addEventListener('click', (event) => { event.preventDefault(); setRange(els.reviewerSize, -1); });
  $('#reviewerIncrease').addEventListener('click', (event) => { event.preventDefault(); setRange(els.reviewerSize, 1); });
  els.generate.addEventListener('click', generate);
  $('#shuffle').addEventListener('click', shuffleResult);
  $('#sampleButton').addEventListener('click', () => { els.input.value = samples.join('\n'); updateSummary(); generate(); });
  $('#clearAll').addEventListener('click', () => { els.input.value = ''; result = []; els.results.className = 'groups empty'; els.results.innerHTML = '<div class="empty-state"><span class="empty-icon">○</span><p>Results will appear here.</p><small>Add names above, then generate an arrangement.</small></div>'; els.meta.textContent = 'No groups yet'; updateSummary(); });
  $('#printButton').addEventListener('click', () => window.print());
  updateSummary();
}());
