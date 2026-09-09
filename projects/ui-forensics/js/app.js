import { loadIssues, loadSpecimens } from './specimens.js?v=5';
import { chooseSpecimens, createCaseId } from './randomizer.js?v=5';
import { createState, beginState, advanceState, retreatState } from './state.js?v=5';
import { createInterface } from './interface.js?v=5';
import { createTutor } from './tutor.js?v=5';
import { createDebugController } from './debug.js?v=5';

const state = createState();
console.info('%cUI FORENSICS NOTE%c Curious enough to inspect the tool? The hidden tutor reveal is Shift+R.', 'font-weight:700', 'font-weight:400');
const debugMode = document.body.dataset.mode === 'debug';

const elements = {
    startScreen: document.querySelector('#start-screen'),
    examinationScreen: document.querySelector('#examination-screen'),
    completeScreen: document.querySelector('#complete-screen'),
    startButton: document.querySelector('#start-button'),
    newExaminationButton: document.querySelector('#new-examination-button'),
    redoSameButton: document.querySelector('#redo-same-button'),
    previousButton: document.querySelector('#previous-button'),
    resetButton: document.querySelector('#reset-button'),
    nextButton: document.querySelector('#next-button'),
    headerCase: document.querySelector('#header-case'),
    caseId: document.querySelector('#case-id'),
    specimenId: document.querySelector('#specimen-id'),
    specimenType: document.querySelector('#specimen-type'),
    specimenDevice: document.querySelector('#specimen-device'),
    specimenStatus: document.querySelector('#specimen-status'),
    issueCount: document.querySelector('#issue-count'),
    specimenNumber: document.querySelector('#specimen-number'),
    specimenTotal: document.querySelector('#specimen-total'),
    specimenName: document.querySelector('#specimen-name'),
    specimenKind: document.querySelector('#specimen-kind'),
    specimenTask: document.querySelector('#specimen-task'),
    specimenFrame: document.querySelector('#specimen-frame'),
    specimenViewport: document.querySelector('#specimen-viewport'),
    specimenNote: document.querySelector('#specimen-note'),
    viewport: document.querySelector('#specimen-viewport'),
    completedList: document.querySelector('#completed-list'),
    tutorReveal: document.querySelector('#tutor-reveal'),
    issueDialog: document.querySelector('#issue-dialog'),
    issueDialogHeuristic: document.querySelector('#issue-dialog-heuristic'),
    issueDialogTitle: document.querySelector('#issue-dialog-title'),
    issueDialogDescription: document.querySelector('#issue-dialog-description'),
    issueDialogMeta: document.querySelector('#issue-dialog-meta')
};

let specimenLibrary = [];
let issueLibrary = [];
let ui = null;
let tutor = null;
let debug = null;

function startExamination() {
    const selection = chooseSpecimens(specimenLibrary, 5);
    beginState(state, createCaseId(), selection);
    ui.showExamination();
}

function startDebugMode() {
    const ordered = [...specimenLibrary].sort((a, b) => a.id.localeCompare(b.id));
    beginState(state, 'DEBUG', ordered);
    ui.showExamination();
    debug?.renderControls();
}

function previousSpecimen() {
    tutor.clear();

    if (debugMode) {
        debug?.previous();
        return;
    }

    if (state.currentIndex <= 0) return;
    retreatState(state);
    ui.renderCurrent();
}

function resetSpecimen() {
    tutor.clear();
    ui.renderCurrent();
}

function nextSpecimen() {
    tutor.clear();

    if (debugMode) {
        debug?.next();
        return;
    }

    if (state.currentIndex >= state.specimens.length - 1) {
        ui.showComplete();
        return;
    }

    advanceState(state);
    ui.renderCurrent();
}

function redoSameDeck() {
    tutor.clear();
    const sameDeck = [...state.specimens];
    beginState(state, createCaseId(), sameDeck);
    ui.showExamination();
}

async function initialise() {
    try {
        [specimenLibrary, issueLibrary] = await Promise.all([loadSpecimens(), loadIssues()]);

        ui = createInterface({
            state,
            issues: issueLibrary,
            elements,
            callbacks: {
                onRenderCurrent: () => {
                    tutor?.clear();
                    elements.headerCase.textContent = debugMode ? 'DEBUG / FULL LIBRARY' : `CASE ${state.caseId}`;
                    elements.specimenNote.textContent = debugMode
                        ? 'DEBUG MODE / SEQUENTIAL SPECIMEN REVIEW'
                        : 'INTERACTIVE EVIDENCE / EXAMINE THROUGH USE';
                }
            }
        });

        tutor = createTutor({ state, issues: issueLibrary, elements });

        if (debugMode) {
            debug = createDebugController({
                state,
                specimens: specimenLibrary,
                ui,
                elements
            });
            startDebugMode();
        } else {
            ui.showStart();
        }
    } catch (error) {
        console.error(error);
        document.querySelector('#app').innerHTML = `<section class="start-screen"><div class="start-copy"><p class="eyebrow mono">SYSTEM ERROR</p><h2>Specimen library unavailable.</h2><p>Run this project from a local web server or deploy it to a static host so the JSON data can be loaded.</p></div></section>`;
    }
}

if (elements.startButton) elements.startButton.addEventListener('click', startExamination);
if (elements.previousButton) elements.previousButton.addEventListener('click', previousSpecimen);
if (elements.resetButton) elements.resetButton.addEventListener('click', resetSpecimen);
if (elements.nextButton) elements.nextButton.addEventListener('click', nextSpecimen);
if (elements.newExaminationButton) elements.newExaminationButton.addEventListener('click', startExamination);
if (elements.redoSameButton) elements.redoSameButton.addEventListener('click', redoSameDeck);

initialise();
