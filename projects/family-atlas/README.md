# Family Atlas v0.6 — ring-routed radial atlas

A local-first, monochrome family-history editor intended for static hosting (including GitHub Pages). No account or server-side family database is required. Actual family archives should **not** be committed to a public repository.

## Run

Open a terminal in the `family-atlas` directory and run:

```sh
python -m http.server 8000
```

Visit http://localhost:8000/. A local HTTP server is required because the application uses ES modules and loads the optional samples via `fetch`.

## The simplified interface

The previous *Atlas / Network / Radial / Lineage* selection has been replaced by:

1. **Radial atlas (default).** Every disconnected component is a separate concentric descendant formation. Innermost rings represent the most ancestral recorded positions in that component. Subsequent rings represent parent-child depth, not age, birth year or a universal generation number. Partners without separate recorded ancestry share their co-parent's band. If both partners have their own ancestry, their different bands are preserved.
2. **Family detail.** Select a person, then choose *Family detail*. The top-to-bottom view shows ancestors and descendants through parentage, plus adjacent partners/siblings. Adjust its ancestor/descendant depth using the contextual bar. The same person and relationship records are used for both layouts.

**Navigation:** drag empty space to pan, use wheel/trackpad to zoom, select a circle to inspect its record, and use **All** to fit the entire collection. Names are temporarily hidden at far-out overview scale to reduce collisions, and reappear when zooming in. Search can locate any recorded person. **Trace path** finds the shortest recorded connection chain and highlights it; it is not an inferred biological kinship label.

**Visual grammar:**

- Concentric thin circles: depth of descent inside an automatically detected connected network.
- Strong solid connection: recorded parentage. Multiple recorded parents and children share a small, generated junction (not a marriage node).
- Fine solid connection: explicitly asserted siblings when the same relationship isn't already explained by recorded shared parentage.
- Dashed connection: partnership (including former, separated and divorced relationships).
- Dotted connection: guardianship or unspecified family connection.
- Long cross-ring partnerships are quiet until either endpoint is selected or a traced path highlights the link.
- A dagger (†) on a person means explicitly recorded deceased; a missing death date never means living.

The radial renderer routes parentage through straight radial spokes and concentric circular arcs instead of free-curving paths. Family detail retains its previous layout. The diagram uses a lightweight radial allocation and two-pass relationship rendering. It is a **prototype**: crossing edges and nonideal group ordering are still possible, especially when branches reconnect, partners have independent recorded ancestry, or multiple family groups share descendants. Junctions, rings and layout positions are generated; nothing is stored in the archive to imply invented kinship.

## Controls

The top toolbar has Search, Trace path, Import, Export, More and Add person. Family detail is opened from a selected person, with a single return button in the toolbar. The family detail bar controls ancestry and descendant depth and history. The lower right contains zoom in, zoom out and All. The inactive Network button and duplicate Trace / Family detail actions have been removed.

## Edit people and relationships

Use **+ Add person** to add a first, independent person. With a person selected, use the contextual **Expand family** buttons to add a parent, sibling, child or partner in one flow. **Connect existing people** offers nearby selections and fuzzy name search for distant entries. Sibling and partnership relationships are reciprocal; no duplicate reverse link is created. A connection can be removed without removing either person. Status and date fields are optional and edited separately.

## Local data, imports and backups

Records autosave in the browser under the same local-storage key as v0.2–v0.4; switching to this version at the **same origin** retains the prior data. Browser storage is not a durable backup. **Export → Download complete JSON archive** regularly. JSON is the authoritative portable family archive; SVG is a rendering snapshot, not a substitute.

**Import** adds a JSON collection and presents suggested possible identity matches for human review; it does not automatically decide that similar names mean the same person. When an identity is manually reconciled, conflicting imported attribute values are retained as assertions rather than silently replacing existing working values. Repeated imports use source-qualified identity mappings. A backup download is triggered before an import is committed.

**More → Load extensive fictional sample** replaces the current collection **after a confirmation and backup download**. All samples contain invented names and data and can be committed to the repository. To test an import, load a base sample and then use **Import** to add a different sample.

## Sample datasets

- `samples/extensive-family.json`: 76 invented people, multiple disconnected groups and relationship types.
- `samples/contribution.json`: 19 invented people, overlaps and conflicting values for import review.
- `samples/contribution-updated.json`: 20 invented people, follow-up version of the same contribution for repeat import.
- `samples/three-children-partners.json`: two ancestors, three children, their partners and grandchildren; the key co-parent junction regression.
- `samples/ten-children-rings.json`: two ancestors with ten children, partners and grandchildren; tests arc allocation.
- `samples/cross-ring-partnership.json`: partners with different recorded descent depths, connecting previously distant branches, plus an independent person.

## Verification and limitations

The renderer module can be tested separately with Node, and the included JSON fixtures are validated. Browser interaction testing remains important; the first radial arrangement is intentionally an experiment, not a finished genealogy layout engine. Not every crossing can be avoided, and the **Family detail** view is a focused subset, not a complete replacement for a formal pedigree chart. Some finer source-conflict management and historical audit editing are future work.

## Files

- `index.html`: interface shell.
- `style.css`: flat monochrome styling.
- `app.js`: local editing, persistence, imports, rendering and navigation.
- `radial-layout.js`: pure layout functions; no family data is modified.
- `samples/*.json`: fictional regression collections.
