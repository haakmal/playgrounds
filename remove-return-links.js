/**
 * Removes both legacy return links and the Playgrounds utility injection.
 * Run from repository root: node remove-return-links.js
 */
const fs = require('node:fs');
const path = require('node:path');
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  console.error('Missing projects/ directory.');
  process.exit(1);
}
let removed = 0;
for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const filename = path.join(projectsDir, entry.name, 'index.html');
  if (!fs.existsSync(filename)) continue;
  const original = fs.readFileSync(filename, 'utf8');
  const updated = original
    .replace(/<!-- BEGIN RETURN LINK -->[\s\S]*?<!-- END RETURN LINK -->\s*/gi, '')
    .replace(/<!-- BEGIN PLAYGROUNDS UTILITY -->[\s\S]*?<!-- END PLAYGROUNDS UTILITY -->\s*/gi, '');
  if (updated !== original) {
    fs.writeFileSync(filename, updated, 'utf8');
    removed++;
    console.log(`Removed: ${entry.name}/index.html`);
  }
}
console.log(`Removed utility/legacy links from ${removed} project(s).`);
