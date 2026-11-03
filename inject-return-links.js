/**
 * Playgrounds utility injector. Run ONCE for initial installation and again
 * only when new project directories are added.
 *
 * This script does NOT build configuration. Jekyll reads
 * _data/playgrounds_utility.yml and renders the JSON endpoint automatically.
 * No external Node packages required.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const projectDir = path.join(root, 'projects');
const dataPath = path.join(root, '_data', 'playgrounds_utility.yml');
const legacy = /<!-- BEGIN RETURN LINK -->[\s\S]*?<!-- END RETURN LINK -->\s*/gi;
const injected = /<!-- BEGIN PLAYGROUNDS UTILITY -->[\s\S]*?<!-- END PLAYGROUNDS UTILITY -->\s*/gi;
const validSlug = slug => /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug);

if (!fs.existsSync(projectDir)) throw new Error('Missing projects/ in repository root');
if (!fs.existsSync(dataPath)) throw new Error('Missing _data/playgrounds_utility.yml');

const planned = [];
for (const entry of fs.readdirSync(projectDir, {withFileTypes:true})) {
  if (!entry.isDirectory() || !validSlug(entry.name)) continue;
  const filename = path.join(projectDir, entry.name, 'index.html');
  if (!fs.existsSync(filename)) continue;
  const before = fs.readFileSync(filename, 'utf8');
  if (!/<\/body\s*>/i.test(before)) { console.warn('Skipped (no body):', entry.name); continue; }
  const clean = before.replace(legacy,'').replace(injected,'');
  const block = `<!-- BEGIN PLAYGROUNDS UTILITY -->\n<script defer src="/assets/playgrounds-utility.js" data-playgrounds-utility data-project="${entry.name}"></script>\n<!-- END PLAYGROUNDS UTILITY -->\n`;
  const after = clean.replace(/<\/body\s*>/i, block + '</body>');
  planned.push({slug:entry.name,filename,before,after});
}

// Keep annotations intact: append only new slug keys to the last YAML
// top-level 'projects:' section. Jekyll parses the complete YAML at build.
let yaml = fs.readFileSync(dataPath,'utf8');
const lines = yaml.split(/\r?\n/);
const projectIndices = lines.map((line,i)=> /^projects:\s*(?:\{\s*\})?\s*(?:#.*)?$/.test(line)?i:-1).filter(i=>i>=0);
if (projectIndices.length !== 1) throw new Error('Expected exactly one top-level projects: mapping in YAML');
const pos = projectIndices[0];
if (lines.slice(pos+1).some(line=>/^[^\s#][^:]*:\s*/.test(line))) {
  throw new Error('Expected projects: to be the final top-level YAML section. Move projects: to end of file.');
}
const existing = new Set();
for (const line of lines.slice(pos+1)) {
  const match = line.match(/^  ([A-Za-z0-9][A-Za-z0-9_-]*):(?:\s|$)/);
  if (match) existing.add(match[1]);
}
const missing = planned.map(x=>x.slug).filter(slug=>!existing.has(slug)).sort();
if (missing.length) {
  lines[pos] = lines[pos].replace(/\{\s*\}/,'').replace(/\s+$/,'');
  // Trim only trailing blank lines before appending; leave every comment intact.
  while(lines.length>pos+1 && lines[lines.length-1]==='')lines.pop();
  lines.push('',...missing.map(slug=>`  ${slug}: {}`),'');
  yaml=lines.join('\n');
  fs.writeFileSync(dataPath,yaml,'utf8');
}
let changed=0;
for(const item of planned) if(item.before!==item.after) {
  fs.writeFileSync(item.filename,item.after,'utf8');
  console.log('Updated:',item.slug);changed++;
}
console.log(`Playgrounds utility: ${changed} HTML files updated; ${missing.length} YAML project entries added.`);
console.log('Settings are applied by Jekyll automatically; no JSON sync is required.');
