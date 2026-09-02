# Interactive Prototyping Companion

A client-side pedagogical tool for novice interaction-design students working with electronics-enabled interaction prototypes, particularly Adafruit Circuit Playground and MakeCode.

## Purpose

The companion is designed to reduce the intimidation associated with electronics and programming by placing interaction design thinking before implementation.

Students use the tool to:

1. Explore possible inputs and outputs.
2. Define an interaction using the course Input → Process → Output (IPO) model.
3. Select a process pattern that describes how the interaction behaves.
4. Build the implementation independently in MakeCode.
5. Test the physical prototype with another person.
6. Reflect on what they discovered and what they are struggling with.
7. Save report snapshots and communicate progress with tutors or technical staff.

The tool does **not** replace MakeCode. MakeCode is the implementation environment; this companion provides the pedagogical scaffolding around it.

## Workflow

**01 Explore → 02 Define → 03 Make → 04 Test → 05 Reflect → 06 Reports**

The persistent Interaction Pattern Library provides deeper reference material organised around:

- **Sense** — inputs and sensing possibilities.
- **Process** — patterns such as Trigger, Toggle, Threshold, Delay, Sequence and Repeat.
- **Respond** — outputs and feedback possibilities.
- **Extend** — pathways beyond Circuit Playground when a project needs greater technical flexibility.

## Interaction model

Define uses the course IPO model:

**INPUT → PROCESS → OUTPUT**

Process is treated as the mechanism that describes how an input produces a response. The tool supports a deliberately limited level of compound interaction:

- Foundation: one input → one process → one output.
- Combined: one input → one process → multiple outputs, or one following process/output stage.

The companion has a strict complexity ceiling. When students attempt to move beyond that ceiling, they are directed to create a support snapshot and seek advice from a tutor or technical staff member before proceeding.

## Technical architecture

- Client-side HTML, CSS and JavaScript.
- No backend.
- No database.
- No build step.
- Browser localStorage for active project state.
- JSON project export/import for backup and transfer.
- Report snapshots retained within each project.
- Individual and combined PDF/print report export.
- Curated external references stored in the client-side data.

The project is intentionally suitable for static GitHub Pages-style hosting.

## Storage and backup

Project work is stored in the browser's localStorage. This is convenient for classroom use but is volatile: browser data can be cleared or lost.

Students should:

- save regularly;
- export the project JSON frequently;
- create report snapshots at meaningful checkpoints;
- export reports when sharing work with tutors or technical staff.

## Reporting model

A report is an explicit project snapshot rather than an automatic activity log. Students can create multiple checkpoints as the prototype develops.

Each snapshot can be:

- viewed in the tool;
- exported individually as a PDF;
- included in a combined report containing the project's report history.

Support snapshots use the same report structure, so the same document can communicate the design context to either a tutor or technical staff member.

## Interaction Pattern Library

The library is intended to work like a disciplinary reference resource rather than a conventional lesson sequence. Individual entries explain a concept, connect it to IPO, describe its use on Circuit Playground and provide curated external references where useful.

The **Extend** section introduces Arduino, ESP32 and Raspberry Pi Pico as possible future platforms. The pedagogical message is that the interaction model transfers even when the implementation changes.

## Running the project

The project requires no installation or build process.

It can be opened directly as `index.html` or served from a simple local/static web server. Because the app is entirely client-side, it is suitable for GitHub Pages or similar hosting.

## Project structure

```text
/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── data.js
    ├── interaction.js
    ├── library.js
    ├── main.js
    ├── navigation.js
    ├── project.js
    ├── reports.js
    ├── state.js
    └── ui.js
```

JavaScript has been divided by responsibility so the project can be more easily inspected and maintained on GitHub. CSS is formatted as readable blocks rather than compressed one-line rules.

## Version history

### v1 — Initial prototype

- Established Explore → Define → Make → Test → Reflect → Reports.
- Introduced localStorage project persistence.
- Added project notes and report snapshots.
- Added a support/help reporting pathway.
- Established an external MakeCode workflow.

### v2 — Course-tool UI alignment

- Brought the interface closer to the established course-tool visual language.
- Introduced persistent process navigation.
- Moved project management into the header.
- Added recipe guidance and MakeCode block references.
- Reworked PDF generation to avoid browser popup restrictions.
- Clarified Testing as observation of another person.

### v3 — Workflow simplification

- Replaced the transition modal with subtle stage transitions.
- Standardised Field Notes.
- Simplified reporting into one snapshot model.
- Added combined report-history export.
- Strengthened localStorage warnings.
- Simplified contextual learning and help callouts.

### v4 — Recipe and visual-system refinement

- Simplified typography hierarchy.
- Standardised learning, notes, alert and general UI colours.
- Consolidated the Make recipe presentation.
- Restricted recipe choices to interactions relevant to the student's definition.
- Improved Field Notes consistency.

### v5 — IPO and Interaction Pattern Library

- Reframed Define around Input → Process → Output.
- Introduced process patterns including Trigger, Toggle, Threshold, Delay, Sequence and Repeat.
- Added compound interactions and a controlled interaction chain.
- Added a strict complexity ceiling.
- Added support snapshots when interactions exceed the intended complexity.
- Introduced the Interaction Pattern Library.
- Organised the library around Sense → Process → Respond.
- Added curated references for Circuit Playground and future Arduino, ESP32 and Pico exploration.

### v5.1 — Interaction-chain refinement

- Fixed Pattern Library modal behaviour.
- Made additional responses and stages selectable by the student.
- Improved terminology and contextual process examples.
- Refined MakeCode block-reference presentation.
- Strengthened complexity-ceiling behaviour.

### v5.2–v5.4 — Interface and interaction fixes

- Standardised Field Notes spacing and contextual learning links.
- Corrected native dropdown behaviour in Define.
- Restored horizontal IPO presentation.
- Changed input terminology from Press to Pressure.
- Simplified Make learning references.
- Reworked the PDF print layout.

### v5.5 — Language and learning consistency

- Made Process visually dominant in Define.
- Standardised contextual Learn areas.
- Added input/output-specific learning links in Explore.
- Aligned Pattern Library terminology with Sense → Process → Respond.
- Renamed Make's starting point as Your Interaction Logic.
- Refined compact PDF typography and spacing.

### v5.6 — Extended interactions and reporting

- Added a compact `+ EXTENDED` cue when an interaction contains an additional response or stage.
- Preserved the primary IPO interaction as the dominant visual model.
- Added individual report PDF export alongside combined export.
- Simplified the Make learning area to the Circuit Playground reference.

## Teaching boundary

The companion is intentionally a scaffold rather than a complete electronics curriculum. Circuit Playground is the supported introductory platform because it provides integrated inputs and outputs with low setup friction.

Students who want to move beyond it can explore other microcontrollers, but should do so when a project requires capabilities beyond the scaffold and should seek technical advice when hardware, power, wiring or programming complexity increases.

## AI Collaboration

This project was designed and developed by Dr Haider Ali Akmal in collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

AI was used at key points in this project as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.