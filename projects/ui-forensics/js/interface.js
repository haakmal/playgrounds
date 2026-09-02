
import { renderSpecimen } from './specimens.js?v=4';

export function createInterface({ state, issues, elements, callbacks }) {
    const { startScreen, examinationScreen, completeScreen, viewport } = elements;

    function getCurrentIssues() {
        if (!state.currentSpecimen) return [];
        return issues.filter(issue => issue.id.startsWith(`${state.currentSpecimen.id}-`));
    }

    function renderCurrent() {
        const specimen = state.currentSpecimen;
        if (!specimen) return;

        elements.caseId.textContent = state.caseId;
        elements.specimenId.textContent = specimen.id;
        elements.specimenType.textContent = specimen.category;
        elements.specimenDevice.textContent = specimen.device;
        elements.specimenStatus.textContent = 'UNEXAMINED';
        elements.issueCount.textContent = String(specimen.issueCount).padStart(2, '0');
        elements.specimenNumber.textContent = String(state.currentIndex + 1).padStart(2, '0');
        if (elements.specimenTotal) {
            elements.specimenTotal.textContent = String(state.specimens.length).padStart(2, '0');
        }
        elements.specimenName.textContent = specimen.name;
        elements.specimenKind.textContent = `${specimen.device.toUpperCase()} SPECIMEN`;
        elements.specimenTask.textContent = specimen.task;
        viewport.innerHTML = '<div class="specimen-canvas"></div>';
        const canvas = viewport.querySelector('.specimen-canvas');
        renderSpecimen(canvas, specimen);
        state.currentIssues = getCurrentIssues();
        state.tutorReveal = false;
        callbacks.onRenderCurrent?.();
    }

    function showStart() {
        startScreen.hidden = false;
        examinationScreen.hidden = true;
        completeScreen.hidden = true;
    }

    function showExamination() {
        startScreen.hidden = true;
        examinationScreen.hidden = false;
        completeScreen.hidden = true;
        renderCurrent();
    }

    function showComplete() {
        startScreen.hidden = true;
        examinationScreen.hidden = true;
        completeScreen.hidden = false;
        elements.completedList.innerHTML = state.specimens.map((specimen, index) => `
            <li><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${specimen.name}</strong><br><span class="mono">${specimen.id} / ${specimen.issueCount} DOCUMENTED ISSUES</span></div></li>
        `).join('');
    }

    return { renderCurrent, showStart, showExamination, showComplete };
}
