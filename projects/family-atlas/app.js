import {radialAtlas, lineageDetail, parentageUnits} from './radial-layout.js';
/* Family Atlas v0.13: radial descendant display, contextual lineage, local-first records. */
const $=s=>document.querySelector(s), svgNS='http://www.w3.org/2000/svg';
const uid=()=>crypto.randomUUID();
const blank=()=>({schemaVersion:'0.2',collection:{id:uid(),title:'My family atlas'},people:[],relationships:[],sources:[],assertions:[],identityMappings:[],importHistory:[]});
const KEY='family-atlas-v02';
let data,selected=null,focus=null,focusBack=[],focusUp=2,focusDown=2,importCandidate=null,importChoices={};
let route=null; // Shortest recorded path between two people, not a genealogical inference.
let viewMode='atlas';
let showNames=true,relationshipFilter='all';
let batchMode=false,batchTab='people',batchPeople=new Set(),batchRelations=new Set(),batchGroup=null,batchReference=null,batchUndo=null;
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
// Shared fuzzy search: exact, token, prefix and minor spelling differences.
export function searchScore(query,candidate){
 const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const q=norm(query),c=norm(candidate);if(!q||!c)return 0;
 if(q===c)return 120;
 if(c.startsWith(q))return 95;
 if(c.includes(q))return 80;
 const tokens=q.split(' '),names=c.split(' ');
 const distance=(a,b)=>{if(Math.abs(a.length-b.length)>2)return 9;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next;}return prev[b.length];};
 let total=0;
 for(const token of tokens){let best=0;for(const name of names){if(name===token)best=Math.max(best,55);else if(name.startsWith(token))best=Math.max(best,45);else if(name.includes(token))best=Math.max(best,34);else{const d=distance(token,name);if(token.length>=3&&d<=Math.min(2,Math.floor(token.length/3)))best=Math.max(best,Math.max(8,29-d*8));}}if(!best)return 0;total+=best;}
 return total/tokens.length+(c.includes(q)?15:0);
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function modal(title,html,bind){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden');bind?.($('#modalBody'));}
function closeModal(){$('#modal').classList.add('hidden');$('#modalBody').innerHTML='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').classList.contains('hidden')){e.preventDefault();closeModal();}});
$('#modalClose').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
const download=(obj,name,type='application/json')=>{const blob=new Blob([typeof obj==='string'?obj:JSON.stringify(obj,null,2)],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);};
function backup(){download(data,`family-atlas-${new Date().toISOString().slice(0,10)}.json`);localStorage.setItem(KEY+'-lastbackup',String(Date.now()));}
function newPerson(anchor=null,relation=null){modal('Add person',`<p class="muted">${anchor?'Expand the family of '+escapeHtml(label(person(anchor))):'Create a new, independent person'}</p>${anchor?quickType(relation):''}<div class="field"><label>Name</label><input id="newName" autofocus placeholder="Enter a name"></div><label class="row"><input id="unknown" type="checkbox"> Name unknown</label><fieldset class="choiceField"><legend>Gender (optional)</legend><div class="choiceGrid">${genderOptions('newGender','')}</div></fieldset><p class="hint">More information can be added later. No dates or life status are required.</p><div class="row spread"><button id="cancel">Cancel</button><button class="primary" id="makePerson">${anchor?'Add to family':'Create person'}</button></div>`,root=>{if(anchor)bindTypeButtons(root);root.querySelector('#unknown').onchange=e=>{root.querySelector('#newName').disabled=e.target.checked;};root.querySelector('#cancel').onclick=closeModal;root.querySelector('#makePerson').onclick=()=>{const unknown=root.querySelector('#unknown').checked,name=root.querySelector('#newName').value.trim(),type=root.querySelector('.typeBtn.selectedChoice')?.dataset.type||relation;if(!unknown&&!name)return notice('Enter a name or select Name unknown');const id=uid();data.people.push({id,name:unknown?'':name,nameStatus:unknown?'unknown':'known',lifeStatus:'unknown',gender:root.querySelector('input[name="newGender"]:checked')?.value||''});if(anchor&&type){const [from,to]=type==='parentage_parent'?[id,anchor]:type==='parentage_child'?[anchor,id]:[anchor,id];addRel(type.startsWith('parentage')?'parentage':type,from,to);}selected=id;viewMode='atlas';closeModal();save();fitPerson(id);};root.querySelector('#newName').focus();});}
const opts=[['parentage_parent','Parent'],['sibling','Sibling'],['parentage_child','Child'],['partnership','Partner'],['guardian','Guardian'],['other','Other']];
function quickType(selectedType='sibling'){return `<div class="field"><label>Relationship to selected person</label><div class="quick">${opts.map(([v,n])=>`<button type="button" class="typeBtn ${v===selectedType?'selectedChoice':''}" data-type="${v}">${n}</button>`).join('')}</div></div>`;}
function bindTypeButtons(root){root.querySelectorAll('.typeBtn').forEach(b=>b.onclick=()=>{root.querySelectorAll('.typeBtn').forEach(c=>c.classList.remove('selectedChoice'));b.classList.add('selectedChoice');});}

