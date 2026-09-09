
export function createState() {
    return {
        caseId: '',
        specimens: [],
        currentIndex: 0,
        currentSpecimen: null,
        currentIssues: [],
        tutorReveal: false
    };
}

export function beginState(state, caseId, specimens) {
    state.caseId = caseId;
    state.specimens = specimens;
    state.currentIndex = 0;
    state.currentSpecimen = specimens[0] || null;
    state.tutorReveal = false;
    return state;
}

export function advanceState(state) {
    state.currentIndex = Math.min(state.currentIndex + 1, state.specimens.length - 1);
    state.currentSpecimen = state.specimens[state.currentIndex] || null;
    state.tutorReveal = false;
    return state;
}

export function retreatState(state) {
    state.currentIndex = Math.max(state.currentIndex - 1, 0);
    state.currentSpecimen = state.specimens[state.currentIndex] || null;
    state.tutorReveal = false;
    return state;
}
