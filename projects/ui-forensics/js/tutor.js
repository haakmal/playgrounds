
export function createTutor({ state, issues, elements }) {
    function clear() {
        elements.tutorReveal.hidden = true;
        elements.tutorReveal.innerHTML = '';
        state.tutorReveal = false;
    }

    function openIssue(issue) {
        const classification = issue.classification === 'dark-pattern' ? ` · DARK PATTERN: ${issue.pattern.toUpperCase()}` : '';
        elements.issueDialogHeuristic.textContent = `${issue.heuristic} / ${issue.secondary ? `SECONDARY ${issue.secondary}` : 'PRIMARY'}${classification}`;
        elements.issueDialogTitle.textContent = issue.title;
        elements.issueDialogDescription.textContent = `TRIGGER — ${issue.trigger}\n\nOBSERVE — ${issue.observable}\n\nWHY — ${issue.description}`;
        elements.issueDialogMeta.textContent = `${issue.id} · ${issue.type.toUpperCase()} · DIFFICULTY ${issue.difficulty}`;
        elements.issueDialog.hidden = false;
    }

    function revealCurrent() {
        clear();
        if (!state.currentSpecimen) return;
        const viewport = elements.specimenViewport.getBoundingClientRect();
        const canvas = elements.specimenViewport.querySelector('.specimen-canvas');
        if (!canvas) return;
        elements.tutorReveal.hidden = false;
        state.currentIssues.forEach((issue, index) => {
            const marker = document.createElement('button');
            marker.className = 'reveal-marker';
            marker.type = 'button';
            marker.title = 'Reveal documented issue';
            const pageX = canvas.getBoundingClientRect().left + (canvas.scrollWidth * issue.x / 100);
            const pageY = canvas.getBoundingClientRect().top + (canvas.scrollHeight * issue.y / 100);
            marker.style.left = `${pageX}px`;
            marker.style.top = `${pageY}px`;
            marker.addEventListener('click', () => openIssue(issue));
            elements.tutorReveal.appendChild(marker);
        });
        state.tutorReveal = true;
        elements.specimenViewport.addEventListener('scroll', clear, { once: true });
    }

    function handleKeydown(event) {
        const active = document.activeElement;
        const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
        if (!typing && event.shiftKey && event.key.toLowerCase() === 'r') {
            event.preventDefault();
            state.tutorReveal ? clear() : revealCurrent();
        }
    }

    function closeDialog() { elements.issueDialog.hidden = true; }

    document.addEventListener('keydown', handleKeydown);
    document.querySelectorAll('[data-close-issue]').forEach(element => element.addEventListener('click', closeDialog));

    return { revealCurrent, clear, closeDialog };
}
