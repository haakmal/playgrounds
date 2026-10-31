/** Family Atlas: pure display calculations. No coordinates are persisted to JSON. */
export function findComponents(people, relationships) {
  const valid = new Set(people.map(p => p.id));
  const neighbours = new Map([...valid].map(id => [id, new Set()]));
  for (const r of relationships) if (valid.has(r.from) && valid.has(r.to) && r.from !== r.to) {
    neighbours.get(r.from).add(r.to); neighbours.get(r.to).add(r.from);
  }
  const seen = new Set(), result = [];
  for (const p of people) if (!seen.has(p.id)) {
    const queue = [p.id], group = []; seen.add(p.id);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i]; group.push(id);
      for (const next of neighbours.get(id)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    result.push(group);
  }
  return result.sort((a,b) => b.length - a.length);
}

export function parentageUnits(ids, relationships) {
  const nodes = new Set(ids), byChild = new Map();
  for (const r of relationships) if (r.type === 'parentage' && nodes.has(r.from) && nodes.has(r.to) && r.from !== r.to) {
    if (!byChild.has(r.to)) byChild.set(r.to, new Set());
    byChild.get(r.to).add(r.from);
  }
  const units = new Map();
  for (const [child, parentSet] of byChild) {
    const parents = [...parentSet].sort();
    const key = parents.join('|');
    if (!units.has(key)) units.set(key, {key, parents, children: []});
    units.get(key).children.push(child);
  }
  return [...units.values()];
}

function depthMap(ids, relationships) {
  const members = new Set(ids), depth = new Map(ids.map(id => [id,0]));
  const adjacency = new Map(ids.map(id => [id,[]]));
  const indegree = new Map(ids.map(id => [id,0]));
  for (const r of relationships) if (r.type === 'parentage' && members.has(r.from) && members.has(r.to) && r.from !== r.to) {
    adjacency.get(r.from).push(r.to); indegree.set(r.to,indegree.get(r.to)+1);
  }
  const queue = ids.filter(id => indegree.get(id) === 0);
  for (let i=0; i<queue.length; i++) {
    const id = queue[i];
    for (const child of adjacency.get(id)) {
      depth.set(child,Math.max(depth.get(child),depth.get(id)+1));
      indegree.set(child,indegree.get(child)-1);
      if (!indegree.get(child)) queue.push(child);
    }
  }
  // A malformed incoming cycle cannot hang the renderer. Validation stays in the data layer.
  const structural = new Set([...adjacency].filter(([id,children]) => children.length ||
    relationships.some(r => r.type === 'parentage' && r.to === id && members.has(r.from))).map(([id]) => id));
  // Co-parents who have no recorded ancestors can occupy the same descendant band.
  // Recorded ancestry takes precedence if the parents truly have different depths.
  const hasOwnParents = new Set(relationships.filter(r => r.type === 'parentage' && members.has(r.from) && members.has(r.to)).map(r => r.to));
  for(let pass=0;pass<ids.length+1;pass++){
    let changed=false;
    const childParents=new Map();
    for(const r of relationships) if(r.type==='parentage' && members.has(r.from) && members.has(r.to)){
      if(!childParents.has(r.to))childParents.set(r.to,[]);
      childParents.get(r.to).push(r.from);
    }
    for(const [child,parents] of childParents){
      const deepest=Math.max(...parents.map(id=>depth.get(id)));
      for(const id of parents)if(!hasOwnParents.has(id)&&depth.get(id)<deepest){depth.set(id,deepest);changed=true;}
      if(depth.get(child)<deepest+1){depth.set(child,deepest+1);changed=true;}
    }
    for(const r of relationships) if(['partnership','marriage'].includes(r.type)&&members.has(r.from)&&members.has(r.to)){
      if(!structural.has(r.from)&&depth.get(r.from)!==depth.get(r.to)){depth.set(r.from,depth.get(r.to));changed=true;}
      if(!structural.has(r.to)&&depth.get(r.to)!==depth.get(r.from)){depth.set(r.to,depth.get(r.from));changed=true;}
    }
    if(!changed)break;
  }
  return depth;
}

