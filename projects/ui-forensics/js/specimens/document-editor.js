export function render(root) {
    root.innerHTML = `<div class="specimen-shell s25"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Draft editor</strong><span id="s25-save-state">Saved</span></div><div class="editor-shell"><div class="editor-toolbar"><button id="s25-bold">Bold</button><button id="s25-italic">Italic</button><button id="s25-undo">Undo</button></div><div class="document-text"><p id="s25-text">The project examines how interface systems communicate state.</p><p>Apply <strong>bold</strong> to the title and save the document.</p></div></div></div></div>`;
    const text=root.querySelector('#s25-text');
    root.querySelector('#s25-bold').addEventListener('click', () => { root.querySelector('#s25-bold').classList.add('active'); text.style.fontWeight='700'; root.querySelector('#s25-save-state').textContent='Saved'; });
    root.querySelector('#s25-italic').addEventListener('click', () => { text.style.fontStyle='italic'; root.querySelector('#s25-italic').classList.add('active'); root.querySelector('#s25-save-state').textContent='Saved'; });
    root.querySelector('#s25-undo').addEventListener('click', () => { root.querySelector('#s25-bold').classList.remove('active'); root.querySelector('#s25-italic').classList.remove('active'); text.style.fontWeight='normal'; text.style.fontStyle='normal'; });
}
