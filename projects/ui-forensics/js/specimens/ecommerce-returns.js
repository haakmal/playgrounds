export function render(root) {
    root.innerHTML = `<div class="specimen-shell s38"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Northline Market</strong><span>Returns</span></div><div class="returns-shell"><div class="returns-grid"><section class="return-card"><div id="s38-form"><div class="return-item"><input id="s38-a" type="checkbox"><span>Black notebook</span><span>$16</span></div><div class="return-item"><input type="checkbox"><span>Desk tray</span><span>$48</span></div><textarea id="s38-reason" class="specimen-input" rows="4" placeholder="Reason for return" style="margin-top:12px"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button id="s38-back">Back</button><button id="s38-submit">Request return</button></div></div><div id="s38-summary" hidden><p><strong>Order summary</strong></p><p class="specimen-muted">Return item: Black notebook</p><button id="s38-forward">Continue return</button></div></section><aside class="return-card"><strong>Return status</strong><div class="return-state">Requested → Processing → Pending → Accepted</div></aside></div></div></div></div>`;
    const form=root.querySelector('#s38-form');
    const summary=root.querySelector('#s38-summary');
    root.querySelector('#s38-back').addEventListener('click',()=>{ form.hidden=true; summary.hidden=false; });
    root.querySelector('#s38-forward').addEventListener('click',()=>{ form.hidden=false; summary.hidden=true; });
    root.querySelector('#s38-submit').addEventListener('click',()=>root.querySelector('#s38-reason').value='');
}
