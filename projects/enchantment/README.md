# Enchantment

A short, playful DDES1150 Interaction 1 ideation playground framed as an encounter with a Seer. The student brings an interaction, gathers contextual ingredients, draws a Desire + Power, consults a crystal ball to pull one of their own contextual details into the spell, sketches and records their own idea, then optionally disturbs any saved spell through the Ether.

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

- Multiple named spell books.
- LocalStorage persistence.
- Spell Book drawer documenting the student's work in descriptive form.
- JSON export/import.
- Print / Save PDF through the browser print dialog.
- Sessions can be renamed, duplicated and deleted.

## Design intent

The centre of the viewport belongs to the Seer and the current activity. The bottom edge holds the current instruction and action. The top-left menu contains utilities. The top-right Spell Book contains the student's accumulated work. Cards are the primary editable/selectable objects.

The application never generates the student's ideas. Prompts and animations are the nudge; the student supplies the ideation.
