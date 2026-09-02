export function render(root) {
    root.innerHTML = `<div class="specimen-shell s31"><div class="specimen-tablet"><div class="specimen-topbar"><strong>Photos</strong><span>Fieldwork</span></div><div class="photo-shell"><div class="photo-grid">${['A','B','C','D','E','F'].map(letter => `<button class="photo" data-photo="${letter}">${letter}</button>`).join('')}</div><div class="album-action" style="margin-top:12px"><strong>Album</strong><p class="specimen-muted">Select three photographs, then long-press one selected image for more actions.</p><button id="s31-move" hidden>Move to Fieldwork</button></div></div></div></div>`;
    let selected=0;
    root.querySelectorAll('.photo').forEach(photo => {
        photo.addEventListener('click', () => { photo.classList.toggle('selected'); selected += photo.classList.contains('selected') ? 1 : -1; });
        let timer;
        photo.addEventListener('pointerdown', () => { timer=setTimeout(()=>{ if(selected>=1) root.querySelector('#s31-move').hidden=false; },600); });
        ['pointerup','pointerleave','pointercancel'].forEach(type => photo.addEventListener(type,()=>clearTimeout(timer)));
    });
    root.querySelector('#s31-move').addEventListener('click', () => root.querySelector('#s31-move').textContent='Moved');
}
