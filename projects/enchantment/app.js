(function () {
  'use strict';

  const STORAGE_KEY = 'ddes1150-enchantment-v2';
  const CONTENT = window.ENCHANTMENT_CONTENT || {};
  const SETTINGS = CONTENT.settings || {};
  const DESIRES = CONTENT.desires || [];
  const POWERS = CONTENT.powers || [];
  const INGREDIENTS = CONTENT.ingredients || [];
  const ETHER = CONTENT.ether || [];
  const BALL_READINGS = CONTENT.ballReadings || [];

  const app = {
    workspace: null,
    currentStage: 'welcome',
    currentSpellId: null,
    currentIngredientId: null,
    currentPair: null,
    pendingEther: null,
    journeyOpen: false,
    menuOpen: false,
    ballIndex: 0,
    etherIndex: 0,
    savingTimer: null,
    transitionTimer: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  const el = {
    stage: $('#stage'), promptCopy: $('#promptCopy'), promptAction: $('#promptAction'),
    tools: $('#toolsDrawer'), book: $('#bookDrawer'), bookContent: $('#bookContent'),
    save: $('#saveState'), sessionsModal: $('#sessionsModal'), sessionsList: $('#sessionsList'),
    helpModal: $('#helpModal'), importInput: $('#importInput')
  };

  function uid(prefix='ench') { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
  function activeSession() { return app.workspace.sessions.find(s => s.id === app.workspace.activeId) || app.workspace.sessions[0]; }
  function activeSpell() { const s = activeSession(); return s?.spells.find(x => x.id === app.currentSpellId) || null; }
  function now() { return Date.now(); }

  function blankSession(name='Untitled spell book') {
    return {
      id: uid('session'), name, interaction:'', context:'', ingredients:[], spells:[],
      created: now(), updated: now(), status:'active'
    };
  }

  function defaultWorkspace() {
    const session = blankSession('Untitled spell book');
    return { activeId: session.id, sessions:[session] };
  }

  function normaliseWorkspace(data) {
    if (!data || !Array.isArray(data.sessions) || !data.sessions.length) return null;
    const sessions = data.sessions.map(raw => {
      const base = blankSession(raw.name || 'Untitled spell book');
      Object.assign(base, raw);
      base.id = raw.id || base.id;
      base.ingredients = Array.isArray(raw.ingredients) ? raw.ingredients.map(i => ({ id:i.id || uid('ingredient'), type:i.type || '', label:i.label || '', value:i.value || '' })) : [];
      base.spells = Array.isArray(raw.spells) ? raw.spells.map(spell => ({
        id: spell.id || uid('spell'),
        name: spell.name || 'Unnamed spell',
        desire: spell.desire || null,
        power: spell.power || null,
        ingredient: spell.ingredient || null,
        idea: spell.idea || '',
        variations: Array.isArray(spell.variations) ? spell.variations.map(v => ({ id:v.id || uid('variation'), ether:v.ether || null, response:v.response || '', created:v.created || now() })) : [],
        created: spell.created || now(), updated: spell.updated || now()
      })) : [];
      return base;
    });
    return { activeId: sessions.some(s => s.id === data.activeId) ? data.activeId : sessions[0].id, sessions };
  }

  function save() {
    try {
      activeSession().updated = now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(app.workspace));
      el.save.textContent = 'Saved locally';
    } catch (_) {}
  }

  function scheduleSave() {
    el.save.textContent = 'Saving…';
    clearTimeout(app.savingTimer);
    app.savingTimer = setTimeout(save, 250);
  }

  function transition(renderFn) {
    clearTimeout(app.transitionTimer);
    el.stage.classList.remove('is-entering');
    el.stage.classList.add('is-leaving');
    app.transitionTimer = setTimeout(() => {
      renderFn();
      el.stage.classList.remove('is-leaving');
      void el.stage.offsetWidth;
      el.stage.classList.add('is-entering');
      renderBook();
    }, 260);
  }

  function setPrompt(copy, actionHtml='') {
    el.promptCopy.innerHTML = copy || '';
    el.promptAction.innerHTML = actionHtml || '';
  }

  function openDrawer(which) { if (which === 'tools') { el.tools.classList.add('is-open'); el.tools.setAttribute('aria-hidden','false'); } else { el.book.classList.add('is-open'); el.book.setAttribute('aria-hidden','false'); renderBook(); } }
  function closeDrawers() { [el.tools, el.book].forEach(d => { d.classList.remove('is-open'); d.setAttribute('aria-hidden','true'); }); }
  function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('is-open'); m.setAttribute('aria-hidden','false'); } }
  function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('is-open'); m.setAttribute('aria-hidden','true'); } }

  function chooseRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function chooseUnusedPair() {
    const session = activeSession();
    const used = new Set(session.spells.map(s => `${s.desire?.name}|${s.power?.name}`));
    let pair = null;
    for (let i=0;i<40;i++) {
      const desire = chooseRandom(DESIRES), power = chooseRandom(POWERS);
      if (!used.has(`${desire.name}|${power.name}`) || i === 39) { pair = { desire, power }; break; }
    }
    return pair;
  }
  function chooseUnusedIngredient() {
    const session = activeSession();
    const selected = new Set(session.spells.map(s => s.ingredient?.id).filter(Boolean));
    const available = INGREDIENTS.filter(i => !selected.has(i.id));
    return chooseRandom(available.length ? available : INGREDIENTS);
  }

  function renderWelcome() {
    app.currentStage = 'welcome';
    setPrompt('The table is quiet. Bring something with you.', '<button class="button button-primary" id="approachButton">Approach the table</button>');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <div class="seer-mark" aria-hidden="true">✦</div>
          <p class="kicker">The Seer</p>
          <h1 class="title">There is another<br>way to see it.</h1>
          <p class="subtitle">${esc((CONTENT.openingLines || [])[0] || 'You have brought an interaction that needs another possibility.')}</p>
        </div>`;
      $('#approachButton').addEventListener('click', renderQuandary);
    });
  }

  function renderQuandary() {
    app.currentStage = 'quandary';
    const s = activeSession();
    setPrompt('Tell the Seer what brought you here. No solution required yet.', '<button class="button button-primary" id="quandaryNext">Bring it to the table</button>');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene narrow">
          <p class="kicker">Bring your quandary</p>
          <h2 class="title" style="font-size:clamp(40px,6vw,68px)">What interaction<br>needs another possibility?</h2>
          <div class="form-card">
            <label class="field"><span>Your interaction</span><textarea id="interactionInput" rows="5" placeholder="e.g. Finding an available place to study on campus">${esc(s.interaction)}</textarea></label>
            <label class="field"><span>Where or when does it happen? <em>(optional)</em></span><input id="contextInput" value="${esc(s.context)}" placeholder="e.g. Between classes, around lunchtime, in the library"></label>
            <p class="edit-hint">You can edit this later from the Spell Book.</p>
          </div>
        </div>`;
      const input = $('#interactionInput'), context = $('#contextInput');
      [input,context].forEach(node => node.addEventListener('input', () => { s.interaction=input.value; s.context=context.value; scheduleSave(); renderBook(); gateQuandary(); }));
      $('#quandaryNext').addEventListener('click', () => { if (!canContinue(s.interaction, SETTINGS.minInteractionLength || 12)) return softNudge('quandaryNext','Give the Seer a little more to work with.'); renderIngredients(); });
      gateQuandary(); input.focus();
    });
  }

  function gateQuandary() { const b=$('#quandaryNext'); if (b) b.disabled=activeSession().interaction.trim().length < Number(SETTINGS.minInteractionLength || 12); }

  function renderIngredients() {
    app.currentStage = 'ingredients';
    const s = activeSession();
    setPrompt('Choose a few things that shape the interaction. You do not need everything.', '<button class="button button-primary" id="ingredientsDone">Let the Seer look closer</button>');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <p class="kicker">Gather your ingredients</p>
          <h2 class="title" style="font-size:clamp(38px,5.8vw,66px)">What matters here?</h2>
          <p class="subtitle">Pick a few lenses. The Seer will help you fill in what each one changes. You can add your own later.</p>
          <div class="ingredient-grid" id="ingredientGrid">${INGREDIENTS.map(item => `
            <button type="button" class="ingredient-card ${s.ingredients.some(i=>i.type===item.id)?'is-selected':''}" data-ingredient="${esc(item.id)}">
              <strong>${esc(item.label)}</strong>
              <small>${esc(item.question)}</small>
            </button>`).join('')}</div>
          <div id="factorEditor"></div>
        </div>`;
      $$('.ingredient-card').forEach(card => card.addEventListener('click', () => editIngredient(card.dataset.ingredient)));
      $('#ingredientsDone').addEventListener('click', () => {
        if (s.ingredients.length < Number(SETTINGS.minIngredients || 2)) return softNudge('ingredientsDone','Choose at least two ingredients. A couple of useful details are enough.');
        beginSpell();
      });
      if (s.ingredients[0]) editIngredient(s.ingredients[0].type, false);
      updateIngredientGate();
    });
  }

  function editIngredient(type, autofocus=true) {
    const item = INGREDIENTS.find(x=>x.id===type); if(!item) return;
    const s = activeSession();
    let record = s.ingredients.find(x=>x.type===type);
    if (!record) {
      if (s.ingredients.length >= Number(SETTINGS.maxIngredientSelections || 5)) return softNudge('ingredientsDone','That is enough ingredients for now. Let the Seer work with them.');
      record = { id:uid('ingredient'), type, label:item.label, value:'' }; s.ingredients.push(record); scheduleSave();
    }
    const editor = $('#factorEditor');
    editor.innerHTML = `
      <div class="factor-editor">
        <h3>${esc(item.label)}</h3>
        <p>${esc(item.guidance)}</p>
        <label class="field"><span>Your interaction</span><input id="factorInput" value="${esc(record.value)}" placeholder="What is true here? Update this if needed."></label>
      </div>`;
    $('#factorInput').addEventListener('input', e=>{record.value=e.target.value; scheduleSave(); renderBook();});
    if (autofocus) setTimeout(()=>$('#factorInput')?.focus(),60);
    $$('.ingredient-card').forEach(c=>c.classList.toggle('is-selected', c.dataset.ingredient===type));
    updateIngredientGate();
  }

  function updateIngredientGate() { const b=$('#ingredientsDone'); if(b) b.disabled=activeSession().ingredients.length < Number(SETTINGS.minIngredients || 2); }

  function beginSpell() {
    app.currentPair = chooseUnusedPair();
    app.currentIngredientId = chooseUnusedIngredient()?.id || activeSession().ingredients[0]?.type || null;
    renderSummon();
  }

  function renderSummon() {
    app.currentStage='summon';
    setPrompt('The cards are ready. Draw a desire and a power to craft the beginning of a spell.', '<button class="button button-primary" id="drawCards">Draw the cards</button>');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <p class="kicker">Draw from the Seer</p>
          <h2 class="title" style="font-size:clamp(38px,5.8vw,68px)">Let us craft a spell.</h2>
          <p class="subtitle">You bring the interaction. The cards only decide where to look.</p>
          <div class="deal-area">
            <div class="deck-wrap"><div class="deck" id="desireDeck"><div class="deck-face"><span>Desire</span></div></div><div class="deck-hint">Draw one</div></div>
            <div class="deck-wrap"><div class="deck" id="powerDeck"><div class="deck-face"><span>Power</span></div></div><div class="deck-hint">Draw one</div></div>
          </div>
        </div>`;
      $('#drawCards').addEventListener('click', revealCards);
    });
  }

  function revealCards() {
    const pair = app.currentPair;
    $('#desireDeck')?.classList.add('is-dealt');
    setTimeout(()=>$('#powerDeck')?.classList.add('is-dealt'), 850);
    setTimeout(()=>renderCardReveal(pair), 1600);
  }

  function renderCardReveal(pair) {
    app.currentStage='cards';
    setPrompt('Your spell has two ingredients. Now look through one of your own contextual details.', '<button class="button button-primary" id="consultBall">Consult the crystal ball</button>');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene">
          <p class="kicker">The spell begins</p>
          <div class="spell-pair">
            <article class="spell-card"><h3>${esc(pair.desire.name)}</h3><p>${esc(pair.desire.description)}</p></article>
            <div class="pair-plus">+</div>
            <article class="spell-card"><h3>${esc(pair.power.name)}</h3><p>${esc(pair.power.nudge)}</p></article>
          </div>
          <p class="subtitle" style="margin-top:32px">Desire has met power. What could it make possible?</p>
        </div>`;
      $('#consultBall').addEventListener('click', renderCrystalBall);
    });
  }

  function renderCrystalBall() {
    app.currentStage='crystal';
    const ingredient = activeSession().ingredients.find(i=>i.type===app.currentIngredientId) || activeSession().ingredients[0];
    const data = INGREDIENTS.find(i=>i.id===ingredient?.type) || INGREDIENTS[0];
    const reading = BALL_READINGS[app.ballIndex++ % Math.max(BALL_READINGS.length,1)] || 'Look at the interaction through this lens.';
    setPrompt('The Seer is looking through the detail you brought with you.', '');
    transition(() => {
      el.stage.innerHTML = `
        <div class="scene ball-stage">
          <p class="kicker" style="position:absolute;top:0">Into the crystal ball</p>
          <div class="ball" id="crystalBall">
            <span class="ball-ring r1"></span><span class="ball-ring r2"></span><span class="ball-ring r3"></span><span class="ball-ring r4"></span>
            <div class="ball-core" id="ballCore">${esc(data.label)}</div>
            <div class="ball-reading" id="ballReading"><strong>${esc(reading)}</strong><span>${esc(ingredient?.value || 'This part of the situation has not been described yet.')}</span></div>
          </div>
        </div>`;
      const ball=$('#crystalBall'), core=$('#ballCore'), text=$('#ballReading');
      setTimeout(()=>ball.classList.add('is-reading'), 120);
      setTimeout(()=>core.classList.add('is-visible'), 1500);
      setTimeout(()=>text.classList.add('is-visible'), 2550);
      setTimeout(()=>setPrompt('The Seer has seen enough. Step away from the screen and sketch what you imagine.', '<button class="button button-primary" id="sketchButton">I have sketched something</button>'), 3400);
      setTimeout(()=>$('#sketchButton')?.addEventListener('click', renderCraftSpell), 3400);
    });
  }

  function renderCraftSpell() {
    app.currentStage='craft';
    const pair=app.currentPair;
    const ingredient=activeSession().ingredients.find(i=>i.id===app.currentIngredientId) || activeSession().ingredients[0];
    const ingredientDef=INGREDIENTS.find(i=>i.id===ingredient?.type);
    setPrompt('Now put your own idea into words. The Seer will not do this part for you.', '<button class="button button-primary" id="saveSpell">Put it in the spell book</button>');
    transition(() => {
      el.stage.innerHTML=`
        <div class="scene narrow">
          <p class="kicker">Craft the spell</p>
          <h2 class="title" style="font-size:clamp(38px,5.8vw,66px)">What did you imagine?</h2>
          <div class="idea-work" style="margin-top:30px">
            <article class="sketch-card"><h3>Leave the screen.</h3><p style="color:var(--muted);line-height:1.5">Sketch the interaction first. Think about what the person does, what changes, and what happens next.</p></article>
            <article class="capture-card">
              <h3>${esc(pair.desire.name)} + ${esc(pair.power.name)}</h3>
              <div class="spell-context"><strong>${esc(ingredientDef?.label || 'Context')}</strong><br>${esc(ingredient?.value || 'Your contextual detail')}</div>
              <label class="field"><span>Your spell</span><textarea id="ideaInput" rows="8" placeholder="Describe the interaction you sketched...">${esc(app.currentSpellDraft || '')}</textarea></label>
              <label class="field"><span>Give it a name <em>(optional)</em></span><input id="spellName" placeholder="The Whispering Table" value="${esc(app.currentSpellName || '')}"></label>
            </article>
          </div>
        </div>`;
      $('#ideaInput').addEventListener('input',e=>{app.currentSpellDraft=e.target.value; scheduleSave();});
      $('#spellName').addEventListener('input',e=>{app.currentSpellName=e.target.value; scheduleSave();});
      $('#saveSpell').addEventListener('click', saveSpellDraft);
      $('#ideaInput').focus();
    });
  }

  function saveSpellDraft() {
    const text=$('#ideaInput')?.value.trim() || '';
    if (!canContinue(text, SETTINGS.minIdeaLength || 20)) return softNudge('saveSpell','The spell needs a little more shape. Tell us what the person does and what changes.');
    const s=activeSession();
    const spell={ id:uid('spell'), name:(($('#spellName')?.value.trim() || '') || `Spell ${s.spells.length+1}`), desire:app.currentPair.desire, power:app.currentPair.power, ingredient:{ id:app.currentIngredientId, type:(s.ingredients.find(i=>i.id===app.currentIngredientId)||{}).type || '', value:(s.ingredients.find(i=>i.id===app.currentIngredientId)||{}).value || '' }, idea:text, variations:[], created:now(), updated:now() };
    s.spells.push(spell); app.currentSpellId=spell.id; app.currentPair=null; app.currentIngredientId=null; app.currentSpellDraft=''; app.currentSpellName=''; scheduleSave();
    renderSpellSaved();
  }

  function renderSpellSaved() {
    const spell=activeSpell();
    setPrompt('The spell is in your book. You can make another one or disturb this one.', `<button class="button button-secondary" id="anotherSpell">Craft another</button><button class="button button-primary" id="disturbSpell">Pull from the Ether</button>`);
    transition(() => {
      el.stage.innerHTML=`<div class="scene narrow"><p class="kicker">Spell saved</p><h2 class="title" style="font-size:clamp(40px,6vw,72px)">${esc(spell.name)}</h2><p class="subtitle">${esc(spell.idea)}</p><div class="form-card" style="margin-top:30px;text-align:left"><div class="kicker">${esc(spell.desire.name)} + ${esc(spell.power.name)}</div><p style="margin:8px 0 0;font-size:14px;color:var(--muted)">Seen through ${esc((INGREDIENTS.find(i=>i.id===spell.ingredient?.type)||{}).label || 'your chosen context')}.</p></div></div>`;
      $('#anotherSpell').addEventListener('click', beginSpell);
      $('#disturbSpell').addEventListener('click', renderEther);
    });
  }

  function renderSpellBookFull() {
    openDrawer('book');
  }

  function renderBook() {
    const s=activeSession();
    if(!s){ el.bookContent.innerHTML=''; return; }
    const ingredients=s.ingredients.map(i=>`<li><strong>${esc((INGREDIENTS.find(x=>x.id===i.type)||{}).label||i.label)}</strong> — ${esc(i.value||'Not described yet')}</li>`).join('');
    const spells=s.spells.map((sp,i)=>`
      <article class="book-card" data-open-spell="${esc(sp.id)}"><h3>${esc(sp.name)}</h3><p>${esc(sp.idea)}</p><div class="book-meta">${esc(sp.desire.name)} + ${esc(sp.power.name)} · ${sp.variations.length} variation${sp.variations.length===1?'':'s'}</div></article>`).join('');
    el.bookContent.innerHTML=`
      <section class="spell-section"><h3>Book title</h3><p><button class="drawer-action" id="renameFromBook" type="button">${esc(s.name)}</button></p></section>
      <section class="spell-section"><h3>Your quandary</h3><p>${esc(s.interaction || 'Not started yet.')}</p></section>
      <section class="spell-section"><h3>Ingredients</h3><ul style="padding-left:18px;line-height:1.6;font-size:13px">${ingredients || '<li>None yet</li>'}</ul></section>
      <section class="spell-section"><h3>Spells</h3><div class="spellbook-list">${spells || '<p style="color:var(--muted)">Your first spell will appear here.</p>'}</div></section>`;
    $('#renameFromBook')?.addEventListener('click', renameSession);
    $$('[data-open-spell]').forEach(card=>card.addEventListener('click', ()=>openSavedSpell(card.dataset.openSpell)));
  }

  function openSavedSpell(id) {
    const s=activeSession(); const spell=s.spells.find(x=>x.id===id); if(!spell) return;
    app.currentSpellId=id; closeDrawers();
    setPrompt('This spell is still yours to disturb. Or return to the book and make another.', `<button class="button button-secondary" id="backToBook">Spell book</button><button class="button button-primary" id="disturbSaved">Pull from the Ether</button>`);
    transition(()=>{
      el.stage.innerHTML=`<div class="scene narrow"><p class="kicker">From the spell book</p><h2 class="title" style="font-size:clamp(40px,6vw,72px)">${esc(spell.name)}</h2><p class="subtitle">${esc(spell.idea)}</p><div class="preview-grid" style="grid-template-columns:1fr;margin-top:28px"><article class="idea-tile is-selected"><small>${esc(spell.desire.name)} + ${esc(spell.power.name)}</small><h3>Original spell</h3><p>${esc(spell.idea)}</p></article>${spell.variations.map(v=>`<article class="idea-tile"><small>Ether</small><h3>${esc(v.ether?.text || 'Variation')}</h3><p>${esc(v.response || 'No response recorded yet.')}</p></article>`).join('')}</div></div>`;
      $('#backToBook').addEventListener('click',()=>openDrawer('book'));
      $('#disturbSaved').addEventListener('click',renderEther);
    });
  }

  function renderEther() {
    const spell=activeSpell(); if(!spell) return renderSpellSaved();
    app.currentStage='ether';
    setPrompt('Pull something unexpected from the Ether. You can always return to this spell later.', '<button class="button button-primary" id="pullEther">Pull from the Ether</button>');
    transition(()=>{
      el.stage.innerHTML=`<div class="scene ether-wrap"><p class="kicker">The Ether</p><h2 class="title" style="font-size:clamp(38px,5.5vw,65px)">What else might this spell become?</h2><p class="subtitle">Let one strange condition interrupt it.</p><div class="ether-window" id="etherWindow"><div class="ether-line" id="etherLine">…</div></div></div>`;
      $('#pullEther').addEventListener('click', spinEther);
    });
  }

  function spinEther() {
    const line=$('#etherLine'); if(!line || !ETHER.length) return;
    const button=$('#pullEther'); if(button) button.disabled=true;
    line.classList.add('is-spinning');
    let i=0;
    const interval=setInterval(()=>{ line.textContent=ETHER[i % ETHER.length].text; i++; }, 115);
    setTimeout(()=>{
      clearInterval(interval);
      const choice=chooseRandom(ETHER); line.textContent=choice.text; line.classList.remove('is-spinning'); line.classList.add('is-settled');
      app.pendingEther=choice;
      setTimeout(renderEtherCapture, 900);
    }, 1450);
  }

  function renderEtherCapture() {
    const spell=activeSpell(), choice=app.pendingEther; if(!spell||!choice) return;
    app.currentStage='ether-capture';
    setPrompt('The Ether changed one condition. Sketch the variation, then record what survives.', '<button class="button button-primary" id="saveVariation">Save this variation</button>');
    transition(()=>{
      el.stage.innerHTML=`<div class="scene narrow"><p class="kicker">The Ether has spoken</p><h2 class="title" style="font-size:clamp(34px,5.4vw,62px)">${esc(choice.text)}</h2><p class="subtitle">${esc(choice.nudge)}</p><div class="idea-work" style="margin-top:30px"><article class="sketch-card"><h3>Sketch the disturbed version.</h3><p style="color:var(--muted);line-height:1.5">Do not solve the whole thing. Follow the change and see what it forces.</p></article><article class="capture-card"><label class="field"><span>What changed?</span><textarea id="variationInput" rows="8" placeholder="Describe the revised interaction..."></textarea></label></article></div></div>`;
      $('#saveVariation').addEventListener('click', saveVariation);
      $('#variationInput').focus();
    });
  }

  function saveVariation() {
    const text=$('#variationInput')?.value.trim() || '';
    if(!canContinue(text, SETTINGS.minIdeaLength || 20)) return softNudge('saveVariation','The Ether changed the spell. Give the variation enough shape that you can recognise it later.');
    const spell=activeSpell(); spell.variations.push({ id:uid('variation'), ether:app.pendingEther, response:text, created:now() }); spell.updated=now(); app.pendingEther=null; scheduleSave();
    renderVariationSaved(spell);
  }

  function renderVariationSaved(spell) {
    setPrompt('Your spell has a new variation. Return to the book, disturb it again, or craft a different spell.', `<button class="button button-subtle" id="bookAfterVariation">Spell book</button><button class="button button-secondary" id="againAfterVariation">Disturb again</button><button class="button button-primary" id="newAfterVariation">Craft another spell</button>`);
    transition(()=>{ el.stage.innerHTML=`<div class="scene narrow"><p class="kicker">Variation saved</p><h2 class="title" style="font-size:clamp(40px,6vw,72px)">${esc(spell.name)}</h2><div class="form-card" style="margin-top:28px;text-align:left"><p class="kicker">${esc(spell.variations.at(-1).ether.text)}</p><p style="font-size:16px;line-height:1.55;margin:0">${esc(spell.variations.at(-1).response)}</p></div></div>`;
      $('#bookAfterVariation').addEventListener('click',()=>openDrawer('book'));
      $('#againAfterVariation').addEventListener('click',renderEther);
      $('#newAfterVariation').addEventListener('click',beginSpell);
    });
  }

  function canContinue(text,min) { return String(text||'').trim().length >= Number(min); }

  function softNudge(buttonId,message) {
    const button=document.getElementById(buttonId); const stage=button?.closest('.scene'); if(!stage) return;
    const existing=stage.querySelector('.soft-nudge') || (()=>{const p=document.createElement('p');p.className='soft-nudge';p.style.cssText='margin:18px auto 0;color:var(--muted);font:12px/1.45 Arial,Helvetica,sans-serif';stage.appendChild(p);return p;})();
    existing.textContent=message; button.classList.add('is-jiggling'); setTimeout(()=>button.classList.remove('is-jiggling'),280);
  }

  function renameSession() {
    const s=activeSession(); const value=window.prompt('Name this spell book', s.name || 'Untitled spell book'); if(value===null) return; s.name=value.trim() || 'Untitled spell book'; scheduleSave(); renderBook(); closeDrawers();
  }

  function openSessions() { closeDrawers(); renderSessions(); openModal('sessionsModal'); }
  function renderSessions() {
    el.sessionsList.innerHTML=app.workspace.sessions.map(s=>`<div class="session-row"><div><strong>${esc(s.name)}</strong><small>${s.spells.length} spell${s.spells.length===1?'':'s'}</small></div><div class="session-actions"><button data-open-session="${esc(s.id)}">Open</button><button data-duplicate-session="${esc(s.id)}">Duplicate</button><button data-delete-session="${esc(s.id)}">Delete</button></div></div>`).join('');
    $$('[data-open-session]').forEach(b=>b.addEventListener('click',()=>{app.workspace.activeId=b.dataset.openSession; save(); closeModal('sessionsModal'); renderWelcome();}));
    $$('[data-duplicate-session]').forEach(b=>b.addEventListener('click',()=>{const source=app.workspace.sessions.find(x=>x.id===b.dataset.duplicateSession); const copy=JSON.parse(JSON.stringify(source)); copy.id=uid('session'); copy.name=source.name+' copy'; copy.spells.forEach(sp=>{sp.id=uid('spell');sp.variations.forEach(v=>v.id=uid('variation'));}); app.workspace.sessions.push(copy); app.workspace.activeId=copy.id; save(); renderSessions();}));
    $$('[data-delete-session]').forEach(b=>b.addEventListener('click',()=>{if(app.workspace.sessions.length===1) return; if(!confirm('Delete this spell book?')) return; app.workspace.sessions=app.workspace.sessions.filter(x=>x.id!==b.dataset.deleteSession); if(!app.workspace.sessions.some(x=>x.id===app.workspace.activeId)) app.workspace.activeId=app.workspace.sessions[0].id; save(); renderSessions(); renderWelcome();}));
  }

  function exportWorkspace() {
    save(); const blob=new Blob([JSON.stringify(app.workspace,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='enchantment-spell-book.json'; a.click(); URL.revokeObjectURL(a.href);
  }

  function importWorkspace() { el.importInput.click(); }
  el.importInput.addEventListener('change', async e=>{ const file=e.target.files?.[0]; if(!file) return; try { const json=JSON.parse(await file.text()); const data=normaliseWorkspace(json); if(!data) throw new Error('Invalid spell book'); app.workspace=data; save(); closeDrawers(); renderWelcome(); } catch (_) { alert('That file does not look like an Enchantment spell book.'); } e.target.value=''; });

  function printRecord() {
    const s=activeSession();
    const rows=s.spells.map((sp,i)=>`<article><h2>${i+1}. ${esc(sp.name)}</h2><p><strong>Enchantment:</strong> ${esc(sp.desire.name)} + ${esc(sp.power.name)}</p><p><strong>Context:</strong> ${esc((INGREDIENTS.find(x=>x.id===sp.ingredient?.type)||{}).label||'')}</p><p><strong>Idea:</strong> ${esc(sp.idea)}</p>${sp.variations.map(v=>`<p><strong>Ether:</strong> ${esc(v.ether.text)}<br><strong>Variation:</strong> ${esc(v.response)}</p>`).join('')}</article>`).join('');
    const html=`<!doctype html><html><head><title>${esc(s.name)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;line-height:1.55}h1{font:400 38px Georgia,serif}h2{font:400 24px Georgia,serif;border-top:1px solid #ccc;padding-top:20px}small{color:#666}article{break-inside:avoid}</style></head><body><small>ENCHANTMENT SPELL BOOK</small><h1>${esc(s.name)}</h1><p><strong>Quandary:</strong> ${esc(s.interaction)}</p><p><strong>Ingredients:</strong> ${s.ingredients.map(i=>esc((INGREDIENTS.find(x=>x.id===i.type)||{}).label||i.label)).join(' · ')}</p>${rows || '<p>No spells yet.</p>'}</body></html>`;
    const w=window.open('','_blank'); if(!w) return; w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(),250);
  }

  function init() {
    try { app.workspace=normaliseWorkspace(JSON.parse(localStorage.getItem(STORAGE_KEY))) || defaultWorkspace(); } catch (_) { app.workspace=defaultWorkspace(); }
    $('#menuButton').addEventListener('click',()=>openDrawer('tools'));
    $('#bookButton').addEventListener('click',()=>openDrawer('book'));
    $('#closeTools').addEventListener('click',closeDrawers);
    $('#closeBook').addEventListener('click',closeDrawers);
    $('#renameSession').addEventListener('click',renameSession);
    $('#sessionsButton').addEventListener('click',openSessions);
    $('#exportButton').addEventListener('click',exportWorkspace);
    $('#importButton').addEventListener('click',importWorkspace);
    $('#printButton').addEventListener('click',printRecord);
    $('#helpButton').addEventListener('click',()=>{closeDrawers();openModal('helpModal');});
    $('#newSessionButton').addEventListener('click',()=>{const name=window.prompt('Name this spell book','Untitled spell book'); if(name===null) return; const s=blankSession(name.trim()||'Untitled spell book'); app.workspace.sessions.push(s); app.workspace.activeId=s.id; save(); closeModal('sessionsModal'); renderWelcome();});
    $$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.closeModal)));
    $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m) closeModal(m.id);}));
    renderWelcome(); renderBook();
  }

  init();
})();
