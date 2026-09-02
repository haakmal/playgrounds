export function createDebugController({ state, specimens, ui, elements }) {
    const controls = {
        previous: document.querySelector('#debug-previous'),
        next: document.querySelector('#debug-next'),
        select: document.querySelector('#debug-select'),
        position: document.querySelector('#debug-position')
    };

    function updatePosition() {
        const current = state.currentIndex + 1;
        if (controls.position) {
            controls.position.textContent = `${String(current).padStart(2, '0')} / ${String(state.specimens.length).padStart(2, '0')}`;
        }
        if (controls.previous) controls.previous.disabled = current <= 1;
        if (controls.next) controls.next.disabled = current >= state.specimens.length;
        if (controls.select) controls.select.value = state.currentSpecimen?.id || '';
    }

    function renderControls() {
        if (controls.select && !controls.select.options.length) {
            controls.select.innerHTML = specimens.map(specimen =>
                `<option value="${specimen.id}">${specimen.id} — ${specimen.name}</option>`
            ).join('');
        }
        updatePosition();
    }

    function render(index) {
        const nextIndex = Math.max(0, Math.min(index, state.specimens.length - 1));
        state.currentIndex = nextIndex;
        state.currentSpecimen = state.specimens[nextIndex] || null;
        state.tutorReveal = false;
        ui.renderCurrent();
        updatePosition();
    }

    function previous() {
        if (state.currentIndex > 0) render(state.currentIndex - 1);
    }

    function next() {
        if (state.currentIndex < state.specimens.length - 1) render(state.currentIndex + 1);
    }

    function jump(specimenId) {
        const index = state.specimens.findIndex(specimen => specimen.id === specimenId);
        if (index >= 0) render(index);
    }

    controls.previous?.addEventListener('click', previous);
    controls.next?.addEventListener('click', next);
    controls.select?.addEventListener('change', event => jump(event.target.value));

    return { renderControls, previous, next, jump };
}
