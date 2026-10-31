# Family Atlas — Layout and pathway revision v0.3

A static, local-first family atlas designed for a personal GitHub Pages project. No accounts, backend, analytics or external services. HTML/CSS/JS only; data stays in browser storage unless you export or share it.

## Running

Extract the folder, then serve it over HTTP:

```bash
cd family-atlas
python -m http.server 8000
```

Open http://localhost:8000. Upload the folder unchanged to a GitHub Pages directory to deploy. The application's own files include fictional example JSON data only; do not commit private family archives to a public repository.

## Main controls

- **Add person** with no person selected: create an independent person (name or unknown only).
- **Select a node**, then use **+ Parent / + Sibling / + Child / + Partner / + Guardian / + Other** to create a new relative in a single operation.
- **Connect existing people**: choose a relationship type, tick nearby family members (within two graph connections), or fuzzy-search the whole atlas. Multiple connections can be committed together.
- **Edit relationship** in the person's side panel to update partnership classification/status/dates or parentage roles. Reciprocal sibling/partner connections use a single stored relationship regardless of which side initiates it.
- **Drag empty space to pan**, scroll to zoom, or use **+ / − / Fit** bottom right. **Fit all** frames the whole graph; at that scale large graphs may be small. Zoom in to read.
- **Focus**: select someone and use Focus here, adjust ancestor/descendant depth, select another relative, Focus here again, and Back to retrace. Exit focus returns to the entire collection.
- **Trace path**: use the top toolbar or the Focus bar to search for two people and reveal their shortest recorded relationship chain. The viewport isolates and highlights the route; View steps describes each edge. This is a connection route, not an inferred cousin/uncle title.
- **Deceased markers**: a small dagger marker (†) appears on people explicitly marked deceased. A missing death date is not treated as proof of life.
- **Former relationships**: partnership lines retain their dashed connection; divorced, separated, former and other non-current statuses have small labels on the graph. Edit the connection in the side panel.
- **More**: load fictional family example, start empty, rename, or back up the current collection.
- **Import**: load an independent family JSON. Potential same-person records are suggested, but remain separate unless explicitly matched. A downloaded JSON recovery snapshot precedes committing the import.
- **Export**: complete JSON archive (durable source of truth) or current graph as SVG (visual presentation only).

## Test datasets

- `samples/three-children-partners.json` — dedicated regression case: two parents, three children, each with a partner and child; one divorced partnership and one deceased ancestor. Import into an empty collection to examine the layout quickly.

- `samples/extensive-family.json` — 76 people, 91 connections, multiple independent components, many generations, same-parent siblings, former marriages, unmarried co-parents, adoption and guardianship, unknown names.
- `samples/contribution.json` — 19 people, 17 connections; contains independent records of people already present in the extensive sample (including conflicting birth years) plus new relatives and an independent branch.
- `samples/contribution-updated.json` — 20 people, 18 connections; retains its collection identity and record IDs, introduces one person, and revises one birth year.

### Suggested manual tests

1. Start empty. Add Yourself, add Brother A and Brother B from Yourself using **+ Sibling**. Each sibling link should appear only once, and each person's panel should display the reciprocal relationship. Brothers A and B are not automatically asserted to be siblings of one another.
2. Add a parent to Yourself, then add other children to the parent. Examine the inferred structure. (Explicit sibling assertions remain stored.)
3. Start an empty collection and import `samples/three-children-partners.json`; verify each child is adjacent to their partner, divorced status is labelled, and the deceased marker appears. Trace a path from one grandchild to another.
4. Load the extensive fictional sample from More; zoom into its main family and pan to other disconnected components. Focus on a grandchild, then refocus on an ancestor and use Back.
5. Import contribution.json, manually match a few overlapping people, commit, then import contribution-updated.json. Previously mapped source identities should be recognised, with new people added without repeating mapped records.
6. Export JSON, start empty, import the archive, and confirm people/relationships remain available.

## Data model

- `people`: each person has a UUID; unknown names are distinct records, not a shared `Unknown` person.
- `relationships`: stored once as source->target; sibling/partner/other are undirected for deduplication and interpretation; parentage and guardianship are directional. Parentage roles may overlap.
- `sources`, `assertions`, `identityMappings`, `importHistory`: provenance, imported conflicts, source-qualified match decisions and import metadata.
- Relationships never imply marriage from co-parentage, or biological parentage from partnership.
- An absent date or parent is unrecorded, not evidence of a negative fact.

## Important current limitations

- **Import review:** suggested identity matches can be selected, but field conflicts are preserved internally rather than shown in a complete side-by-side field editor. Relationship differences involving the same logical edge are partly consolidated. A full undo/merge reversal feature is not implemented.
- **Layout:** partners at the same parentage level are packed as adjacent blocks before each generation is ordered, fixing the common three-children/three-spouses case. Multiple co-parents, crossing parentage lines and unusually layered partnerships can still be difficult to render without collisions. No manual node positioning.
- **Path tracing:** shortest paths traverse the recorded graph, including partnership and other edges; they do not automatically infer a precise kinship term. Unconnected people have no traceable path.
- **Derived relationships:** explicit sibling relationships and shared-parent connections are visible, but there is not yet a comprehensive inferred-kinship panel (e.g. automatically listing all aunts, uncles and cousins).
- **History:** partnership status, dates and roles can be edited, with current/non-current status shown in the graph. Multiple relationship events are not separately timestamped as a complete history timeline.
- **Validation:** prevents creating direct self-links and directed parentage cycles through the editing UI, but imported archives are not fully schema-sanitised. Use files from trusted family contributors, and retain backups.
- **Browser storage:** localStorage has finite capacity and can be cleared. The program is not an encrypted vault. For long-term preservation, regularly export and separately store JSON copies. The current storage namespace is `family-atlas-v02`, so older prototypes' local data are not silently migrated; export the old data before switching versions if needed.
- **Mobile:** supports touch dragging and button-based zoom; pinch zoom is not implemented.

Copyright-free sample data is wholly fictional. Contributions are never uploaded to a server by the application.

## Version 0.4: multiple rendering views

This is a view-comparison iteration. The same local JSON people, relationships, sources, and identity matches are shared between modes.

- **Atlas**: connected-component overview. Each marker represents one disconnected network, not a named family and not a single nuclear household. Select a marker to explore its members.
- **Network**: the existing layered graph of the selected connected network. This remains an experimental layout; complex co-parentage can still produce crossing lines.
- **Radial**: centred on the selected person, with optional 1–3 steps of recorded connections. Rings represent connection distance, *not generations*. Select another person and choose **Centre on selected** to move through the graph.
- **Lineage**: generational ancestor/descendant focus, plus contextual partners and siblings. Choose **Focus here** from a person's details panel.

### Testing

Under **More**, load the extensive fictional family, then use Atlas, Network, Radial and Lineage to compare the views. The `samples/three-children-partners.json` file specifically tests two parents, three siblings, their partners, and their children. Import that file into an empty collection to examine the scenario independently. The two contribution samples remain available for testing duplicate review and repeat imports.

This iteration does not claim to completely remove line crossings from the Network view. It is intended to test whether different spatial layouts should be used for overview, local relationships, and lineage before undertaking a deeper renderer rewrite.
