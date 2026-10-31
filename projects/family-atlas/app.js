import {radialAtlas, lineageDetail, parentageUnits} from './radial-layout.js';
/* Family Atlas v0.7: radial descendant display, contextual lineage, local-first records. */
const $=s=>document.querySelector(s), svgNS='http://www.w3.org/2000/svg';
const uid=()=>crypto.randomUUID();
const blank=()=>({schemaVersion:'0.2',collection:{id:uid(),title:'My family atlas'},people:[],relationships:[],sources:[],assertions:[],identityMappings:[],importHistory:[]});
const KEY='family-atlas-v02';
let data,selected=null,focus=null,focusBack=[],focusUp=2,focusDown=2,importCandidate=null,importChoices={};
let route=null; // Shortest recorded path between two people, not a genealogical inference.
let viewMode='atlas';
let zoom=1,pan={x:80,y:80},coords=new Map(),graphBounds={x:0,y:0,w:1,h:1},drag=null,preventClick=false;
const deep=x=>JSON.parse(JSON.stringify(x));
const ensure=d=>{const c=blank();if(!d||!Array.isArray(d.people)||!Array.isArray(d.relationships))throw Error('Not a valid Family Atlas collection');return {...c,...d,collection:{...c.collection,...(d.collection||{})},people:d.people.map(p=>({...p,id:p.id||uid()})),relationships:d.relationships.map(r=>({...r,id:r.id||uid()})),sources:d.sources||[],assertions:d.assertions||[],identityMappings:d.identityMappings||[],importHistory:d.importHistory||[]};};
try{data=ensure(JSON.parse(localStorage.getItem(KEY)));}catch{data=blank();}
const save=()=>{route=null;data.collection.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notice('Browser storage is full. Export your archive.');}render();};
const person=id=>data.people.find(p=>p.id===id);
const label=p=>(p?.nameStatus==='unknown'||!p?.name)?'Unknown person':p.name;
const related=(r,id)=>r.from===id?r.to:r.to===id?r.from:null;
const relKind=r=>r.type==='marriage'?'partnership':r.type;
const relKey=r=>{const t=relKind(r),a=[r.from,r.to];return ['sibling','partnership','other'].includes(t)?`${t}|${a.sort().join('|')}`:`${t}|${r.from}|${r.to}`;};
const sameRel=(a,b)=>relKey(a)===relKey(b);
const near=(id)=>{const dist=new Map([[id,0]]),q=[id];while(q.length){const a=q.shift();for(const r of data.relationships){const b=related(r,a);if(b&&!dist.has(b)){dist.set(b,dist.get(a)+1);q.push(b);}}}return dist;};
const types={parentage:'Parent',sibling:'Sibling',partnership:'Partner',guardian:'Guardian',other:'Other family connection'};
function describe(r,id){if(r.type==='parentage')return r.from===id?'Child':'Parent';if(r.type==='guardian')return r.from===id?'Person under guardianship':'Guardian';if(r.type==='partnership'){const st=r.status&&r.status!=='current'?` (${r.status})`:'';return (r.classification==='married'?'Spouse':'Partner')+st;}return types[r.type]||r.type;}
function addRel(type,a,b,extra={}){if(a===b)return false;const r={id:uid(),type,from:a,to:b,...extra};const prior=data.relationships.find(q=>sameRel(q,r));if(prior){if(type==='parentage'&&extra.roles)prior.roles=[...new Set([...(prior.roles||[]),...extra.roles])];return false;}if(type==='parentage'&&wouldCycle(data.relationships,a,b))return false;data.relationships.push(r);return true;}
function wouldCycle(rels,parentId,childId){const stack=[childId],seen=new Set();while(stack.length){const id=stack.pop();if(id===parentId)return true;if(seen.has(id))continue;seen.add(id);for(const r of rels)if(r.type==='parentage'&&r.from===id)stack.push(r.to);}return false;}
function notice(msg){$('#toast').textContent=msg;$('#toast').style.display='block';clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('#toast').style.display='none',3200);}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function modal(title,html,bind){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden');bind?.($('#modalBody'));}
function closeModal(){$('#modal').classList.add('hidden');$('#modalBody').innerHTML='';}
$('#modalClose').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
const download=(obj,name,type='application/json')=>{const blob=new Blob([typeof obj==='string'?obj:JSON.stringify(obj,null,2)],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);};
function backup(){download(data,`family-atlas-${new Date().toISOString().slice(0,10)}.json`);localStorage.setItem(KEY+'-lastbackup',String(Date.now()));}
function newPerson(anchor=null,relation=null){modal('Add person',`<p class="muted">${anchor?'Expand the family of '+escapeHtml(label(person(anchor))):'Create a new, independent person'}</p>${anchor?quickType(relation):''}<div class="field"><label>Name</label><input id="newName" autofocus placeholder="Enter a name"></div><label class="row"><input id="unknown" type="checkbox"> Name unknown</label><p class="hint">More information can be added later. No dates or life status are required.</p><div class="row spread"><button id="cancel">Cancel</button><button class="primary" id="makePerson">${anchor?'Add to family':'Create person'}</button></div>`,root=>{if(anchor)bindTypeButtons(root);root.querySelector('#unknown').onchange=e=>{root.querySelector('#newName').disabled=e.target.checked;};root.querySelector('#cancel').onclick=closeModal;root.querySelector('#makePerson').onclick=()=>{const unknown=root.querySelector('#unknown').checked,name=root.querySelector('#newName').value.trim(),type=root.querySelector('.typeBtn.selectedChoice')?.dataset.type||relation;if(!unknown&&!name)return notice('Enter a name or select Name unknown');const id=uid();data.people.push({id,name:unknown?'':name,nameStatus:unknown?'unknown':'known',lifeStatus:'unknown'});if(anchor&&type){const [from,to]=type==='parentage_parent'?[id,anchor]:type==='parentage_child'?[anchor,id]:[anchor,id];addRel(type.startsWith('parentage')?'parentage':type,from,to);}selected=id;viewMode='atlas';closeModal();save();fitPerson(id);};root.querySelector('#newName').focus();});}
const opts=[['parentage_parent','Parent'],['sibling','Sibling'],['parentage_child','Child'],['partnership','Partner'],['guardian','Guardian'],['other','Other']];
function quickType(selectedType='sibling'){return `<div class="field"><label>Relationship to selected person</label><div class="quick">${opts.map(([v,n])=>`<button type="button" class="typeBtn ${v===selectedType?'selectedChoice':''}" data-type="${v}">${n}</button>`).join('')}</div></div>`;}
function bindTypeButtons(root){root.querySelectorAll('.typeBtn').forEach(b=>b.onclick=()=>{root.querySelectorAll('.typeBtn').forEach(c=>c.classList.remove('selectedChoice'));b.classList.add('selectedChoice');});}
function editPerson(id){const p=person(id);if(!p)return;modal('Edit person',`<div class="field"><label>Name</label><input id="editName" value="${escapeHtml(p.name||'')}"></div><label class="row"><input id="editUnknown" type="checkbox" ${p.nameStatus==='unknown'?'checked':''}> Name unknown</label><div class="field"><label>Born (optional: YYYY, YYYY-MM or YYYY-MM-DD)</label><input id="editBirth" value="${escapeHtml(p.birth||'')}"></div><div class="field"><label>Died (optional)</label><input id="editDeath" value="${escapeHtml(p.death||'')}"></div><div class="field"><label>Life status</label><select id="editLife"><option value="unknown">Unknown</option><option value="living">Living</option><option value="deceased">Deceased</option></select></div><div class="field"><label>Notes</label><textarea id="editNotes">${escapeHtml(p.notes||'')}</textarea></div><div class="row spread"><button id="removePerson">Delete person</button><button id="savePerson" class="primary">Save changes</button></div>`,root=>{root.querySelector('#editLife').value=p.lifeStatus||'unknown';root.querySelector('#savePerson').onclick=()=>{const known=!root.querySelector('#editUnknown').checked,name=root.querySelector('#editName').value.trim();if(known&&!name)return notice('Enter a name or mark it unknown');Object.assign(p,{name:known?name:'',nameStatus:known?'known':'unknown',birth:root.querySelector('#editBirth').value.trim(),death:root.querySelector('#editDeath').value.trim(),lifeStatus:root.querySelector('#editLife').value,notes:root.querySelector('#editNotes').value});closeModal();save();};root.querySelector('#removePerson').onclick=()=>{if(!confirm(`Delete ${label(p)} and all their connections? Export a backup first if needed.`))return;data.people=data.people.filter(x=>x.id!==id);data.relationships=data.relationships.filter(r=>r.from!==id&&r.to!==id);selected=null;closeModal();save();};});}
function drawSide(){const side=$('#side');if(!selected||!person(selected)){side.classList.add('hidden');return;}const p=person(selected);side.classList.remove('hidden');const rels=data.relationships.filter(r=>related(r,p.id));side.innerHTML=`<div class="row spread"><h2>${escapeHtml(label(p))}</h2><button id="closeSide" aria-label="Close details">×</button></div><div class="row"><span class="pill">${escapeHtml(p.lifeStatus||'unknown')}</span>${p.birth?`<span class="pill">Born ${escapeHtml(p.birth)}</span>`:''}${p.death?`<span class="pill">Died ${escapeHtml(p.death)}</span>`:''}</div>${p.notes?`<p class="small">${escapeHtml(p.notes)}</p>`:''}<div class="horizontal" style="margin-top:13px"><button id="editPerson">Edit details</button><button id="focusHere">Family detail</button></div><div class="sep"></div><h3>Expand family</h3><p class="hint">Choose a relationship, then add someone directly.</p><div class="quick" id="expandQuick">${opts.map(([t,n])=>`<button data-type="${t}">+ ${n}</button>`).join('')}</div><p class="hint">Or connect to people already in this atlas:</p><button id="connectExisting">Connect existing people</button><h3>Relationships (${rels.length})</h3>${rels.length?rels.map(r=>`<div class="relationLine"><div><strong>${escapeHtml(label(person(related(r,p.id))))}</strong><div class="muted tiny">${escapeHtml(describe(r,p.id))}${r.roles?.length?' · '+escapeHtml(r.roles.join(', ')):''}</div></div><div class="row"><button data-rel-edit="${r.id}">Edit</button><button data-remove="${r.id}" title="Remove connection">Remove</button></div></div>`).join(''):'<p class="hint">No connections yet.</p>'}<div class="sep"></div><div class="small muted">${escapeHtml(p.sourceRefs?.length?'Imported sources: '+p.sourceRefs.length:'Local record')}${data.assertions.some(a=>a.personId===p.id)?' · Conflicting imported information retained':''}</div>`;side.querySelector('#closeSide').onclick=()=>{selected=null;drawSide();render();};side.querySelector('#editPerson').onclick=()=>editPerson(p.id);side.querySelector('#focusHere').onclick=()=>enterFocus(p.id);side.querySelectorAll('#expandQuick button').forEach(b=>b.onclick=()=>newPerson(p.id,b.dataset.type));side.querySelector('#connectExisting').onclick=()=>connectExisting(p.id);side.querySelectorAll('[data-rel-edit]').forEach(b=>b.onclick=()=>editRelationship(b.dataset.relEdit));side.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const r=data.relationships.find(x=>x.id===b.dataset.remove);if(confirm('Remove this relationship? The people will remain in the atlas.')){data.relationships=data.relationships.filter(x=>x!==r);save();}});}
function editRelationship(id){const r=data.relationships.find(x=>x.id===id);if(!r)return;const personA=person(r.from),personB=person(r.to);modal('Edit relationship',`<p><strong>${escapeHtml(label(personA))}</strong> — <strong>${escapeHtml(label(personB))}</strong></p><p class="hint">${escapeHtml(describe(r,r.from))}. Changing this connection does not remove either person.</p>${r.type==='partnership'?`<div class="field"><label>Classification</label><select id="relClass"><option value="partner">Partner</option><option value="married">Married</option></select></div><div class="field"><label>Relationship status</label><select id="relStatus">${['current','separated','divorced','former','ended by death','historical','unknown'].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><div class="field"><label>Start year/date (optional)</label><input id="relStart" value="${escapeHtml(r.start||'')}"></div><div class="field"><label>End year/date (optional)</label><input id="relEnd" value="${escapeHtml(r.end||'')}"></div>`:r.type==='parentage'?`<div class="field"><label>Parentage roles (select all applicable)</label>${['biological','adoptive','legal','foster'].map(role=>`<label class="row"><input type="checkbox" data-role="${role}" ${(r.roles||[]).includes(role)?'checked':''}> ${role}</label>`).join('')}</div><div class="field"><label>Parental role (optional)</label><select id="parentRole"><option value="">Unspecified</option><option value="mother">Mother</option><option value="father">Father</option><option value="other">Other</option></select></div>`:'<p class="hint">This connection is reciprocal where appropriate. To change its type, remove it and create the correct connection.</p>'}<div class="row spread"><button id="cancelRel">Cancel</button><button class="primary" id="saveRel">Save relationship</button></div>`,root=>{root.querySelector('#cancelRel').onclick=closeModal;if(r.type==='partnership'){root.querySelector('#relClass').value=r.classification||'partner';root.querySelector('#relStatus').value=r.status||'current';}if(r.type==='parentage')root.querySelector('#parentRole').value=r.parentRole||'';root.querySelector('#saveRel').onclick=()=>{if(r.type==='partnership')Object.assign(r,{classification:root.querySelector('#relClass').value,status:root.querySelector('#relStatus').value,start:root.querySelector('#relStart').value.trim(),end:root.querySelector('#relEnd').value.trim()});if(r.type==='parentage')Object.assign(r,{roles:[...root.querySelectorAll('[data-role]:checked')].map(n=>n.dataset.role),parentRole:root.querySelector('#parentRole').value});closeModal();save();};});}
function searchScore(query,text){query=query.toLowerCase().trim();text=text.toLowerCase();if(!query)return 0;if(text.includes(query))return 120-query.length+Math.max(0,25-text.indexOf(query));const a=query.split(/\s+/),b=text.split(/\s+/);let score=0;for(const q of a){let best=0;for(const word of b){if(word.startsWith(q))best=Math.max(best,65);else if(editDistance(q,word)<=Math.max(1,Math.floor(q.length*.3)))best=Math.max(best,35);}score+=best;}return score;}
function editDistance(a,b){if(Math.abs(a.length-b.length)>3)return 99;const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let old=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const prior=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,old+(a[i-1]===b[j-1]?0:1));old=prior;}}return prev[b.length];}
function connectExisting(id){const state={type:'sibling',choices:new Set(),search:''};const vicinity=near(id);modal('Connect existing people',`<div class="muted small">From <strong>${escapeHtml(label(person(id)))}</strong></div>${quickType('sibling')}<div class="field"><label>People nearby · select one or more</label><div id="nearList"></div></div><div class="field"><label>Find someone elsewhere in the atlas</label><input id="connectSearch" placeholder="Search names (tolerates spelling variations)"></div><div id="farList"></div><p class="hint" id="connectCount">No people selected</p><div class="row spread"><button id="cancel">Cancel</button><button id="commitConnect" class="primary">Connect selected</button></div>`,root=>{bindTypeButtons(root);root.querySelectorAll('.typeBtn').forEach(b=>b.onclick=()=>{root.querySelectorAll('.typeBtn').forEach(x=>x.classList.remove('selectedChoice'));b.classList.add('selectedChoice');state.type=b.dataset.type;drawLists();});root.querySelector('#cancel').onclick=closeModal;root.querySelector('#connectSearch').oninput=e=>{state.search=e.target.value;drawLists();};function item(p,dist){const v=state.type.startsWith('parentage')?'parentage':state.type;const [from,to]=state.type==='parentage_parent'?[p.id,id]:[id,p.id];const exists=data.relationships.some(r=>sameRel(r,{type:v,from,to}));return `<button class="personItem ${state.choices.has(p.id)?'active':''}" data-person="${p.id}" ${exists?'disabled':''}><input type="checkbox" tabindex="-1" ${state.choices.has(p.id)?'checked':''} ${exists?'disabled':''}><span><strong>${escapeHtml(label(p))}</strong><small>${exists?'Already connected':dist!==undefined?`Within ${dist} connection${dist===1?'':'s'}`:'Elsewhere'}${p.birth?' · Born '+escapeHtml(p.birth):''}</small></span></button>`;}
function drawLists(){const all=data.people.filter(p=>p.id!==id);const nearby=all.filter(p=>vicinity.has(p.id)&&vicinity.get(p.id)<=2).sort((a,b)=>vicinity.get(a.id)-vicinity.get(b.id)||label(a).localeCompare(label(b))).slice(0,16);root.querySelector('#nearList').innerHTML=nearby.length?nearby.map(p=>item(p,vicinity.get(p.id))).join(''):'<div class="hint">No nearby people yet. Search the collection below.</div>';const distant=state.search.trim()?all.map(p=>({p,score:searchScore(state.search,label(p))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20).map(x=>x.p):[];root.querySelector('#farList').innerHTML=distant.map(p=>item(p,vicinity.get(p.id))).join('')||(state.search?'<div class="noResults">No matches. Try another spelling.</div>':'');root.querySelector('#connectCount').textContent=state.choices.size+' selected';root.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{const pid=b.dataset.person;state.choices.has(pid)?state.choices.delete(pid):state.choices.add(pid);drawLists();});}
root.querySelector('#commitConnect').onclick=()=>{if(!state.choices.size)return notice('Select at least one person');const result=[];for(const pid of state.choices){const type=state.type.startsWith('parentage')?'parentage':state.type;const [a,b]=state.type==='parentage_parent'?[pid,id]:[id,pid];result.push({pid,success:addRel(type,a,b)});}if(result.some(r=>!r.success))notice('Some connections already existed or would create a parentage loop');closeModal();save();};drawLists();});}
// A relationship path is an undirected traversal of *recorded* connections.
// Keep directional semantics in the displayed step descriptions.
function shortestPath(start,goal){
  if(start===goal)return {ids:[start],edges:[]};
  const queue=[start],seen=new Set([start]),previous=new Map();
  for(let i=0;i<queue.length;i++){
    const at=queue[i];
    for(const r of data.relationships){
      const next=related(r,at);
      if(!next||seen.has(next))continue;
      seen.add(next);previous.set(next,{from:at,relationship:r});
      if(next===goal){const ids=[goal],edges=[];let cursor=goal;
        while(cursor!==start){const step=previous.get(cursor);ids.push(step.from);edges.push(step.relationship.id);cursor=step.from;}
        return {ids:ids.reverse(),edges:edges.reverse()};
      }
      queue.push(next);
    }
  }
  return null;
}
function routeDescription(r,a,b){
  if(r.type==='parentage')return r.from===a?'parent of':'child of';
  if(r.type==='guardian')return r.from===a?'guardian of':'under guardianship of';
  if(relKind(r)==='partnership')return r.status&&r.status!=='current' ? `${r.classification==='married'?'married':'partnered'} (${r.status}) with` : r.classification==='married'?'married to':'partner of';
  if(r.type==='sibling')return 'sibling of';
  return 'connected to';
}
function graphSubset(){
  if(route)return new Set(route.ids);
  if(!focus)return new Set(data.people.map(p=>p.id));
  const visible=new Set([focus]),walk=(direction,limit)=>{
    let front=[focus];
    for(let i=0;i<limit;i++){
      const next=[];
      for(const a of front)for(const r of data.relationships){
        if(r.type!=='parentage')continue;
        const b=direction==='up'&&r.to===a?r.from:direction==='down'&&r.from===a?r.to:null;
        if(b&&!visible.has(b)){visible.add(b);next.push(b);}
      }
      front=next;
    }
  };
  walk('up',focusUp);walk('down',focusDown);
  const keep=new Set(visible);
  for(const r of data.relationships){
    if(['partnership','sibling'].includes(relKind(r))){
      if(keep.has(r.from))visible.add(r.to);
      if(keep.has(r.to))visible.add(r.from);
    }
  }
  return visible;
}

// The data graph is authoritative; rings, junctions and sectors are generated display objects.
// No layout positions or implied partnership assumptions are stored in the archive.
function components(){
  const valid=new Set(data.people.map(p=>p.id)),visited=new Set(),groups=[];
  for(const p of data.people){if(visited.has(p.id))continue;
    const queue=[p.id],group=[];visited.add(p.id);
    for(let i=0;i<queue.length;i++){const id=queue[i];group.push(id);
      for(const r of data.relationships){const next=related(r,id);
        if(next&&valid.has(next)&&!visited.has(next)){visited.add(next);queue.push(next);}}
    }groups.push(group);
  }return groups.sort((a,b)=>b.length-a.length);
}
function svg(tag,attrs={},text){const n=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function updateViewControls(){
  document.querySelector('#detailBackBtn')?.classList.toggle('hidden',viewMode!=='detail');
}
function switchView(mode,reference=null){
  viewMode=mode==='detail'?'detail':'atlas';route=null;
  if(viewMode==='detail')focus=reference||selected||focus||data.people[0]?.id||null;
  renderGraph();fitAll();
}
const polarPoint=(cx,cy,r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
const midpoint=points=>({x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length});
const pointDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Radial grammar: spokes and concentric arcs; no arbitrary quadratic curves.
function polarData(p,comp){const x=p.x-comp.cx,y=p.y-comp.cy;return {a:Math.atan2(y,x),r:Math.hypot(x,y)};}
function arcStep(comp,r,a,b){
 const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
 if(Math.abs(delta)<.00001)return '';
 const q=polarPoint(comp.cx,comp.cy,r,b);
 return ` A${r} ${r} 0 0 ${delta>0?1:0} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
}
function ringPath(start,end,comp,trackRadius){
 const s=polarData(start,comp),e=polarData(end,comp),r=Math.max(12,trackRadius);
 const sp=polarPoint(comp.cx,comp.cy,r,s.a);
 return `M${start.x.toFixed(2)} ${start.y.toFixed(2)} L${sp.x.toFixed(2)} ${sp.y.toFixed(2)}`+
   arcStep(comp,r,s.a,e.a)+` L${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
// Reserve distinct circular tracks where unrelated arcs overlap.
// Coincident spokes at a shared parentage junction remain intentional.
function routeLanes(){
  const tracks=new Map(),spacing=14,tau=2*Math.PI;
  const norm=a=>(a%tau+tau)%tau;
  const span=(a,b,r)=>{
    a=norm(a);b=norm(b);
    const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
    const low=delta<0?a+delta:a,high=delta<0?a:a+delta;
    const margin=Math.min(.23,Math.max(.02,7/r));
    return [low-margin,high+margin];
  };
  const overlaps=(a,b)=>[-tau,0,tau].some(shift=>a[0]<b[1]+shift&&b[0]+shift<a[1]);
  return (comp,start,end,base,kind='parentage')=>{
    const key=comp.ids[0]+':'+kind,used=tracks.get(key)||[];
    for(let n=0;n<100;n++){
      const radius=base+(kind==='parentage'?(n%2?1:-1)*Math.ceil(n/2)*spacing:n*spacing);
      if(radius<18)continue;
      const region=span(polarData(start,comp).a,polarData(end,comp).a,radius);
      const entry=used.find(x=>Math.abs(x.radius-radius)<.1);
      if(!entry){used.push({radius,regions:[region]});tracks.set(key,used);return radius;}
      if(entry.regions.every(x=>!overlaps(x,region))){entry.regions.push(region);return radius;}
    }
    return base+used.length*spacing;
  };
}
const statusCodes={divorced:'DIV',separated:'SEP',former:'FRM',historical:'HIS','ended by death':'END'};
function statusCode(s){return statusCodes[String(s||'').toLowerCase()]||String(s||'').slice(0,3).toUpperCase();}
function meanAngle(pts,comp){
 const angles=pts.map(p=>polarData(p,comp).a);
 const sx=angles.reduce((v,a)=>v+Math.cos(a),0),sy=angles.reduce((v,a)=>v+Math.sin(a),0);
 return Math.abs(sx)+Math.abs(sy)<1e-6?angles[0]:Math.atan2(sy,sx);
}

function addLink(layer,d,kind,tip,active=false,extra=''){
  const line=svg('path',{d,class:`link ${kind}${active?' routeLink':''} ${extra}`.trim()});
  line.append(svg('title',{},tip));layer.append(line);return line;
}
function renderGraph(){
  updateViewControls();
  let ids,layout;
  if(viewMode==='detail'){
    ids=route?new Set(route.ids):graphSubset();
    layout=lineageDetail([...ids],data.relationships,id=>label(person(id)));
    coords=layout.positions;
  }else{
    layout=radialAtlas(data.people,data.relationships,id=>label(person(id)));
    coords=layout.positions;
    ids=new Set(coords.keys());
  }
  const es=$('#edges'),ns=$('#nodes');es.replaceChildren();ns.replaceChildren();
  const routeEdges=new Set(route?.edges||[]);
  if(viewMode==='atlas')for(const component of layout.components){
    const {cx,cy,rings,ids:members}=component;
    for(const ring of rings){
      es.append(svg('circle',{cx,cy,r:ring.radius,class:'generationRing'}));
    }
    // A connected network is not equivalent to a single named family.
    const tag=svg('g',{class:'clusterCaption'});
    tag.append(svg('rect',{x:cx-100,y:cy-component.radius-28,width:200,height:22,rx:2,class:'nameplate'}));
    tag.append(svg('text',{x:cx,y:cy-component.radius-13,'text-anchor':'middle'},`${members.length} ${members.length===1?'person':'people'} · ${rings.length} ${rings.length===1?'band':'bands'}`));
    es.append(tag);
  }
  const relevant=data.relationships.filter(r=>ids.has(r.from)&&ids.has(r.to));
  const parentRels=relevant.filter(r=>r.type==='parentage');
  const handledParents=new Set();
  const reserveLane=routeLanes();
  for(const u of parentageUnits([...ids],relevant)){
    const parents=u.parents.map(id=>coords.get(id)).filter(Boolean);
    const children=u.children.map(id=>coords.get(id)).filter(Boolean);
    if(!parents.length||!children.length)continue;
    const childMid=midpoint(children),parentMid=midpoint(parents);
    let j;
    if(viewMode==='atlas'){
      const comp=layout.components.find(c=>c.ids.includes(u.children[0]));
      const angle=meanAngle(children,comp);
      const parentR=Math.max(...parents.map(p=>polarData(p,comp).r));
      const childR=Math.min(...children.map(p=>polarData(p,comp).r));
      const corridor=childR-parentR;
      const jr=corridor>40?parentR+corridor*.52:Math.max(18,childR-55);
      j=polarPoint(comp.cx,comp.cy,jr,angle);
    }else j={x:childMid.x,y:(parentMid.y+childMid.y)/2};
    // Allocate a track for the full angular footprint of this parentage group.
    const unitComp=viewMode==='atlas'?layout.components.find(c=>c.ids.includes(u.children[0])):null;
    let unitLane=null;
    if(unitComp){
      const tau=2*Math.PI;
      const angles=[...parents,...children].map(p=>(polarData(p,unitComp).a%tau+tau)%tau).sort((a,b)=>a-b);
      let gap=-1,cut=0;
      for(let k=0;k<angles.length;k++){
        const next=k===angles.length-1?angles[0]+tau:angles[k+1];
        if(next-angles[k]>gap){gap=next-angles[k];cut=k;}
      }
      const start=polarPoint(unitComp.cx,unitComp.cy,1,angles[(cut+1)%angles.length]);
      const end=polarPoint(unitComp.cx,unitComp.cy,1,angles[cut]);
      unitLane=reserveLane(unitComp,start,end,polarData(j,unitComp).r,'parentage');
      j=polarPoint(unitComp.cx,unitComp.cy,unitLane,meanAngle(children,unitComp));
    }
    // Parentage junction is a renderer construct, not a marriage or an additional person.
    for(const id of u.parents){const a=coords.get(id);if(!a)continue;
      const highlighted=parentRels.some(r=>r.from===id&&u.children.includes(r.to)&&routeEdges.has(r.id));
      const comp=viewMode==='atlas'?layout.components.find(c=>c.ids.includes(id)):null;
      const path=comp?ringPath(a,j,comp,unitLane):`M${a.x} ${a.y+20} V${j.y} H${j.x}`;
      addLink(es,path,'parentage',`${label(person(id))}: recorded parentage`,highlighted);
    }
    for(const id of u.children){const b=coords.get(id);if(!b)continue;
      const highlighted=parentRels.some(r=>r.to===id&&u.parents.includes(r.from)&&routeEdges.has(r.id));
      const comp=viewMode==='atlas'?layout.components.find(c=>c.ids.includes(id)):null;
      const path=comp?ringPath(j,b,comp,unitLane):`M${j.x} ${j.y} H${b.x} V${b.y-20}`;
      addLink(es,path,'parentage',`Recorded child: ${label(person(id))}`,highlighted);
    }
    es.append(svg('circle',{cx:j.x,cy:j.y,r:3,class:'parentJunction'}));
    for(const r of parentRels)if(u.parents.includes(r.from)&&u.children.includes(r.to))handledParents.add(r.id);
  }
  // Sibling assertions are preserved in JSON but suppressed when two people share recorded parentage.
  const parentSets=new Map([...ids].map(id=>[id,new Set(parentRels.filter(r=>r.to===id).map(r=>r.from))]));
  for(const r of relevant){
    const a=coords.get(r.from),b=coords.get(r.to),kind=relKind(r),highlight=routeEdges.has(r.id);
    if(kind==='parentage'&&handledParents.has(r.id))continue;
    if(kind==='sibling'&&[...parentSets.get(r.from)].some(p=>parentSets.get(r.to).has(p))&&!highlight)continue;
    if(kind==='parentage'){
      const comp=layout.components?.find(c=>c.ids.includes(r.from));
      addLink(es,comp?ringPath(a,b,comp,reserveLane(comp,a,b,(polarData(a,comp).r+polarData(b,comp).r)/2,'parentage')):`M${a.x} ${a.y} L${b.x} ${b.y}`,kind,'Parentage connection',highlight);continue;
    }
    const gap=pointDist(a,b);
    const cross=viewMode==='atlas' && kind==='partnership' && gap>200;
    // Long cross-ring links stay subdued until their endpoint is selected or a route is traced.
    const shown=highlight||selected===r.from||selected===r.to;
    let d;
    if(viewMode==='atlas'){
      const comp=layout.components.find(c=>c.ids.includes(r.from));
      if(comp){
        const x=polarData(a,comp),y=polarData(b,comp);
        const preferred=kind==='partnership'?Math.max(x.r,y.r)+35:Math.max(30,Math.min(x.r,y.r)-26);
        const lane=reserveLane(comp,a,b,preferred,kind);
        d=ringPath(a,b,comp,lane);
      }else d=`M${a.x} ${a.y} L${b.x} ${b.y}`;
    }else d=`M${a.x} ${a.y} L${b.x} ${b.y}`;
    addLink(es,d,kind,`${label(person(r.from))} / ${label(person(r.to))}: ${routeDescription(r,r.from,r.to)}`,highlight,cross&&!shown?'crossQuiet':'');
    if(kind==='partnership'&&r.status&&r.status!=='current'&&r.status!=='unknown'&&(!cross||shown)){
      const code=statusCode(r.status);
      const x=(a.x+b.x)/2,y=(a.y+b.y)/2-14,w=Math.max(33,code.length*7+12);
      const g=svg('g',{class:'edgeStatus'});
      g.append(svg('rect',{x:x-w/2,y:y-10,width:w,height:20,rx:2}));
      g.append(svg('text',{x,y:y+3,'text-anchor':'middle'},code));
      g.append(svg('title',{},`Partnership status: ${r.status}`));es.append(g);
    }
  }
  for(const [id,pos] of coords){
    const p=person(id),name=label(p),deceased=p.lifeStatus==='deceased';
    const g=svg('g',{class:'personNode'+(selected===id?' selected':''),transform:`translate(${pos.x} ${pos.y})`,tabindex:'0',role:'button','aria-label':`${name}${deceased?', deceased':''}`});
    const display=name.length>27?name.slice(0,25)+'…':name;
    const plateWidth=Math.max(68,Math.min(226,display.length*7.4+25));
    g.append(svg('circle',{r:19,cx:0,cy:0}));
    g.append(svg('text',{x:0,y:4,'text-anchor':'middle',class:'initial'},p.nameStatus==='unknown'?'?':name.charAt(0).toUpperCase()));
    if(deceased){g.append(svg('rect',{x:11,y:-27,width:29,height:17,rx:2,class:'lifeMarker'}));g.append(svg('text',{x:25.5,y:-15,'text-anchor':'middle',class:'lifeMarkText'},'DEC'));}
    g.append(svg('rect',{x:-plateWidth/2,y:24,width:plateWidth,height:23,rx:2,class:'nameplate'}));
    g.append(svg('text',{x:0,y:40,'text-anchor':'middle'},display));
    g.append(svg('title',{},`${name}${deceased?' — Deceased':''}`));
    g.addEventListener('click',event=>{event.stopPropagation();if(!preventClick)selectPerson(id);});
    g.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();selectPerson(id);}});
    ns.append(g);
  }
  const positions=[...coords.values()],clusters=viewMode==='atlas'?layout.components:[];
  const minX=Math.min(...[...positions.map(p=>p.x-135),...clusters.map(c=>c.cx-c.radius-30),...(positions.length?[]:[0])]);
  const minY=Math.min(...[...positions.map(p=>p.y-80),...clusters.map(c=>c.cy-c.radius-40),...(positions.length?[]:[0])]);
  const maxX=Math.max(...[...positions.map(p=>p.x+135),...clusters.map(c=>c.cx+c.radius+30),...(positions.length?[]:[100])]);
  const maxY=Math.max(...[...positions.map(p=>p.y+85),...clusters.map(c=>c.cy+c.radius+35),...(positions.length?[]:[100])]);
  graphBounds={x:minX,y:minY,w:maxX-minX,h:maxY-minY};
  applyView();
  $('#status').textContent=`${ids.size} people · ${clusters.length||1} network${clusters.length===1?'':'s'} · Drag to pan · Scroll to zoom · DEC deceased`;
  renderFocusBar();
}
function applyView(){$('#world').setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);$('#stage').classList.toggle('overviewScale',zoom<.43);}
function fitAll(){const s=$('#stage'),w=s.clientWidth,h=s.clientHeight;if(!coords.size){zoom=1;pan={x:w/2,y:h/2};applyView();return;}zoom=Math.max(.06,Math.min(1.5,Math.min((w-95)/graphBounds.w,(h-110)/graphBounds.h)));pan={x:(w-graphBounds.w*zoom)/2-graphBounds.x*zoom,y:(h-graphBounds.h*zoom)/2-graphBounds.y*zoom};applyView();}
function fitPerson(id){const p=coords.get(id);if(!p){fitAll();return;}zoom=Math.max(.8,Math.min(1.15,zoom));pan={x:$('#stage').clientWidth*.5-p.x*zoom,y:$('#stage').clientHeight*.45-p.y*zoom};applyView();}
function zoomAt(scale,cx,cy){const nz=Math.max(.06,Math.min(3,zoom*scale)),r=nz/zoom;pan={x:cx-(cx-pan.x)*r,y:cy-(cy-pan.y)*r};zoom=nz;applyView();}
const atlas=$('#atlas');atlas.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.personNode'))return;drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};preventClick=false;atlas.setPointerCapture(e.pointerId);atlas.classList.add('dragging');});atlas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)preventClick=true;pan={x:drag.px+dx,y:drag.py+dy};applyView();});atlas.addEventListener('pointerup',()=>{drag=null;atlas.classList.remove('dragging');setTimeout(()=>preventClick=false,30);});atlas.addEventListener('wheel',e=>{e.preventDefault();const rect=atlas.getBoundingClientRect();zoomAt(e.deltaY<0?1.13:1/1.13,e.clientX-rect.left,e.clientY-rect.top);},{passive:false});atlas.addEventListener('click',e=>{if(!preventClick&&!e.target.closest('.personNode')){selected=null;drawSide();renderGraph();}});
function selectPerson(id){selected=id;drawSide();renderGraph();}
function enterFocus(id){if(!id)return notice('Select a person first');if(focus&&focus!==id)focusBack.push(focus);switchView('detail',id);}
function chooseRoute(){
  if(!data.people.length)return notice('Add people before tracing relationships');
  const start=selected||focus||data.people[0].id;
  modal('Trace relationship path',`<p class="hint">Find the shortest chain of recorded relationships between two people. The result is a path through the atlas, not an inferred kinship title.</p><div class="field"><label>From person</label><input id="routeFrom" placeholder="Search a starting person" autocomplete="off"><div id="fromResults" class="routeResults"></div></div><div class="field"><label>To person</label><input id="routeTo" placeholder="Search a destination person" autocomplete="off"><div id="toResults" class="routeResults"></div></div><div class="row spread"><button id="routeCancel">Cancel</button><button id="routeShow" class="primary">Trace path</button></div>`,root=>{
    const chosen={from:start,to:null};
    const setup=(which,inputId,listId)=>{
      const input=root.querySelector(inputId),results=root.querySelector(listId);
      input.value=which==='from'?label(person(start)):'';
      const draw=()=>{
        const q=input.value.trim();
        const ranked=data.people.map(p=>({p,score:searchScore(q,label(p))})).filter(x=>q?x.score>0:true).sort((a,b)=>b.score-a.score).slice(0,14);
        results.innerHTML=ranked.map(({p})=>`<button class="personItem" data-route-person="${p.id}"><span><strong>${escapeHtml(label(p))}</strong><small>${p.birth?'Born '+escapeHtml(p.birth):'Person in atlas'}</small></span></button>`).join('')||'<p class="hint">No matching people</p>';
        results.querySelectorAll('[data-route-person]').forEach(b=>b.onclick=()=>{chosen[which]=b.dataset.routePerson;input.value=label(person(chosen[which]));results.innerHTML='';});
      };
      input.oninput=()=>{chosen[which]=null;draw();};
      input.onfocus=draw;
    };
    setup('from','#routeFrom','#fromResults');setup('to','#routeTo','#toResults');
    root.querySelector('#routeCancel').onclick=closeModal;
    root.querySelector('#routeShow').onclick=()=>{
      if(!chosen.from||!chosen.to)return notice('Select both people from the search results');
      const result=shortestPath(chosen.from,chosen.to);
      if(!result)return notice('No recorded relationship path connects these people');
      route=result;viewMode="atlas";closeModal();renderGraph();fitAll();
    };
  });
}
function renderFocusBar(){
  document.querySelector('.focusbar')?.remove();
  if(!route&&viewMode==='atlas')return;
  const b=document.createElement('div');b.className='focusbar';
  if(route){
    b.innerHTML=`<strong>Path: ${escapeHtml(label(person(route.ids[0])))} → ${escapeHtml(label(person(route.ids.at(-1))))}</strong><span>${route.edges.length} connections</span><button id="routeDetails">View steps</button><button id="routeNew">Trace another</button><button id="routeExit">Clear path</button>`;
    $('#stage').append(b);b.querySelector('#routeNew').onclick=chooseRoute;
    b.querySelector('#routeExit').onclick=()=>{route=null;renderGraph();};
    b.querySelector('#routeDetails').onclick=showRouteSteps;return;
  }
  b.innerHTML=`<strong>Family detail: ${escapeHtml(label(person(focus)))}</strong><label>Ancestors <select id="upCount">${[0,1,2,3,4,5,6].map(x=>`<option value="${x}" ${x===focusUp?'selected':''}>${x}</option>`).join('')}</select></label><label>Descendants <select id="downCount">${[0,1,2,3,4,5,6].map(x=>`<option value="${x}" ${x===focusDown?'selected':''}>${x}</option>`).join('')}</select></label><button id="focusBack" ${!focusBack.length?'disabled':''}>Back</button>`;
  $('#stage').append(b);
  b.querySelector('#upCount').onchange=e=>{focusUp=+e.target.value;renderGraph();fitAll();};
  b.querySelector('#downCount').onchange=e=>{focusDown=+e.target.value;renderGraph();fitAll();};
  b.querySelector('#focusBack').onclick=()=>{focus=focusBack.pop();renderGraph();fitAll();};
}
function showRouteSteps(){
  if(!route)return;
  const lines=[];
  for(let i=0;i<route.edges.length;i++){
    const r=data.relationships.find(x=>x.id===route.edges[i]);
    lines.push(`<div class="routeStep"><strong>${escapeHtml(label(person(route.ids[i])))}</strong><span>${escapeHtml(routeDescription(r,route.ids[i],route.ids[i+1]))}</span><strong>${escapeHtml(label(person(route.ids[i+1])))}</strong></div>`);
  }
  modal('Recorded relationship path',`<p class="hint">This is the shortest recorded connection pathway. It may cross partnerships or social relationships and is not a determination of biological kinship.</p>${lines.join('')||'<p>These are the same person.</p>'}<button id="closeSteps">Return to path</button>`,root=>root.querySelector('#closeSteps').onclick=closeModal);
}
function render(){drawSide();renderGraph();$('#collectionTitle').textContent=data.collection.title||'Local collection';}
$('#detailBackBtn').onclick=()=>{focus=null;focusBack=[];switchView('atlas');};
$('#traceBtn').onclick=chooseRoute;$('#addBtn').onclick=()=>newPerson(selected,'sibling');$('#zoomFit').onclick=fitAll;$('#zoomIn').onclick=()=>zoomAt(1.2,$('#stage').clientWidth/2,$('#stage').clientHeight/2);$('#zoomOut').onclick=()=>zoomAt(1/1.2,$('#stage').clientWidth/2,$('#stage').clientHeight/2);
$('#searchBtn').onclick=()=>{modal('Find a person',`<div class="field"><label>Search by name</label><input id="globalSearch" placeholder="Search people…"></div><div id="searchResults"></div>`,root=>{const input=root.querySelector('input'),draw=()=>{const q=input.value.trim();root.querySelector('#searchResults').innerHTML=(q?data.people.map(p=>({p,score:searchScore(q,label(p))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25):data.people.map(p=>({p})).slice(0,25)).map(({p})=>`<button class="personItem" data-id="${p.id}"><span><strong>${escapeHtml(label(p))}</strong><small>${p.birth?'Born '+escapeHtml(p.birth):'Select to navigate'}</small></span></button>`).join('');root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(viewMode==='detail'&&!graphSubset().has(id)){focus=id;renderGraph();}
closeModal();selectPerson(id);fitPerson(id);});};input.oninput=draw;draw();input.focus();});};
$('#exportBtn').onclick=()=>modal('Export family atlas',`<p>JSON is the complete, portable archive. SVG exports the current graph view.</p><div class="stack"><button id="jsonExport">Download complete JSON archive</button><button id="svgExport">Download current graph as SVG</button></div>`,root=>{root.querySelector('#jsonExport').onclick=()=>{backup();closeModal();};root.querySelector('#svgExport').onclick=()=>{const x=$('#atlas').cloneNode(true);x.setAttribute('xmlns',svgNS);x.setAttribute('viewBox',`${graphBounds.x} ${graphBounds.y} ${graphBounds.w} ${graphBounds.h}`);x.removeAttribute('width');x.removeAttribute('height');x.querySelector('#world').setAttribute('transform','');const style=document.createElementNS(svgNS,'style');style.textContent='.generationRing{fill:none;stroke:#aaa;stroke-opacity:.45;stroke-width:1}.clusterCaption text{fill:#555;font:11px Arial}.clusterCaption .nameplate{fill:#fff;stroke:#bbb}.parentJunction{fill:#fff;stroke:#333;stroke-width:1.2}.link{fill:none;stroke:#888;stroke-width:1.5}.link.parentage{stroke:#333;stroke-width:1.7}.link.sibling{stroke:#aaa;stroke-width:1}.link.crossQuiet{stroke-opacity:.2}.link.partnership{stroke-dasharray:6 4}.link.guardian,.link.other,.link.sibling{stroke-dasharray:3 4}.personNode circle{fill:white;stroke:#222;stroke-width:1.5}.personNode text{fill:#111;font:12px Arial}.personNode .nameplate{fill:white;stroke:#bbb}.personNode .initial{font-weight:bold}.personNode .lifeMarker{fill:#222;stroke:#222}.personNode .lifeMarkText{fill:#fff;font-weight:bold;font-size:9px}.edgeStatus rect{fill:white;stroke:#777;stroke-width:.75}.edgeStatus text{fill:#222;font:bold 10px Arial}.link.routeLink{stroke:#111;stroke-width:3.5;stroke-dasharray:none}.componentCircle{fill:#fafafa;stroke:#222;stroke-width:1.5}.componentDot{fill:#555}.componentNode .nameplate{fill:#fff;stroke:#aaa}.componentName{fill:#111;font:bold 13px Arial}.componentCount{fill:#555;font:11px Arial}';x.prepend(style);download(new XMLSerializer().serializeToString(x),'family-atlas.svg','image/svg+xml');closeModal();};});
$('#importBtn').onclick=()=>{$('#fileInput').value='';$('#fileInput').click();};$('#fileInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=ensure(JSON.parse(await f.text()));if(d.people.length>5000)throw Error('File has too many people for this version');beginImport(d);}catch(err){modal('Import error',`<p>${escapeHtml(err.message)}</p>`);}};
function sourceKey(collectionId,recordId){return `${collectionId}::${recordId}`;}
function mappedId(collectionId,recordId){return data.identityMappings.find(m=>m.sourceKey===sourceKey(collectionId,recordId))?.personId||null;}
function beginImport(incoming){importCandidate=incoming;importChoices={};const currentIds=new Set(data.people.map(p=>p.id));const potential=incoming.people.filter(p=>!mappedId(incoming.collection.id,p.id));function scorePerson(p,q){if(p.nameStatus==='unknown'||q.nameStatus==='unknown')return 0;const a=label(p).toLowerCase(),b=label(q).toLowerCase();let s=searchScore(a,b);if(a===b)s+=40;if(p.birth&&q.birth&&p.birth.slice(0,4)===q.birth.slice(0,4))s+=35;for(const r of incoming.relationships.filter(r=>related(r,p.id))){const n=incoming.people.find(x=>x.id===related(r,p.id));if(n&&data.relationships.some(k=>related(k,q.id)&&label(person(related(k,q.id))).toLowerCase()===label(n).toLowerCase()))s+=15;}return s;}
const candidates=potential.map(p=>({p,matches:data.people.map(q=>({q,score:scorePerson(p,q)})).filter(x=>x.score>=35).sort((a,b)=>b.score-a.score).slice(0,5)})).filter(x=>x.matches.length);modal('Review imported family',`<p class="muted small">${incoming.people.length} people · ${incoming.relationships.length} connections · ${candidates.length} possible matches. No identities will be merged automatically.</p><div class="callout">Each match is your decision. Keeping records separate preserves both people. Confirming an identity retains the existing working fields and records imported alternatives.</div><div id="importMatches">${candidates.map(({p,matches})=>`<div class="matchCard"><strong>${escapeHtml(label(p))}${p.birth?' · '+escapeHtml(p.birth):''}</strong><small class="muted">Imported record</small><div class="field"><label>Possible match</label><select data-import="${p.id}"><option value="">Keep separate (default)</option>${matches.map(({q,score})=>`<option value="${q.id}">${escapeHtml(label(q))}${q.birth?' · '+escapeHtml(q.birth):''} — suggested match</option>`).join('')}</select></div></div>`).join('')||'<p>No likely duplicate people identified.</p>'}</div><div class="row spread"><button id="cancelImport">Cancel</button><button id="applyImport" class="primary">Review and add collection</button></div>`,root=>{root.querySelector('#cancelImport').onclick=closeModal;root.querySelector('#applyImport').onclick=()=>{root.querySelectorAll('[data-import]').forEach(s=>importChoices[s.dataset.import]=s.value);previewImport();};});}
function previewImport(){const imp=importCandidate;const mapped=imp.people.filter(p=>importChoices[p.id]||mappedId(imp.collection.id,p.id)).length;modal('Confirm import',`<p><strong>${imp.people.length-mapped} new people</strong> and <strong>${mapped} reconciled people</strong> are proposed.</p><p class="hint">Identity matches will not overwrite existing names, dates or life status. Conflicting values are retained in source assertions. Existing relationship connections are not duplicated. Records absent from this contribution are never deleted.</p><div class="callout">A recovery snapshot will be downloaded before the import is applied. Keep it for restoration if needed.</div><div class="row spread"><button id="backImport">Back</button><button id="confirmImport" class="primary">Import collection</button></div>`,root=>{root.querySelector('#backImport').onclick=()=>beginImport(imp);root.querySelector('#confirmImport').onclick=()=>{backup();try{const stats=commitImport(imp,importChoices);closeModal();save();fitAll();notice(`Imported ${stats.newPeople} people and ${stats.newRelations} connections`);}catch(err){modal('Import error',`<p>${escapeHtml(err.message)}</p>`);}};});}
function commitImport(imp,choices){const map=new Map(),sourceId=uid(),cid=imp.collection.id;data.sources.push({id:sourceId,label:imp.collection.title||'Imported family',collectionId:cid,importedAt:new Date().toISOString()});let newPeople=0,newRelations=0;const used=new Set(data.people.map(p=>p.id));for(const p of imp.people){const key=sourceKey(cid,p.id);let id=mappedId(cid,p.id)||choices[p.id];if(!id){id=used.has(p.id)?uid():p.id;data.people.push({...deep(p),id,sourceRefs:[...new Set([...(p.sourceRefs||[]),sourceId])]});newPeople++;used.add(id);}else{const existing=person(id);if(!existing)throw Error('Imported mapping refers to a missing person');existing.sourceRefs=[...new Set([...(existing.sourceRefs||[]),sourceId])];for(const field of ['name','birth','death','lifeStatus','notes']){const value=p[field],current=existing[field];if(value!==undefined&&value!==null&&value!==''&&current!==value){const ak=`${cid}|${p.id}|${field}|${JSON.stringify(value)}`;if(!data.assertions.some(a=>a.key===ak))data.assertions.push({key:ak,id:uid(),personId:id,field,value,sourceId,status:'unresolved'});}}}
map.set(p.id,id);if(!data.identityMappings.some(x=>x.sourceKey===key))data.identityMappings.push({sourceKey:key,personId:id});}
for(const r of imp.relationships){const from=map.get(r.from),to=map.get(r.to);if(!from||!to||from===to){continue;}const incoming={...deep(r),from,to,id:uid(),sourceRefs:[...new Set([...(r.sourceRefs||[]),sourceId])]};const existing=data.relationships.find(x=>sameRel(x,incoming));if(existing){existing.sourceRefs=[...new Set([...(existing.sourceRefs||[]),sourceId])];if(r.roles)existing.roles=[...new Set([...(existing.roles||[]),...r.roles])];if(existing.status&&r.status&&existing.status!==r.status&&!data.assertions.some(a=>a.relationshipId===existing.id&&a.field==='status'&&a.value===r.status&&a.originKey===sourceKey(cid,r.id)))data.assertions.push({id:uid(),relationshipId:existing.id,field:'status',value:r.status,sourceId,originKey:sourceKey(cid,r.id),status:'unresolved'});continue;}if(incoming.type==='parentage'&&wouldCycle(data.relationships,from,to)){data.assertions.push({id:uid(),field:'rejectedParentage',value:{from,to},sourceId,status:'unresolved'});continue;}data.relationships.push(incoming);newRelations++;}
data.importHistory.push({id:uid(),collectionId:cid,sourceId,importedAt:new Date().toISOString(),newPeople,newRelations});return{newPeople,newRelations};}
$('#menuBtn').onclick=()=>{const last=Number(localStorage.getItem(KEY+'-lastbackup')||0);modal('Collection management',`<p class="small muted">${data.people.length} people · ${data.relationships.length} relationships</p><div class="field"><label>Collection title</label><input id="renameCollection" value="${escapeHtml(data.collection.title||'Family Atlas')}"></div><div class="stack"><button id="renameSave">Rename collection</button><button id="loadSample">Load extensive fictional sample (replaces current collection)</button><button id="newCollection">Start empty collection</button><button id="downloadBackup">Download JSON backup</button></div><p class="hint">Last downloaded backup: ${last?new Date(last).toLocaleDateString():'No backup recorded'}. Browser data may be lost when site data is cleared.</p>`,root=>{root.querySelector('#renameSave').onclick=()=>{data.collection.title=root.querySelector('#renameCollection').value.trim()||'Family Atlas';closeModal();save();};root.querySelector('#downloadBackup').onclick=()=>{backup();notice('JSON archive downloaded');};root.querySelector('#newCollection').onclick=()=>{if(!confirm('Replace your current collection with an empty one? Export a backup first.'))return;backup();data=blank();selected=focus=null;viewMode='atlas';closeModal();save();fitAll();};root.querySelector('#loadSample').onclick=async()=>{if(!confirm('Replace your current collection with the extensive fictional sample? A JSON backup will download first.'))return;try{const r=await fetch('samples/extensive-family.json');if(!r.ok)throw Error('Sample is not available');const d=ensure(await r.json());backup();data=d;selected=focus=null;viewMode='atlas';closeModal();save();fitAll();}catch(err){notice(err.message);}};});};
render();fitAll();window.addEventListener('resize',()=>applyView());if(data.people.length===0){notice('Start with Add person, or load the extensive sample from More.');}else{const last=Number(localStorage.getItem(KEY+'-lastbackup')||0);if(Date.now()-last>14*86400000)setTimeout(()=>notice('Consider exporting a JSON backup of your family atlas.'),900);}