function dateParts(v){
 const m=String(v||'').match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
 return m?{y:m[1],m:m[2]||'',d:m[3]||''}:{y:'',m:'',d:''};
}
function dateFields(key,heading,value){
 const d=dateParts(value);
 const options=(n,selected,prompt)=>`<option value="">${prompt}</option>`+Array.from({length:n},(_,i)=>{const v=String(i+1).padStart(2,'0');return `<option value="${v}" ${v===selected?'selected':''}>${i+1}</option>`;}).join('');
 return `<fieldset class="dateField"><legend>${heading} <span class="muted">(optional)</span></legend><div class="dateGrid">
 <div class="field"><label for="${key}Year">Year</label><input id="${key}Year" inputmode="numeric" maxlength="4" placeholder="YYYY" value="${escapeHtml(d.y)}"></div>
 <div class="field"><label for="${key}Month">Month</label><select id="${key}Month">${options(12,d.m,'Month')}</select></div>
 <div class="field"><label for="${key}Day">Day</label><select id="${key}Day">${options(31,d.d,'Day')}</select></div></div></fieldset>`;
}
function readDate(root,key){
 const y=root.querySelector('#'+key+'Year').value.trim(),m=root.querySelector('#'+key+'Month').value,d=root.querySelector('#'+key+'Day').value;
 if(!y&&!m&&!d)return '';
 if(!/^\d{4}$/.test(y))throw Error('Enter a four-digit '+key+' year.');
 if(d&&!m)throw Error('Select a month before a day.');
 if(m&&d&&Number(d)>new Date(Date.UTC(Number(y),Number(m),0)).getUTCDate())throw Error('Invalid day for that month.');
 return y+(m?'-'+m:'')+(d?'-'+d:'');
}
// Gender is recorded only when explicitly chosen. It never infers parental role.
function genderOptions(group,value){return [['','Not specified'],['male','Male'],['female','Female'],['other','Other']].map(([v,t])=>`<label class="radioChoice"><input type="radio" name="${group}" value="${v}" ${value===v?'checked':''}>${t}</label>`).join('');}
function editPerson(id){
 const p=person(id);if(!p)return;
 modal('Edit person',`<div class="field"><label>Name</label><input id="editName" value="${escapeHtml(p.name||'')}"></div>
 <label class="checkLine"><input id="editUnknown" type="checkbox" ${p.nameStatus==='unknown'?'checked':''}> Name unknown</label>
 ${dateFields('birth','Born',p.birth)}${dateFields('death','Died',p.death)}
 <fieldset class="choiceField"><legend>Life status</legend><div class="choiceGrid">${[['unknown','Unknown'],['living','Living'],['deceased','Deceased']].map(([v,t])=>`<label class="radioChoice"><input type="radio" name="editLife" value="${v}" ${(p.lifeStatus||'unknown')===v?'checked':''}>${t}</label>`).join('')}</div></fieldset>
 <fieldset class="choiceField"><legend>Gender (optional)</legend><div class="choiceGrid">${genderOptions('editGender',p.gender||'')}</div></fieldset>
 <div class="field"><label>Notes</label><textarea id="editNotes">${escapeHtml(p.notes||'')}</textarea></div>
 <div class="row spread"><button id="removePerson">Delete person</button><button id="savePerson" class="primary">Save changes</button></div>`,root=>{
 const unknown=root.querySelector('#editUnknown'),nameField=root.querySelector('#editName');
 const toggle=()=>nameField.disabled=unknown.checked;unknown.onchange=toggle;toggle();
 root.querySelector('#savePerson').onclick=()=>{
 const known=!unknown.checked,name=nameField.value.trim();
 if(known&&!name)return notice('Enter a name or mark it unknown.');
 let birth,death;try{birth=readDate(root,'birth');death=readDate(root,'death');}catch(e){return notice(e.message);}
 const lifeStatus=root.querySelector('input[name="editLife"]:checked').value;
 if(lifeStatus==='living'&&death)return notice('A living person cannot have a recorded death date.');
 Object.assign(p,{name:known?name:'',nameStatus:known?'known':'unknown',birth,death,lifeStatus,gender:root.querySelector('input[name="editGender"]:checked').value,notes:root.querySelector('#editNotes').value});
 closeModal();save();
 };
 root.querySelector('#removePerson').onclick=()=>{if(!confirm(`Delete ${label(p)} and all their connections? Export a backup first if needed.`))return;data.people=data.people.filter(x=>x.id!==id);data.relationships=data.relationships.filter(r=>r.from!==id&&r.to!==id);selected=null;closeModal();save();};
 });
}
function relationCategory(r,id){if(r.type==='parentage')return r.from===id?'children':'parents';if(relKind(r)==='partnership')return 'partners';if(r.type==='sibling')return 'siblings';return 'other';}
function drawSide(){
 if(batchMode){drawBatchSide();return;}
 const side=$('#side');if(!selected||!person(selected)){side.classList.add('hidden');return;}
 const p=person(selected),rels=data.relationships.filter(r=>related(r,p.id)),cats=[['all','All'],['parents','Parents'],['children','Children'],['partners','Partners'],['siblings','Siblings'],['other','Other']];
 const count=c=>c==='all'?rels.length:rels.filter(r=>relationCategory(r,p.id)===c).length;
 side.classList.remove('hidden');
 const life=p.lifeStatus==='deceased'?'<span class="personTag marker-deceased">DEC</span>':p.lifeStatus==='living'?'<span class="personTag">Living</span>':'';
 side.innerHTML=`<div class="row spread"><h2>${escapeHtml(label(p))}</h2><button id="closeSide" aria-label="Close details">×</button></div>
 <div class="personTagRow">${life}${p.birth?`<span class="personTag">Born ${escapeHtml(p.birth)}</span>`:''}${p.death?`<span class="personTag">Died ${escapeHtml(p.death)}</span>`:''}${p.gender?`<span class="personTag">${escapeHtml(p.gender.charAt(0).toUpperCase()+p.gender.slice(1))}</span>`:''}</div>
 ${p.notes?`<p class="small">${escapeHtml(p.notes)}</p>`:''}<div class="horizontal" style="margin-top:13px"><button id="editPerson">Edit details</button><button id="focusHere">Family detail</button></div>
 <div class="sep"></div><h3>Expand family</h3><p class="hint">Choose a relationship, then add someone directly.</p><div class="quick" id="expandQuick">${opts.map(([t,n])=>`<button data-type="${t}">+ ${n}</button>`).join('')}</div>
 <p class="hint">Or connect to people already in this atlas:</p><button id="connectExisting">Connect existing people</button>
 <div class="row spread relationshipHeading"><h3>Relationships (${rels.length})</h3><label class="relationFilterLabel">Show <select id="relationFilter">${cats.map(([c,t])=>`<option value="${c}" ${relationshipFilter===c?'selected':''}>${t} (${count(c)})</option>`).join('')}</select></label></div>
 <div id="relationList">${rels.map(r=>`<div class="relationLine" data-group="${relationCategory(r,p.id)}"><div class="relationDescription"><strong>${escapeHtml(label(person(related(r,p.id))))}</strong><div class="muted tiny">${escapeHtml(describe(r,p.id))}${r.roles?.length?' · '+escapeHtml(r.roles.join(', ')):''}</div></div><div class="row"><button data-rel-edit="${r.id}">Edit</button><button data-remove="${r.id}" title="Remove connection">Remove</button></div></div>`).join('')}</div><p class="hint" id="relationEmpty" hidden>No relationships in this category.</p>
 <div class="sep"></div><div class="small muted">${escapeHtml(p.sourceRefs?.length?'Imported sources: '+p.sourceRefs.length:'Local record')}${data.assertions.some(a=>a.personId===p.id)?' · Conflicting imported information retained':''}</div>`;
 function applyFilter(){let n=0;side.querySelectorAll('.relationLine').forEach(row=>{const visible=relationshipFilter==='all'||row.dataset.group===relationshipFilter;row.hidden=!visible;if(visible)n++;});side.querySelector('#relationEmpty').hidden=n!==0;}
 side.querySelector('#relationFilter').onchange=e=>{relationshipFilter=e.target.value;applyFilter();};applyFilter();
 side.querySelector('#closeSide').onclick=()=>{selected=null;drawSide();renderGraph();};side.querySelector('#editPerson').onclick=()=>editPerson(p.id);side.querySelector('#focusHere').onclick=()=>enterFocus(p.id);
 side.querySelectorAll('#expandQuick button').forEach(b=>b.onclick=()=>newPerson(p.id,b.dataset.type));
 side.querySelector('#connectExisting').onclick=()=>connectExisting(p.id);
 side.querySelectorAll('[data-rel-edit]').forEach(b=>b.onclick=()=>editRelationship(b.dataset.relEdit));
 side.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const r=data.relationships.find(x=>x.id===b.dataset.remove);if(confirm('Remove this relationship? The people will remain in the atlas.')){data.relationships=data.relationships.filter(x=>x!==r);save();}});
}

