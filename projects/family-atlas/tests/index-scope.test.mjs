
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {descendantScope} from '../index-scope.js';
import {parentageUnits} from '../radial-layout.js';

for(const name of ['three-children-partners','ten-children-rings','extensive-family','cross-ring-partnership']){
 const d=JSON.parse(fs.readFileSync(new URL('../samples/'+name+'.json',import.meta.url),'utf8'));
 const start=d.people[0].id;
 const entire=descendantScope(d.people,d.relationships,[start],30);
 const short=descendantScope(d.people,d.relationships,[start],1);
 assert.ok(entire.has(start) && short.has(start));
 assert.ok([...entire].every(id=>d.people.some(p=>p.id===id)));
 const stopped=descendantScope(d.people,d.relationships,[start],30,start);
 assert.ok(stopped.has(start));
 assert.ok(stopped.size<=entire.size);
 const units=parentageUnits(d.people.map(p=>p.id),d.relationships);
 if(units.length){
  const context=descendantScope(d.people,d.relationships,units[0].parents,2);
  assert.ok(units[0].parents.every(id=>context.has(id)));
 }
 console.log('PASS scope',name);
}
