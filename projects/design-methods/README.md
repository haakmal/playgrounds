# Design Research Methods

A dependency-free client-side tool aimed at students of design, showing where design research methods may apply across a typical Double Diamond process.

## Public interface

The main library is `index.html`. It reads the method index from `data/methods.index.json` and loads detailed records from `data/methods/` when a method is opened.

## Local authoring dashboard

A local-only authoring interface is available at `admin.html`.

Run the playgrounds repository using the normal Jekyll workflow, for example:

```bash
bundle exec jekyll serve
```

Then open:

```text
http://localhost:4000/projects/design-methods/admin.html
```

Choose **Connect local project** and select the `design-methods` project folder on that computer. The dashboard uses the browser File System Access API to read and write the JSON files directly. No Python server, database, API, or external CMS is required.

The selected directory is local to the browser/computer. It does not store a machine-specific path in the repository, so the same project can be used from different repository roots on macOS and Linux.

### Authoring operations

The dashboard supports:

- creating new methods;
- editing names, IDs, phases, descriptions, steps, and resources;
- duplicating methods;
- deleting methods;
- updating `data/methods.index.json` whenever a method is created, renamed, moved, or deleted;
- checking for missing or unindexed method records;
- showing a live record preview before saving.

Saving writes the individual method JSON and the index back into the local repository. You can then review the resulting changes with Git and commit/push them normally.

The authoring page deliberately disables repository writing outside `localhost`.

## Data structure

```text
data/
├── methods.index.json
└── methods/
    ├── affinity-diagrams.json
    ├── interviews.json
    └── ...
```

The index provides the lightweight fields used by the public timeline. Individual method files contain the fuller method record.

## Notes

The project currently retains the original `methods.json` and `script.js.bak` files for reference. The active public interface uses `data/methods.index.json` and `data/methods/*.json`.

## Method content format

Each method JSON record can contain `description`, `whenToUse`, `steps`, `lookOutFor`, and `resources`. Text supports lightweight formatting: `**bold**`, `*italic*`, and `[u]underline[/u]`. Resources can be `link`, `download`, or `reference`; links/downloads accept either web URLs or project-relative paths such as `assets/templates/example.pdf`. References store a citation as plain text.

The local authoring dashboard is available at `/projects/design-methods/admin.html` while running the site on localhost with Jekyll.
