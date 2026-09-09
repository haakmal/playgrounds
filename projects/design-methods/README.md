# Design Research Methods

Design Methods is a browser-based reference library for exploring methods used across the design process. It is intended primarily as a teaching and learning resource, helping students identify, compare, and understand methods rather than prescribing a single design process.

The origins of this tool come from an old web interface once offered by OCAD which no longer exists. I remember referencing it often in my Masters and PhD days at Lancaster but sadly it was eventually taken down.

In this version, methods are mapped across the four phases of the Double Diamond—Discovery, Define, Develop, and Deliver—and may span multiple phases where appropriate. The interface supports browsing by phase and weighted search across method names and supporting content. I've tried to retain most of the visual characteristics of the original tool that I could recall from memory while working on enhanced functionality.

Each method can provide:

- a description of the method and its purpose;
- guidance on when to use it;
- a step-by-step process;
- considerations and issues to look out for; and
- further material including links, downloadable resources, and references.

## Design principles

The library treats methods as adaptable tools rather than fixed recipes making this version distinct form its inspiration. Their placement within the Double Diamond indicates where they may be useful, not where they must be used. Students should select and adapt methods according to their context, available evidence, questions, and intended outcomes.

## Function

The main library is `index.html`. It reads the method index from `data/methods.index.json` and loads detailed records from `data/methods/` when a method is opened.

### Local authoring dashboard

A local-only authoring interface is available at `admin.html`.

Run the playgrounds repository using the normal Jekyll workflow, for example:

```bash
bundle exec jekyll serve
```

Then open:

```text
http://localhost:4000/projects/design-methods/admin.html
```

This folder structure is specific to my Jekyll based Playgrounds repo. Choose **Connect local project** and select the `design-methods` project folder on that computer. The dashboard uses the browser File System Access API to read and write the JSON files directly. No Python server, database, API, or external CMS is required making this a simple but effective offline purpose built CMS.

### Version history

**Current — Expanded method library and authoring system**

- Expanded method records with _When to use_ and _Look out for_ guidance.
- Added further-material support for external links, local downloads, and bibliographic references.
- Added lightweight bold, italic, and underline formatting within method content.
- Improved weighted search across method names and supporting content.
- Refined method modal, phase filtering, and general interface hierarchy.
- Added a local authoring interface for maintaining the JSON method library.

**v2 — JSON method library**

- Separated individual methods into structured JSON records.
- Added a method index for constructing the main interface.
- Added search and Double Diamond phase filtering.
- Introduced detailed method views with processes and resources.

**v1 — Initial prototype**

- Established the Double Diamond method-map interface.
- Positioned methods across Discovery, Define, Develop, and Deliver.
- Established the core visual and interaction model for browsing the library.

## AI Collaboration

This project was designed and developed by Dr Haider Ali Akmal in collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

AI was used at key points in this project as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
