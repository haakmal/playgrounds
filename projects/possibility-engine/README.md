# Possibility Engine

The Possibility Engine is a local-first prompt tool for shifting perspectives during creative, design, research, or classroom activities. It can also be used as a way to disrupt assumptions and move around biases.

## How to use

Possibility Engine has one focused interaction:

- Choose a prompt mode
- Spin the prompt reel
- Let the prompt suggest a direction for a sketch, scenario, conversation, question, or experiment

The interface currently includes five modes:

- **Thinking** — reframing, inversion, comparison, and conceptual shifts
- **Doing** — prototyping, sequencing, acting, and making
- **Noticing** — observation, friction, atmosphere, and hidden patterns
- **Challenging** — stress-testing, trade-offs, conflict, and failure
- **Imagining** — future scenarios, metaphors, rituals, and alternate possibilities

Each mode contains a set of prompts. This will be updated over time.

## Want to make it your own?

Prompts are stored in [prompts.json](./prompts.json) as a dictionary. The file is intentionally separate from the interface so it can be edited without changing the UI code.

Each mode follows this structure if you plan to take it away and make it your own:

```json
{
  "id": "thinking",
  "label": "Thinking",
  "cards": [
    {
      "title": "Design for Breakdowns",
      "body": "Intentionally design how the idea could go wrong."
    }
  ]
}
```

To add a prompt, add another object to the relevant mode's `cards` array. To add a mode, add a new mode object with an `id`, `label`, and `cards` array.

## Intro sequence settings

The launch sequence can be adjusted in [app.js](./app.js).

The main controls are near the top of the file as constants:

```js
const INTRO_ENABLED = true;
const INTRO_COPY = { ... };
const INTRO_TIMING = { ... };
const INTRO_GLYPHS = { ... };
```

These control:

- Whether the intro runs
- Welcome copy
- Timing for glyph emergence, text exit, acceleration, and UI reveal
- Glyph count and size range

For example, set `INTRO_ENABLED` to `false` while testing the main interface without the intro sequence getting in the way.

## AI Collaboration

This project was designed and developed by Dr Haider Ali Akmal in collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

AI was used at key points in this project as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