function editRelationship(id){
 const r=data.relationships.find(x=>x.id===id);if(!r)return;
 const roles=r.roles||[],primaryRoles=['biological','adoptive','foster'],active=primaryRoles.filter(v=>roles.includes(v));
 const primary=active.length===1?active[0]:'unspecified';
 modal('Edit relationship',`<p><strong>${escapeHtml(label(person(r.from)))}</strong> — <strong>${escapeHtml(label(person(r.to)))}</strong></p><p class="hint">${escapeHtml(describe(r,r.from))}. Editing the relationship does not remove either person.</p>
 ${r.type==='parentage'?`
 <fieldset class="choiceField"><legend>Parentage classification</legend><p class="hint">Select the primary classification. Legal parentage can also apply.</p>
 ${active.length>1?'<p class="fieldWarning">This record contains multiple primary classifications. These remain unchanged unless you save a new selection.</p>':''}
 <div class="choiceGrid">${[['unspecified','Unspecified'],['biological','Biological'],['adoptive','Adoptive'],['foster','Foster']].map(([v,t])=>`<label class="radioChoice"><input type="radio" name="parentageClass" value="${v}" ${primary===v?'checked':''}>${t}</label>`).join('')}</div>
 <label class="checkLine legalChoice"><input type="checkbox" id="relLegal" ${roles.includes('legal')?'checked':''}> Legal parentage also applies</label></fieldset>
 <fieldset class="choiceField"><legend>Parental role (optional)</legend><div class="choiceGrid">${[['','Unspecified'],['mother','Mother'],['father','Father'],['other','Other']].map(([v,t])=>`<label class="radioChoice"><input type="radio" name="parentRole" value="${v}" ${(r.parentRole||'')===v?'checked':''}>${t}</label>`).join('')}</div></fieldset>`:
 r.type==='partnership'?`<div class="field"><label>Classification</label><select id="relClass"><option value="partner">Partner</option><option value="married">Married</option></select></div><div class="field"><label>Relationship status</label><select id="relStatus">${['current','separated','divorced','former','ended by death','historical','unknown'].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></div><div class="field"><label>Start year/date (optional)</label><input id="relStart" value="${escapeHtml(r.start||'')}"></div><div class="field"><label>End year/date (optional)</label><input id="relEnd" value="${escapeHtml(r.end||'')}"></div>`:
 '<p class="hint">To change the relationship type, remove it and recreate the appropriate connection.</p>'}
 <div class="row spread"><button id="cancelRel">Cancel</button><button class="primary" id="saveRel">Save relationship</button></div>`,root=>{
 root.querySelector('#cancelRel').onclick=closeModal;
 if(r.type==='partnership'){root.querySelector('#relClass').value=r.classification||'partner';root.querySelector('#relStatus').value=r.status||'current';}
 root.querySelector('#saveRel').onclick=()=>{
 if(r.type==='partnership')Object.assign(r,{classification:root.querySelector('#relClass').value,status:root.querySelector('#relStatus').value,start:root.querySelector('#relStart').value.trim(),end:root.querySelector('#relEnd').value.trim()});
 if(r.type==='parentage'){const choice=root.querySelector('input[name="parentageClass"]:checked').value,updated=choice==='unspecified'?[]:[choice];if(root.querySelector('#relLegal').checked)updated.push('legal');Object.assign(r,{roles:updated,parentRole:root.querySelector('input[name="parentRole"]:checked').value});}
 closeModal();save();
 };
 });
}
function connectExisting(id){const state={type:'sibling',choices:new Set(),search:''};const vicinity=near(id);modal('Connect existing people',`<div class="muted small">From <strong>${escapeHtml(label(person(id)))}</strong></div><div class="field"><label for="connectSearch">Find someone in the atlas</label><input id="connectSearch" placeholder="Search names (tolerates spelling variations)" autocomplete="off"></div>${quickType('sibling')}<div class="field"><label id="nearbyLabel">Nearby people</label><div id="farList" class="connectResults"></div><div id="nearList" hidden></div></div><p class="hint" id="connectCount">No people selected</p><div class="row spread"><button id="cancel">Cancel</button><button id="commitConnect" class="primary">Connect selected</button></div>`,root=>{bindTypeButtons(root);root.querySelectorAll('.typeBtn').forEach(b=>b.onclick=()=>{root.querySelectorAll('.typeBtn').forEach(x=>x.classList.remove('selectedChoice'));b.classList.add('selectedChoice');state.type=b.dataset.type;drawLists();});root.querySelector('#cancel').onclick=closeModal;root.querySelector('#connectSearch').oninput=e=>{state.search=e.target.value;drawLists();};function item(p,dist){const v=state.type.startsWith('parentage')?'parentage':state.type;const [from,to]=state.type==='parentage_parent'?[p.id,id]:[id,p.id];const exists=data.relationships.some(r=>sameRel(r,{type:v,from,to}));return `<button class="personItem ${state.choices.has(p.id)?'active':''}" data-person="${p.id}" ${exists?'disabled':''}><input type="checkbox" tabindex="-1" ${state.choices.has(p.id)?'checked':''} ${exists?'disabled':''}><span><strong>${escapeHtml(label(p))}</strong><small>${exists?'Already connected':dist!==undefined?`Within ${dist} connection${dist===1?'':'s'}`:'Elsewhere'}${p.birth?' · Born '+escapeHtml(p.birth):''}</small></span></button>`;}
function drawLists(){
 const all=data.people.filter(p=>p.id!==id),q=state.search.trim();
 const filtered=q?all.map(p=>({p,score:searchScore(q,label(p))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||label(a.p).localeCompare(label(b.p))).slice(0,30).map(x=>x.p):all.filter(p=>vicinity.has(p.id)&&vicinity.get(p.id)<=2).sort((a,b)=>vicinity.get(a.id)-vicinity.get(b.id)||label(a).localeCompare(label(b))).slice(0,24);
 root.querySelector('#farList').innerHTML=filtered.length?filtered.map(p=>item(p,vicinity.get(p.id))).join(''):`<div class="noResults">${q?'No matching people. Try a different spelling.':'No nearby people. Search the full atlas above.'}</div>`;
 root.querySelector('#nearList').innerHTML='';
 root.querySelector('#nearbyLabel').textContent=q?`Search results (${filtered.length})`:`Nearby people (${filtered.length})`;
 root.querySelector('#connectCount').textContent=state.choices.size+' selected';
 root.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{const pid=b.dataset.person;state.choices.has(pid)?state.choices.delete(pid):state.choices.add(pid);drawLists();});
}
root.querySelector('#commitConnect').onclick=()=>{if(!state.choices.size)return notice('Select at least one person');const result=[];for(const pid of state.choices){const type=state.type.startsWith('parentage')?'parentage':state.type;const [a,b]=state.type==='parentage_parent'?[pid,id]:[id,pid];result.push({pid,success:addRel(type,a,b)});}if(result.some(r=>!r.success))notice('Some connections already existed or would create a parentage loop');closeModal();save();};drawLists();root.querySelector('#connectSearch').focus();});}
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
 const g=svg('g',{class:`edgeGroup ${kind}${active?' routeLink':''} ${extra}`.trim()});
 const line=svg('path',{d,class:`link ${kind}${active?' routeLink':''} ${extra}`.trim()});
 line.append(svg('title',{},tip));g.append(line);layer.append(g);return line;
}
// An unrelated crossing is a gap, not a shared junction. The lower-priority
// route receives a small SVG mask at that intersection; no white side-casings.
// Real parentage junctions are drawn in their own topmost SVG layer.
function segmentIntersection(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y;
 const den=rx*sy-ry*sx;if(Math.abs(den)<1e-7)return null;
 const qx=c.x-a.x,qy=c.y-a.y,t=(qx*sy-qy*sx)/den,u=(qx*ry-qy*rx)/den;
 if(t<=.02||t>=.98||u<=.02||u>=.98)return null;
 return {x:a.x+t*rx,y:a.y+t*ry};
}
function crossingGaps(edges,junctionLayer){
 const old=edges.querySelector('#crossingMasks');if(old)old.remove();
 const paths=[...edges.querySelectorAll(':scope > .edgeGroup > path.link')];
 if(paths.length>350)return; // Avoid quadratic browser work on pathological imports.
 const rank=p=>p.classList.contains('routeLink')?4:p.classList.contains('parentage')?3:p.classList.contains('partnership')?2:1;
 const junctions=[...junctionLayer.querySelectorAll('circle.parentJunction')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy')}));
 const nodes=[...coords.values()];
 const grid=new Map(),cell=32,collisions=new Map(),seen=new Set();
 const insert=(key,item)=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);};
 for(let index=0;index<paths.length;index++){
   const path=paths[index];let len;
   try{len=path.getTotalLength();}catch{continue;}
   if(!Number.isFinite(len)||len<3)continue;
   const step=Math.max(5,Math.min(10,len/350));
   let prev=path.getPointAtLength(0);
   for(let n=1,total=Math.ceil(len/step);n<=total;n++){
     const next=path.getPointAtLength(Math.min(len,n*len/total));
     const seg={a:prev,b:next,index};prev=next;
     const x0=Math.floor(Math.min(seg.a.x,seg.b.x)/cell),x1=Math.floor(Math.max(seg.a.x,seg.b.x)/cell);
     const y0=Math.floor(Math.min(seg.a.y,seg.b.y)/cell),y1=Math.floor(Math.max(seg.a.y,seg.b.y)/cell);
     for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
       const k=x+':'+y;
       for(const other of grid.get(k)||[]){
         if(other.index===index)continue;
         const found=segmentIntersection(other.a,other.b,seg.a,seg.b);
         if(!found)continue;
         const key=[Math.min(index,other.index),Math.max(index,other.index),Math.round(found.x/5),Math.round(found.y/5)].join(':');
         if(seen.has(key))continue;seen.add(key);
         // Crossings at actual junctions or at the ends of a person stem must not be broken.
         if(junctions.some(p=>Math.hypot(found.x-p.x,found.y-p.y)<13))continue;
         if(nodes.some(p=>Math.hypot(found.x-p.x,found.y-p.y)<23))continue;
         const first=paths[other.index],second=path;
         const lower=rank(first)<rank(second)?other.index:rank(first)>rank(second)?index:Math.min(index,other.index);
         if(!collisions.has(lower))collisions.set(lower,[]);
         if(!collisions.get(lower).some(p=>Math.hypot(p.x-found.x,p.y-found.y)<7))collisions.get(lower).push(found);
       }
       insert(k,seg);
     }
   }
 }
 if(!collisions.size)return;
 const defs=svg('defs',{id:'crossingMasks'});edges.prepend(defs);
 for(const [index,pts] of collisions){
   const path=paths[index],box=path.getBBox(),id='crossGap-'+index;
   const mask=svg('mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',
      x:box.x-12,y:box.y-12,width:Math.max(24,box.width+24),height:Math.max(24,box.height+24)});
   mask.append(svg('rect',{x:box.x-12,y:box.y-12,width:Math.max(24,box.width+24),height:Math.max(24,box.height+24),fill:'white'}));
   for(const pt of pts)mask.append(svg('circle',{cx:pt.x,cy:pt.y,r:4.5,fill:'black'}));
   defs.append(mask);path.setAttribute('mask',`url(#${id})`);
 }
}
function orderConnections(edges){
 const rank=g=>g.classList.contains('routeLink')?4:g.classList.contains('parentage')?3:g.classList.contains('partnership')?2:1;
 [...edges.querySelectorAll(':scope > .edgeGroup')].sort((a,b)=>rank(a)-rank(b)).forEach(g=>edges.append(g));
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
  const es=$('#edges'),js=$('#junctions'),ns=$('#nodes'),annotations=$('#annotations');es.replaceChildren();js.replaceChildren();ns.replaceChildren();annotations.replaceChildren();
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
    }else j={x:parentMid.x,y:(parentMid.y+childMid.y)/2};
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

    // Each family owns its own parentage bus. Draw the bus once, then a separate
    // stem for each recorded child. Junctions cannot adopt another group's child.
    if(viewMode==='detail'){
      const upperY=j.y-25,busY=j.y+15;
      for(const id of u.parents){
        const a=coords.get(id);if(!a)continue;
        const active=parentRels.some(r=>r.from===id&&u.children.includes(r.to)&&routeEdges.has(r.id));
        addLink(es,`M${a.x} ${a.y+20} V${upperY} H${j.x}`,'parentage',`${label(person(id))}: recorded parentage`,active);
      }
      const left=Math.min(j.x,...children.map(p=>p.x)),right=Math.max(j.x,...children.map(p=>p.x));
      const active=parentRels.some(r=>u.parents.includes(r.from)&&u.children.includes(r.to)&&routeEdges.has(r.id));
      addLink(es,`M${j.x} ${upperY} V${busY} M${left} ${busY} H${right}`,'parentage','Shared parentage junction',active);
      for(const id of u.children){
        const b=coords.get(id);if(!b)continue;
        const highlighted=parentRels.some(r=>r.to===id&&u.parents.includes(r.from)&&routeEdges.has(r.id));
        addLink(es,`M${b.x} ${busY} V${b.y-20}`,'parentage',`Recorded child: ${label(person(id))}`,highlighted);
      }
    }else{
      for(const id of u.parents){
        const a=coords.get(id);if(!a)continue;
        const highlighted=parentRels.some(r=>r.from===id&&u.children.includes(r.to)&&routeEdges.has(r.id));
        const comp=layout.components.find(c=>c.ids.includes(id));
        addLink(es,comp?ringPath(a,j,comp,unitLane):`M${a.x} ${a.y+20} V${j.y} H${j.x}`,'parentage',`${label(person(id))}: recorded parentage`,highlighted);
      }
      for(const id of u.children){
        const b=coords.get(id);if(!b)continue;
        const highlighted=parentRels.some(r=>r.to===id&&u.parents.includes(r.from)&&routeEdges.has(r.id));
        const comp=layout.components.find(c=>c.ids.includes(id));
        addLink(es,comp?ringPath(j,b,comp,unitLane):`M${j.x} ${j.y} H${b.x} V${b.y-20}`,'parentage',`Recorded child: ${label(person(id))}`,highlighted);
      }
    }
    const junction=svg('circle',{cx:j.x,cy:j.y,r:batchMode?7:3,class:'parentJunction'+(batchMode?' batchJunction':'')+(batchGroup&&sameGroup(batchGroup,u)?' batchChosen':'')});
    js.append(junction);
    if(batchMode){
      // Keep the junction visible at its original size but provide a generous target.
      const hit=svg('circle',{cx:j.x,cy:j.y,r:16,class:'junctionHit',tabindex:'0',role:'button',
        'aria-label':`Select family group: ${u.parents.map(id=>label(person(id))).join(', ')}; ${u.children.length} children`});
      const choose=event=>{event.stopPropagation();selectBatchGroup(u);};
      hit.addEventListener('click',choose);
      hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(event);}});
      js.append(hit);
    }
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
    addLink(es,d,kind,`${label(person(r.from))} / ${label(person(r.to))}: ${routeDescription(r,r.from,r.to)}`,highlight,[cross&&!shown?'crossQuiet':'',kind==='partnership'?'status-'+String(r.status||'current').toLowerCase().replace(/[^a-z]+/g,'-'):''].filter(Boolean).join(' '));
    if(batchMode && kind==='partnership'){const edge=es.lastElementChild;edge.classList.add('batchEdge');if(batchRelations.has(r.id))edge.classList.add('batchChosen');edge.addEventListener('click',event=>{event.stopPropagation();selectBatchRelation(r.id);});}
    if(kind==='partnership'&&r.status&&r.status!=='current'&&r.status!=='unknown'&&(!cross||shown)){
      const code=statusCode(r.status),w=Math.max(33,code.length*7+12),path=es.lastElementChild.querySelector('.link');
      const length=path.getTotalLength(),points=[.5,.38,.62,.27,.73,.15,.85].map(t=>path.getPointAtLength(length*t));
      const clearance=q=>Math.min(...[...coords.values()].map(p=>{
        const dx=Math.max(0,Math.abs(q.x-p.x)-Math.max(36,w/2+5)),dy=Math.max(0,Math.abs(q.y-p.y-12)-37);
        return Math.hypot(dx,dy);
      }));
      points.sort((a,b)=>clearance(b)-clearance(a));
      const {x,y}=points[0],g=svg('g',{class:'edgeStatus status-'+String(r.status).toLowerCase().replace(/[^a-z]+/g,'-')});
      g.append(svg('rect',{x:x-w/2,y:y-10,width:w,height:20,rx:2}));
      g.append(svg('text',{x,y:y+3,'text-anchor':'middle'},code));
      g.append(svg('title',{},`Partnership status: ${r.status}`));annotations.append(g);
    }
  }
  // Plain connection strokes; actual parentage junctions are drawn in the upper SVG layer.
  orderConnections(es);
  crossingGaps(es,js);
  for(const [id,pos] of coords){
    const p=person(id),name=label(p),deceased=p.lifeStatus==='deceased';
    const g=svg('g',{class:'personNode'+(batchMode&&batchPeople.has(id)?' batchChosen':'')+(selected===id?' selected':'')+(viewMode==='detail'&&focus===id?' focused':''),transform:`translate(${pos.x} ${pos.y})`,'data-person-id':id,tabindex:'0',role:'button','aria-label':`${name}${deceased?', deceased':''}`});
    const display=name.length>27?name.slice(0,25)+'…':name;
    const plateWidth=Math.max(68,Math.min(226,display.length*7.4+25));
    g.append(svg('circle',{r:19,cx:0,cy:0}));
    g.append(svg('text',{x:0,y:4,'text-anchor':'middle',class:'initial'},p.nameStatus==='unknown'?'?':name.charAt(0).toUpperCase()));
    if(deceased){g.append(svg('rect',{x:11,y:-27,width:29,height:17,rx:2,class:'lifeMarker status-deceased'}));g.append(svg('text',{x:25.5,y:-15,'text-anchor':'middle',class:'lifeMarkText'},'DEC'));}
    g.append(svg('rect',{x:-plateWidth/2,y:24,width:plateWidth,height:23,rx:2,class:'nameplate personName'}));
    g.append(svg('text',{x:0,y:40,'text-anchor':'middle',class:'personName'},display));
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
  $('#status').textContent=`${batchMode?'BATCH SELECT · ':''}${ids.size} people · ${clusters.length||1} network${clusters.length===1?'':'s'} · Drag to pan · Scroll to zoom · DEC deceased`;
  renderFocusBar();
}
function applyView(){$('#stage').classList.toggle('namesHidden',!showNames);$('#toggleNames').textContent=showNames?'Hide names':'Show names';$('#toggleNames').setAttribute('aria-pressed',String(!showNames));$('#world').setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);$('#stage').classList.toggle('overviewScale',zoom<.43);}
function fitAll(){const s=$('#stage'),w=s.clientWidth,h=s.clientHeight;if(!coords.size){zoom=1;pan={x:w/2,y:h/2};applyView();return;}zoom=Math.max(.06,Math.min(1.5,Math.min((w-95)/graphBounds.w,(h-110)/graphBounds.h)));pan={x:(w-graphBounds.w*zoom)/2-graphBounds.x*zoom,y:(h-graphBounds.h*zoom)/2-graphBounds.y*zoom};applyView();}
function animateToPerson(id){const node=[...$('#nodes').querySelectorAll('.personNode')].find(n=>n.dataset.personId===id);node?.classList.add('navArrival');const world=$('#world');if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)world.classList.add('viewportNavigating');fitPerson(id);setTimeout(()=>{world.classList.remove('viewportNavigating');node?.classList.remove('navArrival');},450);}
function moveBack(){if(!focusBack.length)return;const prev=focusBack.pop();focus=prev;selected=prev;renderGraph();drawSide();animateToPerson(prev);}
function fitPerson(id){const p=coords.get(id);if(!p){fitAll();return;}zoom=Math.max(.8,Math.min(1.15,zoom));pan={x:$('#stage').clientWidth*.5-p.x*zoom,y:$('#stage').clientHeight*.45-p.y*zoom};applyView();}
function zoomAt(scale,cx,cy){const nz=Math.max(.06,Math.min(3,zoom*scale)),r=nz/zoom;pan={x:cx-(cx-pan.x)*r,y:cy-(cy-pan.y)*r};zoom=nz;applyView();}
const atlas=$('#atlas');atlas.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.personNode')||e.target.closest('.junctionHit')||e.target.closest('.batchEdge'))return;drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};preventClick=false;atlas.setPointerCapture(e.pointerId);atlas.classList.add('dragging');});atlas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)preventClick=true;pan={x:drag.px+dx,y:drag.py+dy};applyView();});atlas.addEventListener('pointerup',()=>{drag=null;atlas.classList.remove('dragging');setTimeout(()=>preventClick=false,30);});atlas.addEventListener('wheel',e=>{e.preventDefault();const rect=atlas.getBoundingClientRect();zoomAt(e.deltaY<0?1.13:1/1.13,e.clientX-rect.left,e.clientY-rect.top);},{passive:false});atlas.addEventListener('click',e=>{if(!preventClick&&!e.target.closest('.personNode')&&!batchMode){selected=null;drawSide();renderGraph();}});
function selectPerson(id){if(batchMode){toggleBatchPerson(id);return;}selected=id;if(viewMode==='detail'&&id!==focus){/* Selection alone does not change the family-detail reference. */}drawSide();renderGraph();}
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
  const navigationFrom=focus;
  const parentRels=data.relationships.filter(r=>r.type==='parentage'&&r.to===navigationFrom&&person(r.from));
  const parents=parentRels.sort((a,b)=>{
    const priority=r=>({mother:0,father:1,other:2}[r.parentRole]??3);
    return priority(a)-priority(b)||label(person(a.from)).localeCompare(label(person(b.from)));
  }).map(r=>r.from);
  // Use explicit steps for navigation ordering.
  const childRelations = data.relationships.filter(function (relationship) {
    return relationship.type === 'parentage' &&
      relationship.from === navigationFrom &&
      Boolean(person(relationship.to));
  });
  const children = childRelations.map(function (relationship) {
    return relationship.to;
  });
  children.sort(function (firstId, secondId) {
    const firstName = label(person(firstId));
    const secondName = label(person(secondId));
    return firstName.localeCompare(secondName);
  });
  const selector=(direction,items)=>items.length>1?`<select id="${direction}Choice" aria-label="Choose ${direction==='up'?'parent':'child'}">${items.map(id=>`<option value="${escapeHtml(id)}">${escapeHtml(label(person(id)))}</option>`).join('')}</select>`:'';
  b.innerHTML=`<strong>Family detail: ${escapeHtml(label(person(navigationFrom)))}</strong><div class="treeNavigate"><div class="treeStep"><button id="goParent" ${parents.length?'':'disabled'} title="Navigate to a recorded parent">↑ Parent</button>${selector('up',parents)}</div><div class="treeStep"><button id="goChild" ${children.length?'':'disabled'} title="Navigate to a recorded child">↓ Child</button>${selector('down',children)}</div></div><button id="focusBack" ${!focusBack.length?'disabled':''}>← Previous</button><details class="depthSettings"><summary>Visible generations</summary><label>Ancestors <select id="upCount">${[0,1,2,3,4,5,6].map(x=>`<option value="${x}" ${x===focusUp?'selected':''}>${x}</option>`).join('')}</select></label><label>Descendants <select id="downCount">${[0,1,2,3,4,5,6].map(x=>`<option value="${x}" ${x===focusDown?'selected':''}>${x}</option>`).join('')}</select></label></details>`;
  $('#stage').append(b);
  const move=id=>{if(!id||id===navigationFrom)return;focusBack.push(focus);focus=id;selected=id;renderGraph();drawSide();animateToPerson(id);};
  b.querySelector('#goParent').onclick=()=>move(b.querySelector('#upChoice')?.value||parents[0]);
  b.querySelector('#goChild').onclick=()=>move(b.querySelector('#downChoice')?.value||children[0]);
  b.querySelector('#upChoice')?.addEventListener('change',e=>move(e.target.value));
  b.querySelector('#downChoice')?.addEventListener('change',e=>move(e.target.value));
  b.querySelector('#upCount').onchange=e=>{focusUp=+e.target.value;renderGraph();fitAll();};
  b.querySelector('#downCount').onchange=e=>{focusDown=+e.target.value;renderGraph();fitAll();};
  b.querySelector('#focusBack').onclick=()=>moveBack();
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

