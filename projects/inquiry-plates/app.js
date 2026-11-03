/* Inquiry Plates v4 — composed plate + independently adjustable anatomy.
   All authored content lives in plates.json. No persistence, tracking or user data. */
(() => {
  'use strict';
  const ROLES = ['focus','action','opening'];
  const MODES = ['discovery','concept'];
  const $ = id => document.getElementById(id);
  const stage = $('plate-stage');
  const intro = $('intro');
  const examination = $('examination');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let library, mode = 'discovery', plate = null, anatomy = {}, varied = new Set();
  let currentOpen = null, rendering = false, sequence = 0, raf = 0;
  const plateQueues = { discovery:[], concept:[] };
  const lastPlate = {discovery:null,concept:null};
  const moduleQueues = { discovery:{},concept:{} };
  const lastModule = { discovery:{},concept:{} };

  function shuffle(items, avoid) {
    const result = [...items];
    for (let i=result.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    if (result.length>1 && result[0]===avoid) [result[0],result[1]]=[result[1],result[0]];
    return result;
  }
  function check(data) {
    if (!data || data.schemaVersion!==1 || !Array.isArray(data.plates) || !data.modules) throw Error('Unsupported or incomplete plates.json.');
    const ids=new Set();
    const tag=/{(focus|action|opening)\|([^{}]+)}/g;
    for(const p of data.plates){
      if(typeof p.id!=='string'||!p.id.trim()||ids.has(p.id)) throw Error('Missing or duplicate plate ID.');
      ids.add(p.id);
      if(!MODES.includes(p.mode)||typeof p.statement!=='string') throw Error(`Invalid mode or statement: ${p.id}`);
      const found=[...p.statement.matchAll(tag)].map(m=>m[1]);
      if(found.length!==3 || ROLES.some(r=>found.filter(x=>x===r).length!==1)) throw Error(`Plate ${p.id}: mark exactly one {focus|...}, {action|...} and {opening|...} in the statement.`);
      for(const r of ROLES){if(typeof p.annotations?.[r]?.label!=='string'||!p.annotations[r].label.trim()||!Array.isArray(p.annotations[r].questions)||!p.annotations[r].questions.length||p.annotations[r].questions.some(q=>typeof q!=='string'||!q.trim())) throw Error(`Incomplete ${r} annotation in ${p.id}.`);}
    }
    for(const m of MODES){
      if(!data.plates.some(p=>p.mode===m)) throw Error(`No ${m} plates.`);
      for(const r of ROLES){const entries=data.modules[m]?.[r]; if(!Array.isArray(entries)||!entries.length||entries.some(e=>typeof e.id!=='string'||typeof e.label!=='string'||!e.label.trim()||!Array.isArray(e.questions)||!e.questions.length||e.questions.some(q=>typeof q!=='string'||!q.trim()))) throw Error(`Incomplete ${m}/${r} module bank.`);}
    }
  }
  function nextPlate(){
    const pool=library.plates.filter(p=>p.mode===mode);
    if(!plateQueues[mode].length) plateQueues[mode]=shuffle(pool,lastPlate[mode]);
    plate=plateQueues[mode].shift();lastPlate[mode]=plate;
    anatomy=Object.fromEntries(ROLES.map(r=>[r,plate.annotations[r]]));varied.clear();closeNotes();
    render();
  }
  function nextModule(role){
    const pool=library.modules[mode][role];
    if(!moduleQueues[mode][role]?.length) moduleQueues[mode][role]=shuffle(pool,lastModule[mode][role]);
    let entry=moduleQueues[mode][role].shift();
    // Avoid replacing a phrase with the same visible value where possible.
    if(pool.length>1 && entry.label===anatomy[role].label){
      if(!moduleQueues[mode][role].length) moduleQueues[mode][role]=shuffle(pool,entry);
      const alternate=moduleQueues[mode][role].shift(); moduleQueues[mode][role].unshift(entry);entry=alternate;
    }
    lastModule[mode][role]=entry;
    anatomy[role]=entry;varied.add(role);
  }
  function renderStatement(){
    const h=$('statement');h.replaceChildren();
    const pattern=/{(focus|action|opening)\|([^{}]+)}/g;
    let offset=0, match;
    while((match=pattern.exec(plate.statement))!==null){
      h.append(document.createTextNode(plate.statement.slice(offset,match.index)));
      const btn=document.createElement('button');btn.type='button';btn.className='annotated';btn.dataset.role=match[1];btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls',`details-${match[1]}`);btn.textContent=match[2];
      btn.addEventListener('click',()=>toggleNote(match[1]));h.append(btn);
      offset=pattern.lastIndex;
    }
    h.append(document.createTextNode(plate.statement.slice(offset)));
  }
  function render(){
    $('plate-id').textContent=plate.id;
    $('plate-identity').textContent=`${mode==='discovery'?'DISCOVERY':'CONCEPT INQUIRY'} / ${plate.id}`;
    for(const btn of document.querySelectorAll('[data-mode]'))btn.setAttribute('aria-pressed',String(btn.dataset.mode===mode));
    renderStatement();renderAnatomy();
  }
  function renderAnatomy(){
    $('anatomy-status').textContent=varied.size?'/ VARIATION':'/ ORIGINAL';
    $('restore').hidden=!varied.size;
    for(const role of ROLES){
      const note=document.querySelector(`.anatomy-note[data-role="${role}"]`);
      note.classList.toggle('is-varied',varied.has(role));
      $('value-'+role).textContent=anatomy[role].label;
      const list=$('questions-'+role);list.replaceChildren();
      for(const question of anatomy[role].questions){const li=document.createElement('li');li.textContent=question;list.append(li);}
    }
    reflectOpen();scheduleLines();
  }
  function closeNotes(){currentOpen=null;reflectOpen();}
  function reflectOpen(){
    for(const role of ROLES){
      const selected=currentOpen===role;
      const note=document.querySelector(`.anatomy-note[data-role="${role}"]`);
      note.classList.toggle('is-active',selected);
      const button=note.querySelector('.anatomy-trigger');button.setAttribute('aria-expanded',String(selected));
      $('details-'+role).hidden=!selected;
      const phrase=document.querySelector(`.annotated[data-role="${role}"]`);
      if(phrase){phrase.classList.toggle('selected',selected);phrase.setAttribute('aria-expanded',String(selected));}
    }
    scheduleLines();
  }
  function toggleNote(role){currentOpen=currentOpen===role?null:role;reflectOpen();}
  function changeWithFade(fn){
    if(rendering)return;
    rendering=true;const id=++sequence;
    if(media.matches){fn();rendering=false;return;}
    stage.classList.add('is-fading');
    setTimeout(()=>{
      if(id!==sequence)return;
      fn();requestAnimationFrame(()=>{stage.classList.remove('is-fading');rendering=false;scheduleLines();});
    },190);
  }
  function start(){
    if(!library)return;
    mode=document.querySelector('input[name="intro-mode"]:checked').value;
    intro.hidden=true;examination.hidden=false;$('restart').hidden=false;
    nextPlate();
    if(!media.matches){stage.classList.add('is-fading');requestAnimationFrame(()=>requestAnimationFrame(()=>stage.classList.remove('is-fading')));}
    $('new-plate').focus({preventScroll:true});
  }
  function restart(){++sequence;rendering=false;stage.classList.remove('is-fading');examination.hidden=true;intro.hidden=false;$('restart').hidden=true;$('begin').focus({preventScroll:true});}
  function changeMode(newMode){if(newMode===mode)return;changeWithFade(()=>{mode=newMode;nextPlate();});}
  function restore(){changeWithFade(()=>{anatomy=Object.fromEntries(ROLES.map(r=>[r,plate.annotations[r]]));varied.clear();closeNotes();renderAnatomy();});}
  function scheduleLines(){cancelAnimationFrame(raf);raf=requestAnimationFrame(drawLines);}
  function drawLines(){
    const svg=$('leader-layer');svg.replaceChildren();
    if(examination.hidden||window.innerWidth<=740)return;
    const stageRect=stage.getBoundingClientRect();
    const svgNS='http://www.w3.org/2000/svg';
    for(const role of ROLES){
      const phrase=document.querySelector(`.annotated[data-role="${role}"]`);
      const note=document.querySelector(`.anatomy-note[data-role="${role}"]`);
      if(!phrase||!note)continue;
      const segments=[...phrase.getClientRects()].filter(r=>r.width>0);
      if(!segments.length)continue;
      // Start at the RIGHT EDGE of the underlined annotated phrase, BELOW the glyphs.
      // Then run in the whitespace between the two columns. No connector crosses letterforms.
      const segment=segments[segments.length-1];
      const sx=segment.right-stageRect.left+1, sy=segment.bottom-stageRect.top+5;
      const nr=note.getBoundingClientRect();
      const ex=nr.left-stageRect.left-5, ey=nr.top-stageRect.top+34;
      const channel=Math.min(ex-13,Math.max(sx+13,(document.querySelector('.plate-left').getBoundingClientRect().right-stageRect.left+ex)/2));
      if(channel<=sx||ex<=sx)continue;
      const path=document.createElementNS(svgNS,'path');
      path.setAttribute('d',`M ${sx} ${sy} H ${channel} V ${ey} H ${ex}`);
      if(role===currentOpen)path.classList.add('active');
      if(varied.has(role))path.classList.add('varied');
      svg.append(path);
      const end=document.createElementNS(svgNS,'circle');end.setAttribute('cx',ex);end.setAttribute('cy',ey);end.setAttribute('r','2');svg.append(end);
    }
  }
  $('begin').addEventListener('click',start);
  $('restart').addEventListener('click',restart);
  $('new-plate').addEventListener('click',()=>changeWithFade(nextPlate));
  $('reshuffle').addEventListener('click',()=>changeWithFade(()=>{ROLES.forEach(nextModule);closeNotes();renderAnatomy();}));
  $('restore').addEventListener('click',restore);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
  document.querySelectorAll('.anatomy-trigger').forEach(b=>b.addEventListener('click',()=>toggleNote(b.dataset.role)));
  document.querySelectorAll('[data-shuffle]').forEach(b=>b.addEventListener('click',()=>changeWithFade(()=>{nextModule(b.dataset.shuffle);closeNotes();renderAnatomy();})));
  window.addEventListener('resize',scheduleLines,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(scheduleLines).observe(stage);
  if(document.fonts)document.fonts.ready.then(scheduleLines);
  fetch('plates.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(`Could not load plates.json (${r.status}).`);return r.json();}).then(data=>{check(data);library=data;$('begin').disabled=false;}).catch(error=>{$('begin').disabled=true;$('load-status').hidden=false;$('load-status').textContent=`Plate library unavailable: ${error.message} Open this folder using a local web server rather than file://. See README.md.`;console.error('[Inquiry Plates]',error);});
  $('begin').disabled=true;
})();
