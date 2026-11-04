import assert from 'node:assert/strict';
import {lineageDetail,orderPartnerBlock} from '../radial-layout.js';

// Two brothers partnered with the same spouse, one after the other's death.
// The recorded partnership links are A-S and B-S, never A-B.
const ids=['parent1','parent2','brother1','brother2','spouse','child1','child2'];
const names=new Map([
 ['parent1','Elder A'],['parent2','Elder B'],
 ['brother1','Aaron'],['brother2','Ben'],['spouse','Zara'],
 ['child1','First child'],['child2','Second child']
]);
const relations=[
 {type:'parentage',from:'parent1',to:'brother1'},
 {type:'parentage',from:'parent2',to:'brother1'},
 {type:'parentage',from:'parent1',to:'brother2'},
 {type:'parentage',from:'parent2',to:'brother2'},
 {type:'partnership',from:'brother1',to:'spouse',status:'ended by death'},
 {type:'partnership',from:'brother2',to:'spouse',status:'current'},
 {type:'parentage',from:'brother1',to:'child1'},
 {type:'parentage',from:'spouse',to:'child1'},
 {type:'parentage',from:'brother2',to:'child2'},
 {type:'parentage',from:'spouse',to:'child2'}
];
const order=orderPartnerBlock(['brother1','brother2','spouse'],relations,id=>names.get(id));
assert.equal(order[1],'spouse');
const layout=lineageDetail(ids,relations,id=>names.get(id));
const a=layout.positions.get('brother1'),b=layout.positions.get('brother2'),s=layout.positions.get('spouse');
assert.equal(a.y,b.y);assert.equal(a.y,s.y);
assert.ok((a.x<s.x&&s.x<b.x)||(b.x<s.x&&s.x<a.x), 'Shared spouse must lie between brothers');
assert.ok(!relations.some(r=>r.type==='partnership'&&new Set([r.from,r.to]).has('brother1')&&new Set([r.from,r.to]).has('brother2')));
console.log('PASS historical successive partnerships use shared spouse as central node');
