import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const pick=(begin,end)=>source.slice(source.indexOf(begin),source.indexOf(end,source.indexOf(begin)));
const functions=[
  pick('function sameGroup(', 'function clearBatchSelection('),
  pick('function batchParentageTargets(', 'function batchParentageLinks('),
  pick('function batchParentageLinks(', 'function batchPartnerLinks('),
  pick('function wouldCycle(', 'function notice('),
].join('\n');
const people=[{id:'parent1',name:'One'},{id:'parent2',name:'Two'},{id:'childA',name:'Three'},{id:'childB',name:'Four'}];
const relationships=[{id:'r1',type:'parentage',from:'parent1',to:'childA'}, {id:'r2',type:'parentage',from:'parent1',to:'childB'}];
const data={people,relationships};
const ctx={data,person:id=>people.find(p=>p.id===id),batchPeople:new Set(people.map(p=>p.id)),batchReference:'parent1',batchGroup:{parents:['parent1','parent2'],children:['childA','childB']}};
vm.createContext(ctx);
vm.runInContext(functions+';this.api={sameGroup,batchParentageTargets,batchParentageLinks,wouldCycle}',ctx);
assert.equal(ctx.api.sameGroup(ctx.batchGroup,{parents:['parent2','parent1'],children:['childB','childA']}),true);
assert.deepEqual(Array.from(ctx.api.batchParentageTargets()),['childA','childB']);
assert.equal(ctx.api.batchParentageLinks().length,2);
assert.equal(ctx.api.wouldCycle(relationships,'childA','parent1'),true);
assert.equal(ctx.api.wouldCycle(relationships,'parent2','childA'),false);
ctx.batchGroup=null;
assert.equal(ctx.api.batchParentageTargets().length,3);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="batchBtn"/);
assert.ok(source.includes("b.querySelector('#downChoice')?.addEventListener('change'"));
assert.ok(!source.includes('crossBridgeUnderlay'));
console.log('PASS junction selection, parentage targets, cycle protection, navigation and regression rollback');
