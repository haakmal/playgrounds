
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
for(const id of ['indexStart','indexStop','indexFrom','indexTo'])
  assert.ok(app.includes(`indexPicker('${id}'`),id);
assert.ok(app.includes('searchScore(q,p.name)'));
assert.ok(app.includes('chosenIndexPerson'));
assert.ok(html.includes('id="toggleGender"'));
assert.ok(app.includes("showGender&&(gender==='female'||gender==='male')"));
assert.ok(css.includes('circle.genderRing.gender-female'));
assert.ok(css.includes('circle.genderRing.gender-male'));
assert.ok(css.includes('batchChosen circle.genderRing'));
assert.ok(app.includes('.genderRing.gender-female{stroke:#e5a2bd}'),'SVG export style missing');
console.log('PASS Index searchable pickers and gender overlay rendering contracts');
