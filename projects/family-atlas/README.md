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

## v0.7 notation and routing

- `DEC` marks deceased people in place of the dagger icon.
- `DIV`, `SEP`, `FRM`, `HIS`, and `END` indicate divorced, separated, former, historical, and ended-by-death partnerships. Full labels remain in the relationship editor.
- Circular routes reserve separate tracks where unrelated arcs would otherwise coincide, with 14 SVG-unit radial spacing. Shared parentage junctions remain shared. Complex networks may still have unavoidable spoke intersections.
- The archival JSON format is unchanged.

## v0.8 UI adjustments
Person dates now use year, month and day controls while storing the existing partial ISO date format.
Life status and primary parentage use compact radio controls. Legal parentage remains independently selectable.
DEC is black, SEP/DIV light red, and FRM/HIS/END pale yellow. The legend is titled Relationship key.
The Fit view control replaces All. Source JSON remains compatible with v0.7.

## v0.9 — Family-detail junction correction

The traditional Family Detail layout now reserves space for each descendant's
subtree before positioning people. Children of separate couples are positioned
under their own parentage groups. Each family parentage junction uses one shared
horizontal bus with separate vertical child stems; unrelated junctions are not
merged or reused.

The radial renderer, data model, local storage, and import/export remain
unchanged. Run `node tests/family-detail.test.mjs` to check all six sample
collections. Complex cross-branch parentage connections may still require
further routing work.

## v0.10 display and interaction refinements
- Hide/show person nameplates from the canvas controls; status markers remain visible.
- Historical partnership labels follow their actual drawn path and choose a location with greater clearance from person nodes.
- White line casings make crossings easier to interpret; parentage routes take visual precedence.
- Family detail offers one-step Earlier/Later expansion and retains precise depth settings under Depth options.
- Person details filter direct relationships into parents, children, partners, siblings and other.
- Life-status labels in person details use the same compact style as graph labels.
- Escape closes the open modal, not the selected person's side panel.
- Connect Existing starts with fuzzy search, followed by nearby people.
- Existing schema and all six fictional datasets are unchanged.

## v0.11 — navigation, connection layering and search
- Explicit `personName` classes ensure hiding names never hides `DEC`.
- Connections are grouped and ordered by relationship priority. White underlay is
  enabled only for transverse line crossings; junction dots paint above all lines.
- Separated/divorced links use the same soft red as their status markers;
  other historical partnership links use pale yellow.
- Family Detail Up/Down navigates to a recorded parent/child. When there are
  several, choose the destination from the adjacent dropdown. Parent sorting:
  mother, father, other, unspecified, then alphabetically. No genealogical
  assumptions are made from gender. Previous returns to the earlier focus.
- A short viewport transition and focused-person marker aid orientation;
  reduced-motion preferences are honoured.
- Optional person `gender`: `male`, `female`, `other`, or empty. New and edited
  people use the same field. Existing archive schema remains compatible.
- Shared fuzzy search restores Connect Existing, global search, path tracing
  and import candidate suggestion.

## v0.11.1 browser startup fix

Rewrites the Family Detail navigation sorting expression into explicit statements to address the reported browser parsing error at app.js:539. If an old error remains, hard-reload to clear cached app.js.

## v0.12 Batch selection and navigation

Activate **Select multiple** in the toolbar. Click people in either atlas or family detail. Click a shared parentage junction to select its parentage group; click a partnership connection to select one or more partnership records. The same contextual side panel offers:

- **People**: change gender and life status; append notes. Use explicit field activation and optional blank-only values.
- **Parentage**: choose one reference parent from the selected people and define classification, parental role, and legal parentage for the other selected people. Missing links require explicit approval.
- **Partnerships**: edit existing selected partnership relationships, or connect exactly two selected people.
- **Family group**: select a parentage junction and search for an existing person to connect as a co-parent for that group's children. A partnership is not inferred.

Every batch modification requires a confirmation preview and enables one-step Undo. The entire previous JSON collection is retained in memory for Undo, but not stored in the export. Avoid editing concurrently in multiple tabs.

The prior SVG white line casings and crossing bridges have been withdrawn. Ring-route spacing and actual junction markers are unchanged. Family-detail Parent/Child navigation now uses the current focus person; changing a destination dropdown navigates immediately.

## v0.13 — Batch preview, junction selection and crossing gaps

- Every batch review now shows a field-by-field **Current → Proposed** table for each affected record. Unchanged fields are included in a quieter style. No records are committed until confirmation.
- In selection mode, parentage junctions retain their small visible dot but receive a 16-unit interactive target (including keyboard activation). Selecting one opens its parentage context.
- **Family group → Review sibling connections** creates explicit reciprocal sibling records for all pairs among the selected children (or selected people without a junction). It does not create or modify parentage links. Sibling links may be suppressed in the drawing when already implied by shared parentage.
- Adding a co-parent now previews every child’s current versus proposed parentage link.
- SVG crossings receive a local 4.5-unit gap on lower-priority paths, not a continuous white casing. Parentage junctions are excluded from this masking and remain visible on a separate layer. The gap is a visual aid, not a guarantee of crossing-free routing; overlaps along identical tracks require separate routing.
- Trace paths are rendered 6 units thick and prioritised above ordinary connections; the standalone SVG export retains this weight and the crossing masks.
- Existing local collection JSON/schema remains unchanged. Regression tests are under `tests/`.
