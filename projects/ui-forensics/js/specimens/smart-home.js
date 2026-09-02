export function render(root) {
    root.innerHTML = `<div class="specimen-shell s33"><div class="specimen-tablet"><div class="specimen-topbar"><strong>Northline Home</strong><span>Bedroom</span></div><div class="smart-shell"><div class="room-card"><div class="device-tile"><strong>Bedroom light</strong><div class="device-action"><span id="s33-light-label">OFF</span><button id="s33-light">OFF</button></div></div><div class="device-tile" style="margin-top:10px"><strong>Thermostat</strong><div class="device-action"><span>Current 19°C</span><button>21°C</button></div></div></div></div></div></div>`;
    let timer=null;
    root.querySelector('#s33-light').addEventListener('click', () => { const button=root.querySelector('#s33-light'); button.disabled=true; clearTimeout(timer); timer=setTimeout(()=>{ button.disabled=false; root.querySelector('#s33-light-label').textContent='OFF'; },1800); });
}
