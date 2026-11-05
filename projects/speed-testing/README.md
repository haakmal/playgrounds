# Speed Test — v3

A standalone, offline classroom pairing and countdown application. Open `index.html` in a modern browser; no installation or dependencies required.

## Workflow

1. Add one student name per line.
2. Set the test duration (0.25–120 minutes), then start the countdown. During the final ten seconds, the entire timer panel pulses once per second. At zero, the timer becomes white on black.
3. Move between rounds with Previous and Next. Earlier pairings are restored exactly; navigation resets the timer.
4. Optionally select **Start review**. Pairings are temporarily replaced with a review prompt and an independent review duration (0.25–120 minutes). Start the review timer when ready; select **End review** to return to the same pairing round.
5. Use the settings icon for roster editing, full screen, or a new shuffled sequence. Space toggles the active timer when a control is not focused.

## Metrics and pairing logic

**Students** is the active roster size. **Tests / student** is the number of distinct partners each student can encounter in one full round-robin cycle (`students − 1`), not the number completed so far. **Rounds / cycle** is `students − 1` for even rosters and `students` for odd rosters.

An odd-numbered roster rotates the sitting-out student fairly, once per full cycle. Pairing history is saved, so Previous and Next do not regenerate previously visited rounds.

## Data and persistence

Rosters, round history, test duration and review duration stay in browser `localStorage` (`speed-test-v2`). Older compatible data is reused. Active timers and review mode reset on reload. Nothing is sent to a server. Editing the roster or starting a new sequence replaces the current round history.
