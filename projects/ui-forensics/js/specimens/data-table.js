export function render(root) {
const rows=[['Atlas','Open','Today'],['Birch','Pending','Yesterday'],['Cedar','Open','Monday'],['Delta','Closed','Friday']];
root.innerHTML = `<div class="specimen-shell s14"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Records</strong><span>214 entries</span></div><div class="table-shell"><table><thead><tr><th></th><th><button id="s14-name">Name</button></th><th><button id="s14-status">Status</button></th><th>Updated</th><th>Action</th></tr></thead><tbody>${rows.map(r=>`<tr><td><input type="checkbox" data-select></td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><button class="row-action" data-row>View</button></td></tr>`).join('')}</tbody></table><div class="specimen-actions" style="margin-top:14px"><button id="s14-bulk">Apply to selected</button></div><div id="s14-feedback" class="specimen-message" hidden></div></div></div></div>`;
function sort(col){const body=root.querySelector('tbody'); [...body.rows].sort((a,b)=>a.cells[col].textContent.localeCompare(b.cells[col].textContent)).forEach(r=>body.appendChild(r));}
root.querySelector('#s14-name').addEventListener('click',()=>sort(1)); root.querySelector('#s14-status').addEventListener('click',()=>sort(2));
root.querySelectorAll('[data-row]').forEach(b=>b.addEventListener('click',()=>{}));
root.querySelector('#s14-bulk').addEventListener('click',()=>{const n=root.querySelectorAll('[data-select]:checked').length; const f=root.querySelector('#s14-feedback'); f.textContent=n?`Action completed.`:'Action completed.'; f.hidden=false;});
}
