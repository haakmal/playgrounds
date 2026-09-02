# UI Forensics — Heuristic Examination

A static teaching tool for learning heuristic evaluation through deliberately problematic interface specimens.

## Current library

The library contains **40 specimens** and **102 documented usability issues**. A student examination randomly selects five specimens with diversity rules intended to avoid five similar interactions. The selector considers device, category and interaction territory while guaranteeing a mixture of mobile and non-mobile specimens where the library permits it.

Each specimen discloses its documented issue count but does not identify the location or heuristic. Students investigate the interfaces and record findings in the separate Usability Reporting Tool.

## Project structure

```text
ui-forensics/
├── index.html
├── debug.html
├── README.md
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── specimen.css
│   ├── responsive.css
│   └── debug.css
├── js/
│   ├── app.js
│   ├── state.js
│   ├── randomizer.js
│   ├── interface.js
│   ├── tutor.js
│   ├── debug.js
│   ├── specimens.js
│   └── specimens/
└── data/
    ├── specimens.json
    ├── issues.json
    └── heuristics.json
```

## Running locally

Serve the project from a local web server because the application loads JSON through `fetch()`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The project is suitable for GitHub Pages or another static host.

## Debug library

Open `debug.html` to review all 40 specimens sequentially. This view removes randomisation and includes Previous / Next / Jump controls.

## Tutor reveal

A hidden tutor reveal can be toggled with **Shift + R** during an active specimen. It places issue markers over the specimen and opens the authored trigger, observable behaviour and heuristic explanation when a marker is selected. The shortcut is intentionally not advertised in the student interface.

For curious code readers, the source contains a small developer note pointing to the shortcut.

## Authoring

Add specimen metadata to `data/specimens.json`, authored issues to `data/issues.json`, and an implementation module in `js/specimens/`. Each issue should include:

- a trigger a reviewer can follow;
- an observable behaviour that can actually occur;
- a reason it constitutes a heuristic problem;
- a primary heuristic and optional secondary heuristic;
- difficulty and tutor overlay coordinates.

The authored issue library is a comparison point rather than an exhaustive statement of everything wrong with a specimen. Students can still identify defensible additional issues.

## Dark-pattern specimens

Specimens S41-S50 are polished interfaces with deliberately persuasive or manipulative design choices rather than visibly broken controls. Their issue records use a hidden `classification` of `dark-pattern` and a `pattern` label such as preselection, obstruction, nagging, fake urgency, drip pricing or confirmshaming. These labels are revealed only through the hidden tutor mechanism.

The randomiser also treats specimen class as a diversity constraint, alongside device, category and interaction territory, so a student examination should not become a homogeneous dark-pattern set.

## AI Collaboration

This project was designed and developed by Dr Haider Ali Akmal in collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

AI was used at key points in this project as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
