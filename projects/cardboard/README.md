# Cardboard

Cardboard is a local-first card toolkit for building small decks and drawing from them during an activity. It can be used for prompts, names, workshop materials, design exercises, or any other set of cards that benefits from quick random selection.

## How to use

Cardboard has two focused modes:

- **Build** — create and manage multiple decks, add cards, edit card details, set a category or colour, and mark cards active or inactive.
- **Play** — select a deck and draw active cards one at a time. Drawn cards remain visible in the play area, while the remaining deck can be shuffled or reset.

Cards are purposfully kept simple but they can be activated/deactivated to be part of the shuffle or not.

## Local storage and sessions

Cardboard does not use a database or external service. The current session is saved automatically in the browser using `localStorage`.

Export a session before moving to another browser or device. Browser storage can be cleared independently of the application.

## Running locally

Cardboard is a standalone HTML/CSS/JavaScript prototype. Open [`index.html`](./index.html) in a browser, or serve the project directory with any simple static file server if the browser restricts local file storage.

The prototype has no build step and no dependency installation requirement.

## Future directions

Possible future extensions:

- Duplicate and rename decks directly in the deck panel
- Import cards from plain text or CSV
- Optional draw history
- Reordering cards in Build mode
- Multiple play modes, such as draw with replacement or draw a group
- Printable card sheets
- A compact session browser for managing several saved sessions

## AI Collaboration

This project was designed and developed by Dr Haider Ali Akmal in collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

AI was used at key points in this project as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