// Batch selection is UI state only. Data changes operate on the original person
// and relationship UUID records; no visual junction is ever persisted.
function sameGroup(a,b){
 return a.parents.length===b.parents.length && a.children.length===b.children.length &&
 a.parents.every(id=>b.parents.includes(id)) && a.children.every(id=>b.children.includes(id));
}
function clearBatchSelection(){batchPeople.clear();batchRelations.clear();batchGroup=null;batchReference=null;}
function toggleBatchMode(){batchMode=!batchMode;clearBatchSelection();batchTab='people';$('#batchBtn').classList.toggle('primary',batchMode);$('#batchBtn').textContent=batchMode?'Done selecting':'Select multiple';render();}
function toggleBatchPerson(id){
 if(batchPeople.has(id)){batchPeople.delete(id);if(batchReference===id)batchReference=null;}else batchPeople.add(id);
 batchGroup=null;drawBatchSide();renderGraph();
}
function selectBatchGroup(group){
 batchGroup={parents:[...group.parents],children:[...group.children]};batchPeople=new Set([...group.parents,...group.children]);
 batchReference=group.parents[0]||null;batchRelations.clear();batchTab='parentage';drawBatchSide();renderGraph();
}
function selectBatchRelation(id){
 if(batchRelations.has(id))batchRelations.delete(id);else batchRelations.add(id);
 batchTab='partnership';drawBatchSide();renderGraph();
}
function batchChosenPeople(){return [...batchPeople].map(person).filter(Boolean);}
function batchReferenceOptions(){return [...batchPeople].filter(id=>person(id)&&(!batchGroup||batchGroup.parents.includes(id))).map(id=>`<option value="${escapeHtml(id)}" ${id===batchReference?'selected':''}>${escapeHtml(label(person(id)))}</option>`).join('');}
function batchParentageTargets(){return [...batchPeople].filter(id=>id!==batchReference && person(id)&&(!batchGroup||batchGroup.children.includes(id)));}
function batchParentageLinks(){return batchParentageTargets().map(id=>({id,record:data.relationships.find(r=>r.type==='parentage'&&r.from===batchReference&&r.to===id)}));}
function batchPartnerLinks(){return [...batchRelations].map(id=>data.relationships.find(r=>r.id===id&&relKind(r)==='partnership')).filter(Boolean);}
function batchHint(){return batchGroup?`Selected parentage junction · ${batchGroup.parents.length} recorded parents · ${batchGroup.children.length} children`:`${batchPeople.size} people · ${batchRelations.size} selected partnerships`;}
function batchOptions(values){return values.map(([v,name])=>`<option value="${escapeHtml(v)}">${escapeHtml(name)}</option>`).join('');}
function drawBatchSide(){
 const side=$('#side');side.classList.remove('hidden');
 const tabs=[['people','People'],['parentage','Parentage'],['partnership','Partnerships'],['group','Family group']];
 const people=batchChosenPeople();
 const selectedNames=people.map(p=>`<li>${escapeHtml(label(p))}</li>`).join('');
 side.innerHTML=`<div class="row spread"><h2>Selection workspace</h2><button id="endBatch">Done</button></div>
 <p class="hint">Click people to select. Click a parentage junction for its complete group, or a partnership line to select that relationship. Changes are reviewed before being applied.</p>
 <p class="batchCount">${batchHint()}</p><div class="batchTabs">${tabs.map(([v,t])=>`<button data-tab="${v}" class="${batchTab===v?'selectedChoice':''}">${t}</button>`).join('')}</div>
 <div id="batchForm"></div>
 <details class="batchList"><summary>Selected people (${people.length})</summary><ul>${selectedNames||'<li>None</li>'}</ul></details>
 <div class="row wrap batchFoot"><button id="batchClear">Clear selection</button><button id="batchUndo" ${batchUndo?'':'disabled'}>Undo last batch</button></div>`;
 side.querySelector('#endBatch').onclick=toggleBatchMode;
 side.querySelector('#batchClear').onclick=()=>{clearBatchSelection();drawBatchSide();renderGraph();};
 side.querySelector('#batchUndo').onclick=()=>{
   if(!batchUndo)return;data=ensure(deep(batchUndo));batchUndo=null;clearBatchSelection();save();notice('Last batch change undone');
 };
 side.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{batchTab=b.dataset.tab;drawBatchSide();});
 const root=side.querySelector('#batchForm');
 if(batchTab==='people'){
   root.innerHTML=`<h3>Common attributes</h3><p class="hint">Only checked fields will change. Blank records can be filled without replacing recorded values.</p>
   <label class="checkLine"><input type="checkbox" id="changeGender">Change gender</label><div class="field"><select id="batchGender">${batchOptions([['','Not specified'],['female','Female'],['male','Male'],['other','Other']])}</select></div>
   <label class="checkLine"><input type="checkbox" id="changeLife">Change life status</label><div class="field"><select id="batchLife">${batchOptions([['unknown','Unknown'],['living','Living'],['deceased','Deceased']])}</select></div>
   <label class="checkLine"><input type="checkbox" id="changeNotes">Append note</label><div class="field"><textarea id="batchNote" placeholder="Shared annotation — existing notes retained"></textarea></div>
   <label class="checkLine"><input type="checkbox" id="blankOnly">Fill blank fields only (gender and life status)</label>
   <button class="primary" id="batchReview">Review person changes</button>`;
   root.querySelector('#batchReview').onclick=()=>{
     const selectedIds=[...batchPeople];if(!selectedIds.length)return notice('Select people first');
     const gender=root.querySelector('#changeGender').checked,life=root.querySelector('#changeLife').checked,note=root.querySelector('#changeNotes').checked;
     if(!gender&&!life&&!note)return notice('Choose at least one field to change');
     const values={gender:root.querySelector('#batchGender').value,lifeStatus:root.querySelector('#batchLife').value,note:root.querySelector('#batchNote').value.trim(),blank:root.querySelector('#blankOnly').checked};
     if(note&&!values.note)return notice('Enter a note to append');
     const changes=[];for(const id of selectedIds){const p=person(id);if(!p)continue;const update={};
       if(gender&&(!values.blank||!p.gender))update.gender=values.gender;
       if(life&&(!values.blank||!p.lifeStatus||p.lifeStatus==='unknown')){
         if(values.lifeStatus==='living'&&p.death)return notice(`Cannot mark ${label(p)} living while a death date is recorded`);
         update.lifeStatus=values.lifeStatus;
       }
       if(note)update.notes=[p.notes||'',values.note].filter(Boolean).join('\n');
       if(Object.keys(update).length)changes.push({id,update});
     }
     const rows=changes.flatMap(({id,update})=>Object.entries(update).map(([field,to])=>previewField(label(person(id)),field,person(id)[field],to)));
     reviewBatch(`Edit ${changes.length} people`,`${changes.length} person records will be updated. Only explicitly chosen fields change.`,()=>{for(const {id,update} of changes)Object.assign(person(id),update);},rows);
   };
 }else if(batchTab==='parentage'){
   root.innerHTML=`<h3>Parentage relationships</h3><p class="hint">Choose one reference parent. Other selected people become target children. Nothing is inferred from gender.</p>
     <div class="field"><label>Reference parent</label><select id="batchParent"><option value="">Choose a selected person</option>${batchReferenceOptions()}</select></div>
     <div id="batchTargetSummary" class="hint"></div>
     <label class="checkLine"><input id="createMissingParentage" type="checkbox">Create missing parent–child links</label>
     <label class="checkLine"><input id="changeClass" type="checkbox">Change primary classification</label><div class="field"><select id="batchClass">${batchOptions([['unspecified','Unspecified'],['biological','Biological'],['adoptive','Adoptive'],['foster','Foster']])}</select></div>
     <label class="checkLine"><input id="changeRole" type="checkbox">Change parental role</label><div class="field"><select id="batchRole">${batchOptions([['','Unspecified'],['mother','Mother'],['father','Father'],['other','Other']])}</select></div>
     <label class="checkLine"><input id="changeLegal" type="checkbox">Change legal parentage</label><div class="field"><select id="batchLegal">${batchOptions([['add','Mark as legal parent'],['remove','Remove legal classification']])}</select></div>
     <button id="batchReview" class="primary">Review parentage changes</button>`;
   const parentSelect=root.querySelector('#batchParent');
   const sync=()=>{batchReference=parentSelect.value||null;const links=batchParentageLinks();root.querySelector('#batchTargetSummary').textContent=links.length?`${links.length} target people · ${links.filter(x=>x.record).length} existing parentage links · ${links.filter(x=>!x.record).length} missing`:'Select a reference parent and at least one target child.';};
   parentSelect.onchange=sync;sync();
   root.querySelector('#batchReview').onclick=()=>{
     if(!batchReference)return notice('Choose a reference parent');const pairs=batchParentageLinks();if(!pairs.length)return notice('Select children as targets');
     const create=root.querySelector('#createMissingParentage').checked,classification=root.querySelector('#changeClass').checked,role=root.querySelector('#changeRole').checked,legal=root.querySelector('#changeLegal').checked;
     if(!create&&!classification&&!role&&!legal)return notice('Choose a parentage operation');
     if(pairs.some(x=>!x.record)&&!create)return notice('Some links are missing. Enable Create missing links or deselect these people.');
     const changes=pairs.map(x=>({id:x.id,record:x.record}));
     const cls=root.querySelector('#batchClass').value,rval=root.querySelector('#batchRole').value,lv=root.querySelector('#batchLegal').value;
     const rows=changes.flatMap(change=>{
       const before=change.record?deep(change.record):null;
       const after=before?deep(before):{type:'parentage',from:batchReference,to:change.id,roles:[],parentRole:''};
       if(classification){const retained=(after.roles||[]).filter(x=>!['biological','adoptive','foster'].includes(x));after.roles=[...retained,...(cls==='unspecified'?[]:[cls])];}
       if(legal){const kept=(after.roles||[]).filter(x=>x!=='legal');after.roles=lv==='add'?[...kept,'legal']:kept;}
       if(role)after.parentRole=rval;
       return previewParentage(before,after,`${label(person(batchReference))} → ${label(person(change.id))}`);
     });
     reviewBatch('Edit parentage',`${changes.length} parent–child links: ${changes.filter(x=>x.record).length} existing, ${changes.filter(x=>!x.record).length} to create. ${classification?'Primary classification: '+cls+'. ':''}${role?'Parental role: '+(rval||'Unspecified')+'. ':''}${legal?'Legal: '+lv+'. ':''}Other fields remain unchanged.`,()=>{
       for(const change of changes){let r=change.record;if(!r){if(!addRel('parentage',batchReference,change.id))throw Error('Cannot connect '+label(person(change.id))+' (duplicate or ancestry cycle)');r=data.relationships.find(x=>x.type==='parentage'&&x.from===batchReference&&x.to===change.id);}
         if(classification){const retained=(r.roles||[]).filter(x=>!['biological','adoptive','foster'].includes(x));r.roles=[...retained,...(cls==='unspecified'?[]:[cls])];}
         if(legal){const kept=(r.roles||[]).filter(x=>x!=='legal');r.roles=lv==='add'?[...kept,'legal']:kept;}
         if(role)r.parentRole=rval;
       }
     },rows);
   };
 }else if(batchTab==='partnership'){
   const pairs=batchPartnerLinks();root.innerHTML=`<h3>Partnerships</h3><p class="hint">Click partnership lines while selecting multiple, or select exactly two people to create a connection.</p>
    <div class="batchList">${pairs.length?pairs.map(r=>`<div>${escapeHtml(label(person(r.from)))} — ${escapeHtml(label(person(r.to)))} <button data-remove-partner="${r.id}">×</button></div>`).join(''):'No partnership lines selected'}</div>
    <label class="checkLine"><input id="changePartnerClass" type="checkbox">Change classification</label><div class="field"><select id="batchPartnerClass">${batchOptions([['partner','Partner'],['married','Married']])}</select></div>
    <label class="checkLine"><input id="changePartnerStatus" type="checkbox">Change status</label><div class="field"><select id="batchPartnerStatus">${batchOptions([['current','Current'],['separated','Separated'],['divorced','Divorced'],['former','Former'],['ended by death','Ended by death'],['historical','Historical'],['unknown','Unknown']])}</select></div>
    <label class="checkLine"><input id="createPartnership" type="checkbox">Connect the two selected people as partners (if not already connected)</label>
    <button class="primary" id="batchReview">Review partnership changes</button>`;
   root.querySelectorAll('[data-remove-partner]').forEach(b=>b.onclick=()=>selectBatchRelation(b.dataset.removePartner));
   root.querySelector('#batchReview').onclick=()=>{
     const create=root.querySelector('#createPartnership').checked,klass=root.querySelector('#changePartnerClass').checked,status=root.querySelector('#changePartnerStatus').checked,ids=[...batchPeople];
     if(create&&ids.length!==2)return notice('Select exactly two people to connect as partners');
     if(!create&&!pairs.length)return notice('Select partnership lines or choose Connect two people');
     if(!create&&!klass&&!status)return notice('Choose a partnership field');
     const cls=root.querySelector('#batchPartnerClass').value,st=root.querySelector('#batchPartnerStatus').value;
     const previewPairs=[...pairs];
     if(create&&ids.length===2&&!previewPairs.some(r=>[r.from,r.to].every(id=>ids.includes(id)))){
       const existing=data.relationships.find(r=>relKind(r)==='partnership'&&[r.from,r.to].every(id=>ids.includes(id)));
       previewPairs.push(existing||{from:ids[0],to:ids[1],classification:'partner',status:'current',_new:true});
     }
     const rows=previewPairs.flatMap(r=>{
       const name=relationshipName(r);
       return [previewField(name,'Record',r._new?'No link':'Existing partnership','Partnership link'),
         previewField(name,'Classification',r._new?'':r.classification,klass?cls:r.classification||'partner'),
         previewField(name,'Status',r._new?'':r.status,status?st:r.status||'current')];
     });
     reviewBatch('Edit partnerships',`${pairs.length} existing partnership records${create?' and one requested connection':''}. ${klass?'Classification: '+cls+'. ':''}${status?'Status: '+st+'. ':''}`,()=>{
       const targets=[...pairs];if(create){addRel('partnership',ids[0],ids[1]);const pair=data.relationships.find(r=>relKind(r)==='partnership'&&[r.from,r.to].every(id=>ids.includes(id)));if(pair&&!targets.includes(pair))targets.push(pair);}
       for(const r of targets){if(klass)r.classification=cls;if(status)r.status=st;}
     },rows);
   };
 }else{
   const group=batchGroup;const siblings=group?[...group.children]:[...batchPeople];root.innerHTML=`<h3>Parentage group</h3><p class="hint">Select a junction on the canvas to act on its recorded children. Adding a co-parent does not create a partnership.</p>
     ${group?`<p>${group.parents.length} parent${group.parents.length===1?'':'s'} · ${group.children.length} child${group.children.length===1?'':'ren'}</p><p class="small">Children: ${group.children.map(id=>escapeHtml(label(person(id)))).join(', ')}</p>`:'<p class="hint">No junction selected. You can still connect selected people as siblings below.</p>'}
     <div class="batchAction"><h4>Sibling connections</h4><p class="hint">Create explicit sibling relationships among the ${siblings.length} selected children/people. This does not infer shared biological parents and does not replace existing parentage.</p><button id="batchSiblingReview" class="primary" ${siblings.length>=2?'':'disabled'}>Review sibling connections</button></div>
     <div class="field"><label>Find an additional co-parent (junction required)</label><input ${group?'':'disabled'} id="batchCoSearch" placeholder="Search an existing person" autocomplete="off"><div id="batchCoResults" class="connectResults"></div></div>`;
   root.querySelector('#batchSiblingReview').onclick=()=>{
     const pairs=[];
     for(let i=0;i<siblings.length;i++)for(let j=i+1;j<siblings.length;j++){
       const a=siblings[i],b=siblings[j];
       if(!person(a)||!person(b))continue;
       const exists=data.relationships.find(r=>relKind(r)==='sibling'&&[r.from,r.to].includes(a)&&[r.from,r.to].includes(b));
       pairs.push({a,b,exists:Boolean(exists)});
     }
     const missing=pairs.filter(p=>!p.exists);
     if(!missing.length)return notice('Every selected pair already has an explicit sibling link.');
     const rows=pairs.map(({a,b,exists})=>previewField(`${label(person(a))} ↔ ${label(person(b))}`,'Sibling link',exists?'Exists':'Not recorded','Explicit sibling link'));
     reviewBatch('Connect siblings',`${missing.length} new explicit sibling relationships will be created among ${siblings.length} people. Existing relationships remain unchanged.`,()=>{
       for(const {a,b} of missing)if(!addRel('sibling',a,b))throw Error('Could not connect '+label(person(a))+' and '+label(person(b)));
     },rows);
   };
   const search=root.querySelector('#batchCoSearch'),results=root.querySelector('#batchCoResults');
   search.oninput=()=>{const q=search.value.trim();results.innerHTML=!group?'':!q?'<p class="hint">Search by name.</p>':data.people.filter(p=>!group.parents.includes(p.id)&&!group.children.includes(p.id)).map(p=>({p,score:searchScore(q,label(p))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>`<button class="personItem" data-co-id="${x.p.id}">${escapeHtml(label(x.p))}</button>`).join('')||'<p class="hint">No matching people.</p>';
     results.querySelectorAll('[data-co-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.coId;const missing=group.children.filter(child=>!data.relationships.some(r=>r.type==='parentage'&&r.from===id&&r.to===child));if(!missing.length)return notice('This person is already a recorded parent of every child in this group.');const rows=group.children.map(child=>previewField(`${label(person(id))} → ${label(person(child))}`,'Parentage',missing.includes(child)?'Not recorded':'Existing link','Parentage link'));reviewBatch('Add co-parent',`Connect ${label(person(id))} as an additional recorded parent of ${group.children.length} children. No partnership will be inferred.`,()=>{for(const child of missing)if(!addRel('parentage',id,child))throw Error('Cannot create parentage connection for '+label(person(child)));},rows);});};
 }
}
function previewField(subject,field,before,after){
 const format=v=>Array.isArray(v)?v.join(', ')||'None':v===undefined||v===null||v===''?'Not specified':String(v);
 return {subject,field,before:format(before),after:format(after)};
}
function previewTable(rows){
 if(!rows.length)return '<p class="hint">No record-level changes were supplied.</p>';
 return `<div class="batchPreviewScroll"><table class="batchPreview"><thead><tr><th>Record</th><th>Field</th><th>Current</th><th>Proposed</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.before===r.after?'previewUnchanged':'previewChanged'}"><td>${escapeHtml(r.subject)}</td><td>${escapeHtml(r.field)}</td><td>${escapeHtml(r.before)}</td><td>${escapeHtml(r.after)}</td></tr>`).join('')}</tbody></table></div>`;
}
function relationshipName(r){return `${label(person(r.from))} → ${label(person(r.to))}`;}
function previewParentage(before,after,name){
 return [previewField(name,'Record',before?'Existing link':'No link',after?'Parentage link':'No link'),
   previewField(name,'Primary type',(before?.roles||[]).filter(x=>['biological','adoptive','foster'].includes(x)),(after?.roles||[]).filter(x=>['biological','adoptive','foster'].includes(x))),
   previewField(name,'Parental role',before?.parentRole,after?.parentRole),
   previewField(name,'Legal parent',before?.roles?.includes('legal')?'Yes':'No',after?.roles?.includes('legal')?'Yes':'No')];
}
function reviewBatch(title,summary,operation,rows=[]){
 modal(title,`<p>${escapeHtml(summary)}</p>${previewTable(rows)}<div class="callout">Only the stated records and fields will change. Review your selection before applying. One-step Undo will be available.</div><div class="row spread"><button id="batchCancelReview">Cancel</button><button id="batchApplyReview" class="primary">Apply changes</button></div>`,root=>{
   root.querySelector('#batchCancelReview').onclick=closeModal;
   root.querySelector('#batchApplyReview').onclick=()=>{
     const prior=deep(data);try{operation();batchUndo=prior;clearBatchSelection();closeModal();save();notice('Batch changes applied. Undo is available in the selection workspace.');}
     catch(error){data=ensure(prior);notice('Batch cancelled: '+error.message);closeModal();render();}
   };
 });
}

function render(){drawSide();renderGraph();$('#collectionTitle').textContent=data.collection.title||'Local collection';}
$('#toggleNames').onclick=()=>{showNames=!showNames;applyView();};
$('#detailBackBtn').onclick=()=>{focus=null;focusBack=[];switchView('atlas');};
$('#traceBtn').onclick=chooseRoute;$('#addBtn').onclick=()=>newPerson(selected,'sibling');$('#zoomFit').onclick=fitAll;$('#zoomIn').onclick=()=>zoomAt(1.2,$('#stage').clientWidth/2,$('#stage').clientHeight/2);$('#zoomOut').onclick=()=>zoomAt(1/1.2,$('#stage').clientWidth/2,$('#stage').clientHeight/2);
$('#batchBtn').onclick=toggleBatchMode;
$('#searchBtn').onclick=()=>{modal('Find a person',`<div class="field"><label>Search by name</label><input id="globalSearch" placeholder="Search people…"></div><div id="searchResults"></div>`,root=>{const input=root.querySelector('input'),draw=()=>{const q=input.value.trim();root.querySelector('#searchResults').innerHTML=(q?data.people.map(p=>({p,score:searchScore(q,label(p))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25):data.people.map(p=>({p})).slice(0,25)).map(({p})=>`<button class="personItem" data-id="${p.id}"><span><strong>${escapeHtml(label(p))}</strong><small>${p.birth?'Born '+escapeHtml(p.birth):'Select to navigate'}</small></span></button>`).join('');root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(viewMode==='detail'&&!graphSubset().has(id)){focus=id;renderGraph();}
closeModal();selectPerson(id);fitPerson(id);});};input.oninput=draw;draw();input.focus();});};
$('#exportBtn').onclick=()=>modal('Export family atlas',`<p>JSON is the complete, portable archive. SVG exports the current graph view.</p><div class="stack"><button id="jsonExport">Download complete JSON archive</button><button id="svgExport">Download current graph as SVG</button></div>`,root=>{root.querySelector('#jsonExport').onclick=()=>{backup();closeModal();};root.querySelector('#svgExport').onclick=()=>{const x=$('#atlas').cloneNode(true);x.setAttribute('xmlns',svgNS);x.setAttribute('viewBox',`${graphBounds.x} ${graphBounds.y} ${graphBounds.w} ${graphBounds.h}`);x.removeAttribute('width');x.removeAttribute('height');x.querySelector('#world').setAttribute('transform','');const style=document.createElementNS(svgNS,'style');style.textContent='.generationRing{fill:none;stroke:#aaa;stroke-opacity:.45;stroke-width:1}.clusterCaption text{fill:#555;font:11px Arial}.clusterCaption .nameplate{fill:#fff;stroke:#bbb}.parentJunction{fill:#fff;stroke:#333;stroke-width:1.2}.link{fill:none;stroke:#888;stroke-width:1.5}.link.parentage{stroke:#333;stroke-width:1.7}.link.sibling{stroke:#aaa;stroke-width:1}.link.crossQuiet{stroke-opacity:.2}.link.partnership{stroke-dasharray:6 4}.link.guardian,.link.other,.link.sibling{stroke-dasharray:3 4}.personNode circle{fill:white;stroke:#222;stroke-width:1.5}.personNode text{fill:#111;font:12px Arial}.personNode .nameplate{fill:white;stroke:#bbb}.personNode .initial{font-weight:bold}.personNode .lifeMarker{fill:#222;stroke:#222}.edgeStatus.status-divorced rect,.edgeStatus.status-separated rect{fill:#f5d7d7;stroke:#a86d6d}.edgeStatus.status-former rect,.edgeStatus.status-historical rect,.edgeStatus.status-ended-by-death rect{fill:#fff1ba;stroke:#c5a95c}.personNode .lifeMarkText{fill:#fff;font-weight:bold;font-size:9px}.edgeStatus rect{fill:white;stroke:#777;stroke-width:.75}.edgeStatus text{fill:#222;font:bold 10px Arial}.link.routeLink{stroke:#111;stroke-width:5.5;stroke-dasharray:none}.componentCircle{fill:#fafafa;stroke:#222;stroke-width:1.5}.componentDot{fill:#555}.componentNode .nameplate{fill:#fff;stroke:#aaa}.componentName{fill:#111;font:bold 13px Arial}.componentCount{fill:#555;font:11px Arial}.edgeGroup.status-separated .link,.edgeGroup.status-divorced .link{stroke:#b87575}.edgeGroup.status-former .link,.edgeGroup.status-historical .link,.edgeGroup.status-ended-by-death .link{stroke:#c4a85e}';x.prepend(style);download(new XMLSerializer().serializeToString(x),'family-atlas.svg','image/svg+xml');closeModal();};});
$('#importBtn').onclick=()=>{$('#fileInput').value='';$('#fileInput').click();};$('#fileInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=ensure(JSON.parse(await f.text()));if(d.people.length>5000)throw Error('File has too many people for this version');beginImport(d);}catch(err){modal('Import error',`<p>${escapeHtml(err.message)}</p>`);}};
function sourceKey(collectionId,recordId){return `${collectionId}::${recordId}`;}
function mappedId(collectionId,recordId){return data.identityMappings.find(m=>m.sourceKey===sourceKey(collectionId,recordId))?.personId||null;}
function beginImport(incoming){importCandidate=incoming;importChoices={};const currentIds=new Set(data.people.map(p=>p.id));const potential=incoming.people.filter(p=>!mappedId(incoming.collection.id,p.id));function scorePerson(p,q){if(p.nameStatus==='unknown'||q.nameStatus==='unknown')return 0;const a=label(p).toLowerCase(),b=label(q).toLowerCase();let s=searchScore(a,b);if(a===b)s+=40;if(p.birth&&q.birth&&p.birth.slice(0,4)===q.birth.slice(0,4))s+=35;for(const r of incoming.relationships.filter(r=>related(r,p.id))){const n=incoming.people.find(x=>x.id===related(r,p.id));if(n&&data.relationships.some(k=>related(k,q.id)&&label(person(related(k,q.id))).toLowerCase()===label(n).toLowerCase()))s+=15;}return s;}
const candidates=potential.map(p=>({p,matches:data.people.map(q=>({q,score:scorePerson(p,q)})).filter(x=>x.score>=35).sort((a,b)=>b.score-a.score).slice(0,5)})).filter(x=>x.matches.length);modal('Review imported family',`<p class="muted small">${incoming.people.length} people · ${incoming.relationships.length} connections · ${candidates.length} possible matches. No identities will be merged automatically.</p><div class="callout">Each match is your decision. Keeping records separate preserves both people. Confirming an identity retains the existing working fields and records imported alternatives.</div><div id="importMatches">${candidates.map(({p,matches})=>`<div class="matchCard"><strong>${escapeHtml(label(p))}${p.birth?' · '+escapeHtml(p.birth):''}</strong><small class="muted">Imported record</small><div class="field"><label>Possible match</label><select data-import="${p.id}"><option value="">Keep separate (default)</option>${matches.map(({q,score})=>`<option value="${q.id}">${escapeHtml(label(q))}${q.birth?' · '+escapeHtml(q.birth):''} — suggested match</option>`).join('')}</select></div></div>`).join('')||'<p>No likely duplicate people identified.</p>'}</div><div class="row spread"><button id="cancelImport">Cancel</button><button id="applyImport" class="primary">Review and add collection</button></div>`,root=>{root.querySelector('#cancelImport').onclick=closeModal;root.querySelector('#applyImport').onclick=()=>{root.querySelectorAll('[data-import]').forEach(s=>importChoices[s.dataset.import]=s.value);previewImport();};});}
function previewImport(){const imp=importCandidate;const mapped=imp.people.filter(p=>importChoices[p.id]||mappedId(imp.collection.id,p.id)).length;modal('Confirm import',`<p><strong>${imp.people.length-mapped} new people</strong> and <strong>${mapped} reconciled people</strong> are proposed.</p><p class="hint">Identity matches will not overwrite existing names, dates or life status. Conflicting values are retained in source assertions. Existing relationship connections are not duplicated. Records absent from this contribution are never deleted.</p><div class="callout">A recovery snapshot will be downloaded before the import is applied. Keep it for restoration if needed.</div><div class="row spread"><button id="backImport">Back</button><button id="confirmImport" class="primary">Import collection</button></div>`,root=>{root.querySelector('#backImport').onclick=()=>beginImport(imp);root.querySelector('#confirmImport').onclick=()=>{backup();try{const stats=commitImport(imp,importChoices);closeModal();save();fitAll();notice(`Imported ${stats.newPeople} people and ${stats.newRelations} connections`);}catch(err){modal('Import error',`<p>${escapeHtml(err.message)}</p>`);}};});}
function commitImport(imp,choices){const map=new Map(),sourceId=uid(),cid=imp.collection.id;data.sources.push({id:sourceId,label:imp.collection.title||'Imported family',collectionId:cid,importedAt:new Date().toISOString()});let newPeople=0,newRelations=0;const used=new Set(data.people.map(p=>p.id));for(const p of imp.people){const key=sourceKey(cid,p.id);let id=mappedId(cid,p.id)||choices[p.id];if(!id){id=used.has(p.id)?uid():p.id;data.people.push({...deep(p),id,sourceRefs:[...new Set([...(p.sourceRefs||[]),sourceId])]});newPeople++;used.add(id);}else{const existing=person(id);if(!existing)throw Error('Imported mapping refers to a missing person');existing.sourceRefs=[...new Set([...(existing.sourceRefs||[]),sourceId])];for(const field of ['name','birth','death','lifeStatus','gender','notes']){const value=p[field],current=existing[field];if(value!==undefined&&value!==null&&value!==''&&current!==value){const ak=`${cid}|${p.id}|${field}|${JSON.stringify(value)}`;if(!data.assertions.some(a=>a.key===ak))data.assertions.push({key:ak,id:uid(),personId:id,field,value,sourceId,status:'unresolved'});}}}
map.set(p.id,id);if(!data.identityMappings.some(x=>x.sourceKey===key))data.identityMappings.push({sourceKey:key,personId:id});}
for(const r of imp.relationships){const from=map.get(r.from),to=map.get(r.to);if(!from||!to||from===to){continue;}const incoming={...deep(r),from,to,id:uid(),sourceRefs:[...new Set([...(r.sourceRefs||[]),sourceId])]};const existing=data.relationships.find(x=>sameRel(x,incoming));if(existing){existing.sourceRefs=[...new Set([...(existing.sourceRefs||[]),sourceId])];if(r.roles)existing.roles=[...new Set([...(existing.roles||[]),...r.roles])];if(existing.status&&r.status&&existing.status!==r.status&&!data.assertions.some(a=>a.relationshipId===existing.id&&a.field==='status'&&a.value===r.status&&a.originKey===sourceKey(cid,r.id)))data.assertions.push({id:uid(),relationshipId:existing.id,field:'status',value:r.status,sourceId,originKey:sourceKey(cid,r.id),status:'unresolved'});continue;}if(incoming.type==='parentage'&&wouldCycle(data.relationships,from,to)){data.assertions.push({id:uid(),field:'rejectedParentage',value:{from,to},sourceId,status:'unresolved'});continue;}data.relationships.push(incoming);newRelations++;}
data.importHistory.push({id:uid(),collectionId:cid,sourceId,importedAt:new Date().toISOString(),newPeople,newRelations});return{newPeople,newRelations};}
$('#menuBtn').onclick=()=>{const last=Number(localStorage.getItem(KEY+'-lastbackup')||0);modal('Collection management',`<p class="small muted">${data.people.length} people · ${data.relationships.length} relationships</p><div class="field"><label>Collection title</label><input id="renameCollection" value="${escapeHtml(data.collection.title||'Family Atlas')}"></div><div class="stack"><button id="renameSave">Rename collection</button><button id="loadSample">Load extensive fictional sample (replaces current collection)</button><button id="newCollection">Start empty collection</button><button id="downloadBackup">Download JSON backup</button></div><p class="hint">Last downloaded backup: ${last?new Date(last).toLocaleDateString():'No backup recorded'}. Browser data may be lost when site data is cleared.</p>`,root=>{root.querySelector('#renameSave').onclick=()=>{data.collection.title=root.querySelector('#renameCollection').value.trim()||'Family Atlas';closeModal();save();};root.querySelector('#downloadBackup').onclick=()=>{backup();notice('JSON archive downloaded');};root.querySelector('#newCollection').onclick=()=>{if(!confirm('Replace your current collection with an empty one? Export a backup first.'))return;backup();data=blank();selected=focus=null;viewMode='atlas';closeModal();save();fitAll();};root.querySelector('#loadSample').onclick=async()=>{if(!confirm('Replace your current collection with the extensive fictional sample? A JSON backup will download first.'))return;try{const r=await fetch('samples/extensive-family.json');if(!r.ok)throw Error('Sample is not available');const d=ensure(await r.json());backup();data=d;selected=focus=null;viewMode='atlas';closeModal();save();fitAll();}catch(err){notice(err.message);}};});};
render();fitAll();window.addEventListener('resize',()=>applyView());if(data.people.length===0){notice('Start with Add person, or load the extensive sample from More.');}else{const last=Number(localStorage.getItem(KEY+'-lastbackup')||0);if(Date.now()-last>14*86400000)setTimeout(()=>notice('Consider exporting a JSON backup of your family atlas.'),900);}
