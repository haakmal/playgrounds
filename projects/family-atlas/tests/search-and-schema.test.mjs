import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const js=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const helper=js.slice(js.indexOf('export function searchScore('),js.indexOf('function escapeHtml(s){')).replace('export function','function');
const context={};vm.runInNewContext(helper+';this.score=searchScore',context);
const score=context.score;
assert.ok(score('Ahmed','Ahmed')>score('Amed','Ahmed'));
assert.ok(score('Amed','Ahmed')>0);
assert.ok(score('Maria','Maria Farooq')>score('Mira','Maria Farooq'));
assert.equal(score('Zzzz','Maria Farooq'),0);
assert.ok(score('farooq','Maria Farooq')>0);
const shell=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(shell,/id="junctions"/);
assert.match(js,/personName/);
assert.match(js,/function orderConnections/);
assert.match(js,/function genderOptions/);
for(const name of ['three-children-partners','ten-children-rings','extensive-family','cross-ring-partnership','contribution','contribution-updated']){
 const data=JSON.parse(fs.readFileSync(new URL(`../samples/${name}.json`,import.meta.url),'utf8'));
 const ids=new Set(data.people.map(p=>p.id));
 assert.ok(data.relationships.every(r=>ids.has(r.from)&&ids.has(r.to)));
}
console.log('PASS fuzzy matching, schema, six sample collections');
