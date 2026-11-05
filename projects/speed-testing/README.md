# Speed Test — v5

Standalone, offline classroom pairing and timer utility. Open `index.html` in a modern browser. No installation or build is required.

## Layout

The pairing grid preserves a readable, consistent card height and large name typography rather than stretching cards vertically to fill available space. Its column count responds to the active pairing count: 1 pair = 1 column; 2–4 pairs = 2; 5–9 pairs = 3; 10–12 pairs = 4. At 1920 × 1080, the maximum roster of 24 students displays as a 4 × 3 grid. Card backgrounds are transparent, with subtle borders only. Smaller viewport sizes use responsive layouts and can scroll as needed. Long names wrap inside their cards.

## Use

1. Enter 2–24 student names in the roster editor, one per line.
2. Set the speed-test duration and start, pause, or reset the countdown. The last 10 seconds pulse; at zero, the timer becomes white on black.
3. Navigate Previous / Next for a new pairing round; previous rounds retain exact pairings.
4. Optionally select Start review to show a reflection prompt and switch to an independently adjustable review countdown. End review returns to the same pairings.
5. Use the settings icon to edit the roster, enter fullscreen or begin a new sequence.

The metrics display the roster size, maximum distinct partners per student, and number of rounds in one round-robin cycle. An odd-numbered roster rotates the student sitting out fairly. Roster, settings and pairing history are saved locally in the browser (`localStorage`).
