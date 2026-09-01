# DDES1150 Usability Report Tool — V3 test prototype

A dependency-free client-side prototype for building a structured usability report.

## V3 interface model

The report is now primarily a table. Students add one finding at a time in a single editor. Saving the finding returns it to the table, and clicking any table row reopens that finding for editing. This avoids a growing stack of open forms and keeps the main workspace readable.

The heuristic library remains a large reference modal with search, source filters, category filters, definitions, look-for guidance, examples and related principles.

## Files

- `index.html` — app structure
- `styles.css` — interface and print styles
- `app.js` — report management, LocalStorage, table/editor behaviour, filtering, import/export and printing
- `heuristics.js` — curated combined heuristic library

## Run locally

Open `index.html` in a modern browser. No build step or server is required.

For GitHub Pages, place all four files in the same repository/folder and enable Pages.

## Data

Reports are stored in browser LocalStorage. JSON export/import is used for moving a report between browsers or devices.

## PDF

Choose **Print / Save PDF**. The print stylesheet hides the working interface and prints only the condensed findings table with a report title and generated timestamp. The browser supplies the final Save as PDF operation.

## Heuristic library

The combined library prioritises Nielsen first, then Andy Budd, then Bruce Tognazzini. Shared concepts are consolidated rather than presented as duplicate entries. Source attribution is retained and related principles are shown in the reference modal.

## V3 design intent

The interface is deliberately less intimidating for first-year interaction design students: one active finding editor, a compact report table, simple filters, and detailed theory kept behind the heuristic library when needed.


## V9 changes

* Fixed draft finding heuristic selection so selecting a heuristic no longer loses the temporary finding state.
* Reset temporary finding and library state when deleting a report.

## V3 changes
- Added delete finding action with confirmation.
- Added report context to print/PDF output.
- Added traffic-light severity colours: green for Minor, yellow for Moderate, red for Serious.
