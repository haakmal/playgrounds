# Inquiry Plates — prototype v6

Single-page, dependency-free HTML/CSS/JavaScript teaching instrument. A composed, authored cultural-probe provocation sits beside a three-part **anatomy** (Look at / Invite / Question). Students can explore the relationship by changing individual parts while retaining the original statement for comparison.

## Run locally

Unzip, open a terminal in the `inquiry-plates-v6` folder, and run:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. Opening `index.html` using `file://` does not work reliably because the app loads `plates.json` via `fetch` (as modern browsers require). There are no external dependencies, analytics, student input, or saved responses.

## Tutor guide: add a new plate

**Edit only `plates.json`.** It contains two collections:

- `plates`: complete authored provocations for Discovery (`"discovery"`) and Concept inquiry (`"concept"`).
- `modules`: independent alternative prompts for the three anatomy dimensions, organised by orientation. These are used by each individual shuffle control and **Change perspectives**.

Copy an existing plate object from the `plates` array, paste it after the last object (with a comma between objects), and change its ID, orientation, statement and annotations. An example:

```json
{
  "id": "D16",
  "mode": "discovery",
  "statement": "What could someone {action|rearrange} to explore {focus|a quiet moment of waiting} and notice {opening|what feels unexpectedly important}?",
  "annotations": {
    "focus": {
      "label": "Waiting and attention",
      "questions": ["What makes one moment of waiting unlike another?", "What gets overlooked?"]
    },
    "action": {
      "label": "Rearrange",
      "questions": ["What could someone shift without being given a correct arrangement?"]
    },
    "opening": {
      "label": "Unexpected significance",
      "questions": ["What might seem minor to the researcher but important to the participant?"]
    }
  }
}
```

**Statement anatomy:** Tag exactly one phrase for each part of the statement using `{focus|...}`, `{action|...}` and `{opening|...}`. The tagged phrase appears as ordinary text with an underline; its enclosing braces and role tag are not displayed. Put ordinary punctuation outside the tags (for example `...?`), so punctuation stays attached to the sentence. Keep tagged phrases reasonably short, and ensure that the entire sentence reads naturally without the tags.

**Annotations:** Each anatomy entry needs a `label` (short phrase) and a non-empty `questions` array (one or more open questions). Questions should encourage interpretation, not prescribe a passport, diary, map or a finished kit. Each plate must have a **unique** `id` such as `D16` or `C16`.

**Alternative modules:** To add more possible variations, append an object to `modules.discovery.focus`, `modules.discovery.action`, `modules.discovery.opening` (or the corresponding `concept` pool). For example:

```json
{"id":"D-FOCUS-16","label":"Unnoticed transitions.","questions":["What changes between one activity and the next?"]}
```

You do **not** need to add a module when you add a plate. Existing modules will still work. You can also add modules without adding a plate. Thus tutors can contribute either complete authored plates or individual directions for reframing.

## Content integrity

At startup, the application validates duplicate plate IDs, presence of both orientations, required anatomy labels/questions and the three tagged phrases. Invalid content produces an explicit error on the start screen and in the console. JSON **syntax** must also be correct: use double quotes, escape quoted text and do not leave trailing commas. You can check syntax with:

```sh
python3 -m json.tool plates.json > /dev/null
```

## Interaction rules

- Students select Discovery or Concept inquiry before seeing a plate.
- **Browse plates** opens a searchable library of every authored statement, with orientation filters and a separate **Surprise me** action. Choosing a statement resets its anatomy to the authored version.
- Clicking an underlined phrase or the corresponding anatomy heading reveals its additional questions.
- The three ↻ controls offer **alternative perspectives on the same authored statement**, without changing the statement. A changed component shows its original alongside the alternative and opens the relevant follow-up questions. Dashed lines indicate a variation.
- **Restore original** returns all three anatomy sections to the plate's authored version.
- **Change all perspectives** changes all three anatomy sections together while leaving the original statement fixed.
- Mode changes load a plate from the selected orientation. Each mode maintains a non-repeating shuffle queue during the session.
- No local storage or response tracking is used; a reload restarts the experience.

## Files

- `index.html` — structure and semantic controls
- `style.css` — responsive editorial layout, typography and leader lines
- `app.js` — display, keyboard-accessible interactions, validation and shuffling
- `plates.json` — tutor-editable content library (30 authored plates and 90 modular alternatives)

## What does changing the anatomy mean?

The left statement is a coherent, authored starting point. The right column begins as its literal anatomy. The circular-arrow controls do **not** rewrite or regenerate that statement: they offer alternative questions, actions or foci **in relation to it**. This is an invitation to rethink a scenario rather than a suggestion that the original question has been replaced. The changed module is visually distinguished, retains a reminder of the original, and immediately opens its own follow-up questions. The statement does not fade when you change a module.

## Choosing from the library

**Browse plates** opens a dialog containing all authored statements in `plates.json`. Search by words or plate ID, and filter by Discovery, Concept inquiry, or All. **Surprise me** selects a random plate from the current filter. New plates added by tutors automatically appear in the library. Nothing needs to be entered in the application, and there is no saved student data.


## Version 6 interface notes

- The Discovery / Concept inquiry orientation switch sits beside the composed provocation.
- Browse plates and Change perspectives are together beneath the statement.
- The anatomy's individual shuffle controls are local to each annotation.
- Underlined phrases open their corresponding anatomical notes.
- Expanded notes animate; modified anatomical content crossfades without replacing the authored statement.
- Sentence punctuation is kept attached at render time; tutors can continue writing ordinary punctuation outside `{role|phrase}` tags.
