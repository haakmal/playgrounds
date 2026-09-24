# Enchantment

A short, playful DDES1150 Interaction 1 ideation playground framed as an encounter with a Seer. The student brings an interaction, gathers contextual ingredients, draws a Desire + Power by interacting directly with the cards, consults a crystal ball that returns one of their own contextual details, then records a student-authored spell on the same Seer's table. Saved spells can be disturbed through the Ether and revisited from the Grimoire.

## Content editing

Classroom-facing content is deliberately separated into `content.js`. Edit the arrays there; the interaction logic in `app.js` should not need to change.

- `desires` — human desire cards.
- `powers` — interactive power cards and their short nudges.
- `ingredients` — contextual lenses shown as selectable cards. Each includes a question and guidance that appears when selected.
- `ether` — What If / disruption statements and their nudges.
- `ballReadings` — short lines used around the crystal-ball reading.
- `openingLines` — opening Seer copy.
- `settings` — minimum response lengths, ingredient limits, and a few activity settings.

Add, remove or reorder objects freely. IDs on ingredient objects should remain unique.

## Session features

- Multiple named grimoires (session names are treated as the student's spell book title).
- LocalStorage persistence.
- Grimoire drawer documenting the student's work in descriptive form.
- JSON export/import.
- Print / Save PDF through the browser print dialog.
- Sessions can be renamed, duplicated and deleted.

## Design intent

The centre of the viewport belongs to the Seer and the current activity. The bottom edge holds the current instruction and action. The top-left menu contains utilities. The top-right Spell Book contains the student's accumulated work. Cards are the primary editable/selectable objects.

The application never generates the student's ideas. Prompts and animations are the nudge; the student supplies the ideation.

## Current prototype refinements

The active spell-crafting experience is now a single collective table rather than a sequence of separate card, crystal-ball and capture screens. Cards are directly clickable; the crystal-ball reading retains the drawn cards in view; the idea capture sits beside the reading; and saving a spell updates that same table rather than moving to a separate saved screen. Transitions are intentionally slower and more ambient. The Ether begins automatically when opened, and empty required responses produce a visible prompt-rail nudge rather than relying on disabled controls.

## Current interaction model

A spell is a persistent concept, not a step in a fixed sequence. Students can craft several spells, open any saved spell later, edit its name or description, and apply the Ether repeatedly. Each Ether intervention is stored as a separate variation beneath the original spell.

The `Seer’s Table / Studio` switch is always available in the top edge of the interface. It is stored with the workspace and changes the working vocabulary without moving the student into a separate application. `Seer’s Table` keeps the story-led language; `Studio` uses interaction-design terminology for students who prefer a more direct framing.

The original Desire + Power pairing that created a spell remains fixed, while the student-authored description and name can be edited. The quandary remains locked once the first spell is saved; changing the starting point requires a new Grimoire.
