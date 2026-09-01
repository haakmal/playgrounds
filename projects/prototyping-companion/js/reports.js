function snapshot(title, section) {
  return {
    id: `report-${Date.now()}`,
    created: stamp(),
    title,
    section,
    snapshot: JSON.parse(JSON.stringify({
      title: state.title,
      input: state.input,
      output: state.output,
      behaviour: state.behaviour,
      compound: state.compound,
      explore: state.explore,
      define: state.define,
      make: state.make,
      test: state.test,
      reflect: state.reflect
    }))
  };
}

function createReport(title = 'Project checkpoint', section = activeSection) {
  const report = snapshot(title, section);
  state.reports.unshift(report);
  saveState();
  renderReports();
  return report;
}

function renderReports() {
  const root = document.getElementById('reportsList');
  if (!root) return;

  if (!state.reports.length) {
    root.innerHTML = '<div class="empty-reports">No report snapshots yet. Create one when you reach a useful checkpoint.</div>';
    return;
  }

  root.innerHTML = state.reports
    .map((report, index) => `
      <div class="report-row">
        <div class="report-number">${String(state.reports.length - index).padStart(2, '0')}</div>
        <div>
          <div class="report-name">${escapeHtml(report.title)}</div>
          <div class="report-meta">
            ${prettyDate(report.created)} · ${escapeHtml(sectionNames[report.section] || 'Project')}
          </div>
        </div>
        <div class="report-actions">
          <button data-view-report="${report.id}" type="button">View</button>
          <button data-export-report="${report.id}" type="button">Export PDF</button>
        </div>
      </div>
    `)
    .join('');
}

function chainText(snapshotState) {
  let text = `${snapshotState.input || 'Input'} → ${snapshotState.behaviour || 'Process'} → ${snapshotState.output || 'Output'}`;

  if (snapshotState.compound?.extraOutput) {
    text += ` + ${snapshotState.compound.extraOutput}`;
  }

  if (snapshotState.compound?.nextStage) {
    text += ` → ${snapshotState.compound.nextStage.process} → ${snapshotState.compound.nextStage.output}`;
  }

  return text;
}

function reportSection(title, rows) {
  if (!rows.some((row) => row[1])) return '';

  return `
    <section>
      <h2>${title}</h2>
      ${rows
        .filter((row) => row[1])
        .map(
          (row) => `
            <div class="row">
              <div class="label">${escapeHtml(row[0])}</div>
              <div class="value">${nl2br(row[1])}</div>
            </div>
          `
        )
        .join('')}
    </section>
  `;
}

function reportHtml(report) {
  const snapshotState = report.snapshot;

  return `
    <div class="print-page">
      <div class="report-header">
        <div class="eyebrow">Interactive Prototyping Companion · Report snapshot</div>
        <h1>${escapeHtml(snapshotState.title)}</h1>
        <div class="report-meta">${escapeHtml(report.title)} · ${prettyDate(report.created)}</div>
      </div>

      <h2>Interaction</h2>
      <div class="interaction">${escapeHtml(chainText(snapshotState))}</div>

      ${reportSection('01 Explore', [
        ['Field notes', snapshotState.explore?.notes]
      ])}

      ${reportSection('02 Define', [
        ['When this happens', snapshotState.define?.intent],
        ['Prototype should', snapshotState.define?.response],
        ['Why explore it?', snapshotState.define?.why],
        ['Field notes', snapshotState.define?.notes]
      ])}

      ${reportSection('03 Make', [
        ['Interaction logic', `${snapshotState.input} · ${snapshotState.behaviour} · ${snapshotState.output}`],
        ['Changes', snapshotState.make?.changes],
        ['Difficulties', snapshotState.make?.problems]
      ])}

      ${reportSection('04 Test', [
        ['Expected interaction', snapshotState.test?.expected],
        ['What the person actually did', snapshotState.test?.observed],
        ['What the prototype did', snapshotState.test?.actual],
        ['Surprise', snapshotState.test?.surprise],
        ['Next change', snapshotState.test?.change],
        ['Field notes', snapshotState.test?.notes]
      ])}

      ${reportSection('05 Reflect', [
        ['Discovery', snapshotState.reflect?.discovery],
        ['Changed thinking', snapshotState.reflect?.thinking],
        ['What matters now', snapshotState.reflect?.importance],
        ['What are you struggling with?', snapshotState.reflect?.next],
        ['Field notes', snapshotState.reflect?.notes]
      ])}

      ${report.support ? reportSection('Support request', [
        ['Audience', report.support.audience],
        ['Problem', report.support.description]
      ]) : ''}

      <div class="footer">
        Project stored locally in browser storage. Export the project file regularly.
        Report snapshot ${escapeHtml(report.id)}.
      </div>
    </div>
  `;
}

function printReports(reports) {
  document.getElementById('printReport').innerHTML = reports.map(reportHtml).join('');
  document.body.classList.add('printing-report');
  requestAnimationFrame(() => window.print());
}

function exportReport(id) {
  const report = state.reports.find((item) => item.id === id);
  if (!report) {
    toast('Report snapshot not found');
    return;
  }

  printReports([report]);
}

function exportAllReports() {
  if (!state.reports.length) {
    toast('Create a report snapshot first');
    updateActiveSection('reports');
    return;
  }

  printReports(state.reports.slice().reverse());
}

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-report');
});

function viewReport(report) {
  const snapshotState = report.snapshot;
  const heading = document.getElementById('resourceHeading');
  const content = document.getElementById('resourceContent');

  heading.textContent = report.title;
  content.innerHTML = `
    <section>
      <div class="eyebrow">Report snapshot · ${prettyDate(report.created)}</div>
      <p><strong>${escapeHtml(snapshotState.title)}</strong></p>
    </section>

    ${reportSection('Interaction', [['IPO / chain', chainText(snapshotState)]])}

    ${reportSection('Explore', [['Field notes', snapshotState.explore?.notes]])}

    ${reportSection('Define', [
      ['When this happens', snapshotState.define?.intent],
      ['Prototype should', snapshotState.define?.response],
      ['Why explore it?', snapshotState.define?.why],
      ['Field notes', snapshotState.define?.notes]
    ])}

    ${reportSection('Make', [
      ['Changes', snapshotState.make?.changes],
      ['Difficulties', snapshotState.make?.problems]
    ])}

    ${reportSection('Test', [
      ['Expected interaction', snapshotState.test?.expected],
      ['What the person actually did', snapshotState.test?.observed],
      ['What the prototype did', snapshotState.test?.actual],
      ['Surprise', snapshotState.test?.surprise],
      ['Next change', snapshotState.test?.change],
      ['Field notes', snapshotState.test?.notes]
    ])}

    ${reportSection('Reflect', [
      ['Discovery', snapshotState.reflect?.discovery],
      ['Changed thinking', snapshotState.reflect?.thinking],
      ['What matters now', snapshotState.reflect?.importance],
      ['What are you struggling with?', snapshotState.reflect?.next],
      ['Field notes', snapshotState.reflect?.notes]
    ])}
  `;

  document.getElementById('resourceDialog').showModal();
}
