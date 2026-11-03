/* Probe Anatomy: one-page client-side instrument.
   No network requests, user-input collection, analytics, or persistent storage. */
(() => {
  'use strict';
  const bank = window.PROVOCATIONS;
  const roles = ['focus', 'action', 'opening'];
  const modeButtons = [...document.querySelectorAll('.mode')];
  const stage = document.getElementById('anatomy-stage');
  const statement = document.getElementById('statement');
  const svg = document.getElementById('connectors');
  const about = document.getElementById('about-panel');
  const descriptions = {discovery:'Look beyond what is already visible.', concept:'Interrogate the premise beneath your idea.'};
  let mode = 'discovery', current = null, active = null;
  const queues = {discovery: [], concept: []};
  let previous = {discovery: null, concept: null};
  const svgNS = 'http://www.w3.org/2000/svg';

  function shuffled(size, exclude) {
    const items = Array.from({length:size},(_,i)=>i);
    for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    if(items.length>1 && items[0]===exclude){const index=items.findIndex(v=>v!==exclude);[items[0],items[index]]=[items[index],items[0]];}
    return items;
  }
  function next() {
    if(!queues[mode].length) queues[mode]=shuffled(bank[mode].length,previous[mode]);
    const index=queues[mode].shift();
    previous[mode]=index;
    current=bank[mode][index];
    active=null;
    render();
  }
  function parseParts(source) {
    const token=/\{(focus|action|opening)\|([^{}]+)\}/g;
    const fragment=document.createDocumentFragment();
    let last=0, match, found=[];
    while((match=token.exec(source))!==null){
      fragment.append(document.createTextNode(source.slice(last,match.index)));
      const button=document.createElement('button');
      button.type='button';button.className='phrase';button.dataset.role=match[1];
      button.textContent=match[2];button.setAttribute('aria-label',`${match[2]} — ${match[1] === 'focus'?'Look at':match[1] === 'action'?'Invite':'Question'}`);
      button.addEventListener('click',()=>select(match[1]));
      fragment.append(button);found.push(match[1]);last=token.lastIndex;
    }
    fragment.append(document.createTextNode(source.slice(last)));
    if(roles.some(r=>found.filter(f=>f===r).length!==1)) console.warn('Malformed anatomy:',source);
    return fragment;
  }
  function render() {
    document.getElementById('specimen-no').textContent=current.id.replace(/(D|C)(\d+)/,'$1—$2');
    statement.replaceChildren(parseParts(current.text));
    roles.forEach(role=>{
      document.getElementById(role+'-label').textContent=current[role][0];
      document.getElementById(role+'-nudge').textContent=current[role][1];
    });
    document.getElementById('mode-description').textContent=descriptions[mode];
    modeButtons.forEach(b=>{let on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    select(null);
  }
  function select(role){
    active=active===role?null:role;
    stage.classList.toggle('has-selection',Boolean(active));
    roles.forEach(r=>{
      stage.querySelector(`.annotation[data-role="${r}"]`).classList.toggle('selected',active===r);
      const phrase=statement.querySelector(`.phrase[data-role="${r}"]`);
      if(phrase)phrase.classList.toggle('selected',active===r);
      const trigger=stage.querySelector(`.annotation-trigger[data-role="${r}"]`);
      trigger.setAttribute('aria-pressed',String(active===r));
    });
    drawConnectors();
  }
  function drawConnectors(){
    svg.replaceChildren();
    if(window.matchMedia('(max-width:950px)').matches)return;
    const stageRect=stage.getBoundingClientRect();
    const stagePoint=(rect,x,y)=>({x:rect.left-stageRect.left+rect.width*x,y:rect.top-stageRect.top+rect.height*y});
    roles.forEach(role=>{
      const phrase=statement.querySelector(`.phrase[data-role="${role}"]`);
      const note=stage.querySelector(`.annotation[data-role="${role}"]`);
      if(!phrase||!note)return;
      const rects=phrase.getClientRects();
      // The first visual fragment provides a stable anchor for wrapped phrases.
      const word=stagePoint(rects[0],.5,role==='opening'?1:0);
      const nr=note.getBoundingClientRect();
      const side=role==='focus'?'left':'right';
      const anchor=stagePoint(nr,side==='left'?1:0,.40);
      const elbowX=side==='left'?anchor.x+23:anchor.x-23;
      const path=document.createElementNS(svgNS,'path');
      path.setAttribute('d',`M ${word.x} ${word.y} L ${word.x} ${role==='opening'?word.y+22:word.y-22} L ${elbowX} ${role==='opening'?word.y+22:word.y-22} L ${elbowX} ${anchor.y} L ${anchor.x} ${anchor.y}`);
      if(active===role)path.classList.add('active');
      svg.append(path);
      const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('cx',word.x);dot.setAttribute('cy',word.y);dot.setAttribute('r',active===role?'3.5':'2.4');svg.append(dot);
    });
  }
  modeButtons.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode!==mode){mode=b.dataset.mode;next();}}));
  stage.querySelectorAll('.annotation-trigger').forEach(b=>b.addEventListener('click',()=>select(b.dataset.role)));
  document.getElementById('next').addEventListener('click',next);
  document.getElementById('about-toggle').addEventListener('click',e=>{about.hidden=!about.hidden;e.currentTarget.setAttribute('aria-expanded',String(!about.hidden));});
  let frame=0;
  const scheduleDraw=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(drawConnectors);};
  window.addEventListener('resize',scheduleDraw,{passive:true});
  if(document.fonts)document.fonts.ready.then(scheduleDraw);
  if('ResizeObserver' in window)new ResizeObserver(scheduleDraw).observe(stage);
  if(!bank || !Array.isArray(bank.discovery) || !Array.isArray(bank.concept)){
    statement.textContent='The provocation library could not be loaded.';
    document.getElementById('next').disabled=true;
    return;
  }
  next();
})();
