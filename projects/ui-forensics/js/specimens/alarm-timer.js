export function render(root) {
    root.innerHTML = `<div class="specimen-shell s24"><div class="specimen-mobile"><div class="specimen-topbar"><strong>Alarms</strong><span>Tomorrow</span></div><div class="alarm-shell"><div class="alarm-card"><div class="time-face">07:30</div><p class="specimen-muted">Tomorrow · alarm</p><div class="alarm-field"><label>Repeat</label><select><option>Once</option><option>Weekdays</option></select></div><div class="alarm-row"><span>Save alarm</span><button id="s24-save">Save</button></div><div id="s24-note" class="alarm-row" hidden><span>Alarm</span><strong>Active</strong></div></div></div></div></div>`;
    root.querySelector('#s24-save').addEventListener('click', () => root.querySelector('#s24-note').hidden = false);
}
