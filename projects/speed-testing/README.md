# Speed Test

A standalone, offline-friendly classroom speed-testing pairing tool. Open `index.html` in any modern browser; no build steps or external dependencies are needed.

## Using it

1. Enter one student name per line and select **Generate pairings**.
2. Set the duration in minutes (0.25 to 120), then select **Start timer**.
3. When the countdown finishes, select **Next round** for a new set of partners. You can also advance early.
4. Use **Full screen** when projecting. Press **Space** to start or pause when focus is not on a control.

## Pairing logic

The tool uses a randomized round-robin (circle method) pairing rotation. Each student meets every other student once during a complete cycle. For odd-sized rosters, a virtual BYE rotates so each student sits out exactly once per cycle. After a cycle, another randomized sequence is generated, trying to avoid immediate pairing repeats across cycle boundaries. A cycle has `N - 1` rounds when `N` is even and `N` rounds when `N` is odd.

## Data and behaviour

- Names, round position, and timer duration are stored locally in your browser (localStorage).
- No network requests, accounts, trackers, or external libraries.
- The running countdown is not persisted; on reload the timer resets to the configured duration while the pairing round is retained.
- Editing the roster generates a new sequence. **New sequence** also resets the rotation.
- Pairings are generated in browser memory; no student information is transmitted.
