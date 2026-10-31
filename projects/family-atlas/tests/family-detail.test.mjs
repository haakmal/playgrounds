
import fs from 'node:fs';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../radial-layout.js',import.meta.url),'utf8');
const {lineageDetail,parentageUnits}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const name of ['three-children-partners','ten-children-rings','extensive-family','cross-ring-partnership','contribution','contribution-updated']){
  const d=JSON.parse(fs.readFileSync(new URL(`../samples/${name}.json`,import.meta.url),'utf8'));
  const names=new Map(d.people.map(p=>[p.id,p.name||'Unknown']));
  const l=lineageDetail(d.people.map(p=>p.id),d.relationships,id=>names.get(id));
  assert.equal(l.positions.size,d.people.length);
  for(const [id,p] of l.positions)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),id);
  for(const r of d.relationships.filter(r=>r.type==='partnership')){
    const a=l.positions.get(r.from),b=l.positions.get(r.to);
    if(a.y===b.y)assert.ok(Math.abs(a.x-b.x)<=184,'Partners separated: '+name);
  }
  if(name==='three-children-partners'){
    for(const unit of parentageUnits(d.people.map(p=>p.id),d.relationships)){
      if(unit.parents.length!==2||unit.children.length!==1)continue;
      const parents=unit.parents.map(id=>l.positions.get(id)),child=l.positions.get(unit.children[0]);
      assert.equal(child.x,(parents[0].x+parents[1].x)/2,'Grandchild displaced from own couple');
    }
  }
  console.log('PASS',name);
}
