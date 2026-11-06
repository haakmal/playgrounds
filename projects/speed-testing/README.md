# Speed Test · v6

Standalone, offline classroom pairing and countdown utility. Open `index.html` in a modern browser. No external libraries or build tools are required.

## v6 layout
- Both panels expand to the available viewport height at desktop/projector widths.
- The Speed Test title/status lives in the timer panel; the Pairings title, roster metrics and gear/settings dropdown live in the pairing panel.
- The round counter is prominent alongside Previous / Next round actions.
- Pair cards retain the tiered sizing of v5, including 12 pairs at 1920 × 1080, without alternating backgrounds.

## Operation
Enter 2–24 students, one name per line. The round-robin rotation covers each unique opponent once per cycle; odd rosters rotate sit-outs fairly. The **Previous** and **Next round** controls preserve generated history. Test and optional review phases have independent adjustable timers. In the last ten seconds, the timer panel pulses; when time expires it switches to white-on-black.

Use the gear menu in the top-right of Pairings to edit the roster, toggle full screen or generate a new shuffled sequence. Press Space to pause/start when not focused on an interactive control. The roster, round history and durations are stored locally in your browser.

## v7 polish

The timer title is a heading sized to match Pairings, with a separate Ready / Running / Paused / Finished status badge. The settings gear rotates smoothly on hover, keyboard focus, and while the dropdown is open. Panel geometry, pairing grid, and core logic are unchanged.

## Countdown sound (v8)

The last ten seconds of **both** test and review countdowns use a short synthesised tone on each visible pulse, followed by a slightly longer end tone at zero. The **Sound on / Sound off** button beside **Start review** toggles sound without affecting the visual countdown; the preference is saved in browser storage. Sound is on by default. No audio assets, downloads, or external services are needed. Browsers require a user gesture before playing audio, so pressing Start or Resume enables the sound context. Pausing, resetting, switching mode, or changing round stops the countdown cues.
