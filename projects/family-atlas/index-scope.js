
/** View-only descendant indexing. Records are never copied or modified. */
export function descendantScope(people,relations,starting,depth,stop=null){
 const valid=new Set(people.map(p=>p.id)),roots=starting.filter(id=>valid.has(id));
 const shown=new Set(roots),traversed=new Set(roots);
 const children=new Map();
 for(const r of relations)if(r.type==='parentage'&&valid.has(r.from)&&valid.has(r.to)){
   if(!children.has(r.from))children.set(r.from,[]);
   children.get(r.from).push(r.to);
 }
 let frontier=roots;
 for(let i=0;i<Math.max(0,Math.min(30,Number(depth)||0));i++){
   const next=[];
   for(const id of frontier){
     if(id===stop)continue;
     for(const child of children.get(id)||[])if(!traversed.has(child)){
       traversed.add(child);shown.add(child);next.push(child);
     }
   }
   frontier=next;if(!frontier.length)break;
 }
 const descendants=new Set(shown);
 for(const r of relations){
   if(['partnership','marriage'].includes(r.type)){
     if(descendants.has(r.from)&&valid.has(r.to))shown.add(r.to);
     if(descendants.has(r.to)&&valid.has(r.from))shown.add(r.from);
   }
   if(r.type==='parentage'&&descendants.has(r.to)&&!roots.includes(r.to)&&valid.has(r.from))shown.add(r.from);
 }
 return shown;
}
