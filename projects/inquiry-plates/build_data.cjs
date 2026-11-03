const fs=require('fs'),vm=require('vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync('/mnt/data/inquiry-plates-v2/data.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('/mnt/data/inquiry-plates-v3/data.js','utf8'),ctx);
const plates=[];
for(const mode of ['discovery','concept']) for(const p of ctx.window.PROVOCATIONS[mode]) {
 const annotations={}; for(const role of ['focus','action','opening']) annotations[role]={label:p[role][0],questions:[p[role][1]]};
 plates.push({id:p.id,mode,statement:p.text,annotations});
}
const modules={};for(const mode of ['discovery','concept']){modules[mode]={};for(const role of ['focus','action','opening']) modules[mode][role]=ctx.window.INQUIRY_MODULES[mode][role].map(([label,question],i)=>({id:`${mode[0].toUpperCase()}-${role.toUpperCase()}-${String(i+1).padStart(2,'0')}`,label,questions:[question]}));}
fs.writeFileSync('/mnt/data/inquiry-plates-v4/plates.json',JSON.stringify({schemaVersion:1,plates,modules},null,2)+'\n');
console.log('Created',plates.length,'plates and',Object.values(modules).flatMap(m=>Object.values(m)).reduce((n,a)=>n+a.length,0),'modules');
