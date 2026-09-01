function optionList(options, current, placeholder) {
  let html = '';

  if (placeholder) {
    html += `<option value="" ${current ? '' : 'selected'} disabled>${escapeHtml(placeholder)}</option>`;
  }

  html += options
    .map((option) => (
      `<option value="${escapeHtml(option)}" ${option === current ? 'selected' : ''}>${escapeHtml(option)}</option>`
    ))
    .join('');

  return html;
}

function renderCompound() {
  const root = document.getElementById('compoundChain');
  if (!root) return;

  let html = `
    <div class="chain-row">
      <span class="chain-node input-node">${escapeHtml(state.input)}</span>
      <span>→</span>
      <select class="chain-select process-select" data-chain="baseProcess">
        ${optionList(processOptions, state.behaviour)}
      </select>
      <span>→</span>
      <select class="chain-select output-select" data-chain="baseOutput">
        ${optionList(outputOptions, state.output)}
      </select>
  `;

  if (state.compound.extraOutput !== null) {
    html += `
      <span class="branch-mark">+</span>
      <select class="chain-select output-select" data-chain="extraOutput">
        ${optionList(outputOptions, state.compound.extraOutput, 'Choose response')}
      </select>
      <button class="chain-remove" data-remove="extra" type="button">Remove</button>
    `;
  }

  html += '</div>';

  if (state.compound.nextStage) {
    html += `
      <div class="chain-row chain-next">
        <span class="chain-then">THEN</span>
        <select class="chain-select process-select" data-chain="stageProcess">
          ${optionList(processOptions, state.compound.nextStage.process, 'Choose process')}
        </select>
        <span>→</span>
        <select class="chain-select output-select" data-chain="stageOutput">
          ${optionList(outputOptions, state.compound.nextStage.output, 'Choose output')}
        </select>
        <button class="chain-remove" data-remove="stage" type="button">Remove</button>
      </div>
    `;
  }

  root.innerHTML = html;

  const level = state.compound.extraOutput !== null || state.compound.nextStage
    ? 'Combined'
    : 'Foundation';
  document.getElementById('complexityMeter').textContent = level;

  renderRecipeDetail();
}

function addResponse() {
  if (state.compound.extraOutput !== null || state.compound.nextStage) {
    return showComplexity();
  }

  state.compound.extraOutput = '';
  saveState();
  renderCompound();
}

function addStage() {
  if (state.compound.extraOutput !== null || state.compound.nextStage) {
    return showComplexity();
  }

  state.compound.nextStage = {
    process: '',
    output: ''
  };

  saveState();
  renderCompound();
}

function showComplexity() {
  document.getElementById('complexityDialog').showModal();
}

function recipeTitle() {
  return `${state.input} · ${state.behaviour} · ${state.output}`;
}

function renderRecipeDetail() {
  const label = document.getElementById('selectedRecipeLabel');
  if (!label) return;

  label.textContent = recipeTitle();

  const cue = document.getElementById('logicExtensionCue');
  if (cue) {
    const extended = state.compound?.extraOutput !== null || !!state.compound?.nextStage;
    cue.hidden = !extended;
  }

  let summary = processPatterns[state.behaviour]?.summary || '';

  if (state.compound.extraOutput !== null) {
    summary += state.compound.extraOutput
      ? ` This process also produces ${state.compound.extraOutput.toLowerCase()}.`
      : ' Choose the additional response below.';
  }

  if (state.compound.nextStage) {
    summary += state.compound.nextStage.process && state.compound.nextStage.output
      ? ` It then uses ${state.compound.nextStage.process.toLowerCase()} to produce ${state.compound.nextStage.output.toLowerCase()}.`
      : ' Choose the following process and output below.';
  }

  document.getElementById('selectedRecipeSummary').textContent = summary;

  const blocks = [];
  (processPatterns[state.behaviour]?.blocks || []).forEach((block) => {
    blocks.push(
      block
        .replace('{input}', state.input)
        .replace('{output}', state.output)
    );
  });

  if (state.compound.extraOutput !== null && state.compound.extraOutput) {
    blocks.push(`ALSO DO ${state.compound.extraOutput}`);
  }

  if (state.compound.nextStage) {
    if (state.compound.nextStage.process && state.compound.nextStage.output) {
      blocks.push(`THEN ${state.compound.nextStage.process}`);
      blocks.push(`DO ${state.compound.nextStage.output}`);
    } else {
      blocks.push('THEN choose the next process and output');
    }
  }

  document.getElementById('recipeBlocks').innerHTML = blocks
    .map((block, index) => {
      const className = index === 0
        ? 'input'
        : block.startsWith('DO') || block.startsWith('ALSO')
          ? 'output'
          : block.startsWith('IF')
            ? 'conditional'
            : 'step';

      return `<div class="code-block ${className}">${escapeHtml(block)}</div>`;
    })
    .join('');
}
