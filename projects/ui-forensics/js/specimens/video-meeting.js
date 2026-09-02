export function render(root) {
    root.innerHTML = `<div class="specimen-shell s35"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Northline Meet</strong><span>Project review</span></div><div class="meeting-shell"><div class="meeting-grid"><section class="device-card"><div class="preview-screen">Camera preview</div><div class="meeting-actions"><button id="s35-mic">◼ Microphone</button><button id="s35-cam">● Camera</button></div></section><aside class="device-card"><p class="specimen-muted">Preview state</p><div>Microphone muted</div><div>Camera on</div><button id="s35-join">Join meeting</button></aside></div></div></div></div>`;
    root.querySelector('#s35-join').addEventListener('click', () => root.querySelector('#s35-mic').textContent='● Microphone');
}
