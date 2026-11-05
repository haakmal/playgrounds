# Speed Test

A standalone classroom pairing and timed testing tool. Open `index.html` in a modern browser. No dependencies, installation or internet connection required.

## Using the tool

1. Enter student names (one per line) and select **Generate pairings**.
2. Adjust the round duration (0.25–120 minutes), then select **Start timer**. **Space** toggles the timer when not typing or focusing a button.
3. Select **Next round** to rotate partners. **Previous** returns to the exact earlier round (including across cycle boundaries). Navigation resets the timer and stops any running countdown.
4. Use the circular **Settings** button for **Edit roster**, **Full screen** and **New sequence**.

With an odd number of students, the person sitting out is displayed under the pairs. Each person sits out once per round-robin cycle.

## How rounds work

A randomized round-robin rotation ensures each student meets every other student once within a cycle. New cycles are generated after the previous cycle finishes, with an attempt to avoid repeating the immediately preceding pairings. Previously visited rounds are saved as a history, allowing deterministic backward and forward navigation.

## Storage and privacy

Student names, rounds/history and timer duration are saved only in the local browser's `localStorage` (key `speed-test-v2`). Existing `speed-test-v1` rosters are migrated when possible. No information is sent to a server. The running timer is deliberately reset when reloading the page.

Editing the roster or selecting **New sequence** replaces round history. This is an offline, single-file app.