function orderByRelationships(ids, relationships, depth, nameOf) {
  const levels = new Map();
  for (const id of ids) {const d=depth.get(id)||0; if(!levels.has(d)) levels.set(d,[]);levels.get(d).push(id);}
  const directParents = new Map(ids.map(id=>[id,[]]));
  for (const r of relationships) if(r.type==='parentage' && directParents.has(r.to) && directParents.has(r.from)) directParents.get(r.to).push(r.from);
  const lastOrder = new Map();
  for(const level of [...levels.keys()].sort((a,b)=>a-b)) {
    const row = levels.get(level).sort((a,b)=>nameOf(a).localeCompare(nameOf(b)));
    const unions = new Map(row.map(id=>[id,id]));
    const find = id => unions.get(id) === id ? id : (unions.set(id,find(unions.get(id))),unions.get(id));
    for (const r of relationships) if (['partnership','marriage'].includes(r.type) && unions.has(r.from) && unions.has(r.to)) {
      const a=find(r.from),b=find(r.to);if(a!==b)unions.set(a,b);
    }
    const blocks = new Map();
    for(const id of row){const key=find(id);if(!blocks.has(key))blocks.set(key,[]);blocks.get(key).push(id);}
    const weight=block=>{
      const above=block.flatMap(id=>directParents.get(id).filter(p=>lastOrder.has(p)).map(p=>lastOrder.get(p)));
      return above.length?above.reduce((a,b)=>a+b,0)/above.length:null;
    };
    const ordered=[...blocks.values()].sort((a,b)=>{
      const wa=weight(a),wb=weight(b);
      return (wa===null?99999:wa)-(wb===null?99999:wb) || nameOf(a[0]).localeCompare(nameOf(b[0]));
    }).flatMap(block=>block.sort((a,b)=>nameOf(a).localeCompare(nameOf(b))));
    ordered.forEach((id,i)=>lastOrder.set(id,i));
    levels.set(level,ordered);
  }
  return levels;
}

function polar(radius, angle) {return {x: radius*Math.cos(angle), y:radius*Math.sin(angle), angle, radius};}

/** Returns stable, approximate radial-generation coordinates and ring metadata. */
export function radialComponent(ids, relationships, nameOf) {
  if (!ids.length) return {positions:new Map(), rings:[], units:[]};
  const relevant=relationships.filter(r=>ids.includes(r.from)&&ids.includes(r.to));
  const depth=depthMap(ids,relevant), levels=orderByRelationships(ids,relevant,depth,nameOf);
  const positions=new Map(), rings=[];
  let lastRadius=0;
  for(const d of [...levels.keys()].sort((a,b)=>a-b)){
    const row=levels.get(d),count=row.length;
    // Long names are handled by a label's background and generous ring circumference.
    const circumferenceRadius=count*142/(2*Math.PI);
    const r=Math.max(d===0?90:0, d===0?circumferenceRadius: lastRadius+170, circumferenceRadius);
    lastRadius=r;
    rings.push({depth:d,radius:r,count});
    row.forEach((id,i)=>{
      const a=-Math.PI/2+(i+0.5)*2*Math.PI/count;
      // Two small radial tracks permit partnership blocks to sit in one broad band.
      const offset = count>3 && i%2 ? 14 : 0;
      positions.set(id,{...polar(r+offset,a),depth:d});
    });
  }
  return {positions,rings,units:parentageUnits(ids,relevant)};
}

/** Independent networks have their own concentric centres; position circles without overlap. */
export function radialAtlas(people,relationships,nameOf) {
  const groups=findComponents(people,relationships),components=[],positions=new Map();
  let cursorX=0,cursorY=0,rowHeight=0;
  const maxWidth=Math.max(1600,Math.sqrt(people.length)*750);
  for(const group of groups) {
    const local=radialComponent(group,relationships,nameOf);
    const radius=Math.max(145,...local.rings.map(r=>r.radius))+110;
    const span=radius*2+90;
    if(cursorX>0 && cursorX+span>maxWidth) {cursorX=0;cursorY+=rowHeight+100;rowHeight=0;}
    const cx=cursorX+radius,cy=cursorY+radius;
    for(const [id,p] of local.positions) positions.set(id,{...p,x:p.x+cx,y:p.y+cy});
    components.push({...local,ids:group,cx,cy,radius});
    cursorX+=span+50;rowHeight=Math.max(rowHeight,span);
  }
  return {positions,components};
}

/** A focused, top-to-bottom presentation; no separate permanent family identity. */
export function lineageDetail(ids, relationships, nameOf) {
  const membership=new Set(ids);
  const relevant=relationships.filter(r=>membership.has(r.from)&&membership.has(r.to));
  const depth=depthMap(ids,relevant), levels=orderByRelationships(ids,relevant,depth,nameOf);
  const positions=new Map();
  let width=0;
  for(const [d,row] of [...levels].sort((a,b)=>a[0]-b[0])){
    const step=184, span=(row.length-1)*step;
    width=Math.max(width,span+200);
    row.forEach((id,i)=>positions.set(id,{x:i*step-span/2,y:d*190,depth:d}));
  }
  return {positions,units:parentageUnits(ids,relevant)};
}
