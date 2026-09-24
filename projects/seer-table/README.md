# The Seer's Table

A DDES1150 Interaction Design playground for fast, student-led creative ideation inspired by David Rose's *Enchanted Objects*.

## Project structure

- `index.html` — application shell and drawer/modal markup.
- `app.js` — application logic, session state, rendering and interaction flow.
- `content.js` — editable ideation content: desires, powers, contextual factors, Ether prompts and crystal-ball readings.
- `copy.js` — editable thematic/classroom language used by the interface.
- `styles.css` — shared layout, components and interaction styles.
- `theme-studio.css` — classroom/studio colour tokens.
- `theme-seer.css` — thematic colour tokens and small thematic adjustments.
- `sample-grimoire.json` — example session data for classroom demonstration.

## Ingredient logic

Before the first spell/concept is crafted, contextual factors are switchable. Selecting a factor activates it and opens its detail editor. Selecting it again turns it off without deleting its saved detail. When the maximum number of active factors is reached, remaining factors are muted but still clickable so the interface can explain why they are unavailable.

Once the first spell/concept is crafted, the current contextual factors are fixed for that Grimoire/session. Existing spells retain their own contextual-lens snapshot, and students can start a new Grimoire/session when they want a different starting context.

## Experience modes

The persistent experience switch changes both interface language and colour treatment:

- **Thematic Experience** — the Seer's Table, Grimoire, spells, Ether and other story-led terminology.
- **Classroom Experience** — interaction-design terminology such as interaction problem, contextual factors, concepts and ideation workspace.

Both modes use the same underlying activity and session data.
