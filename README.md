# Word Up — a single-word forehead guessing game

A standalone, mobile-friendly party game. One player holds the phone against their forehead, screen facing friends; friends give clues, and the player guesses. **One phone serves the entire group.** This is a local pass-and-play game, not an online room service. It is not affiliated with Heads Up.

## Word bank: exact count, no phrases

This release contains **2,345 unique single words**, across **12 categories** and **three difficulty levels**. It does **not** contain a million words, generated phrases, or a million combinations counted as words. Difficulty is editorial and vocabulary-based, not an automatic reading-age assessment; Hard deliberately contains specialist and obscure words.

- Easy: 813 familiar words.
- Medium: 797 less obvious words.
- Hard: 735 specialist or obscure words.
- Mixed: draw from all three levels in the selected category.

Categories: Animals, Food, Everyday, Nature, People, Actions, Sports, Science, Feelings, Places, Arts, Clothes.

The built-in words were selected for this project, not scraped from another game's deck. Words may have multiple meanings or regional spellings; accept any appropriate clue. No definitions are required, and no AI/API subscription is used.

Custom imports accept plain TXT or simple CSV lists (not general quoted CSV): one word per line, or separated by commas/semicolons. Pick the imported difficulty. The importer normalizes case and Unicode, removes duplicates against the built-in and custom bank, and rejects phrases, punctuation, numbers, and words shorter than two or longer than forty letters. It accepts accented letters. File limit: 2 MB; custom bank limit: 20,000 words. A file header is treated as a word, so remove headers before import. Imports stay in the browser and are not uploaded.

Word history persists in browser storage. Within the chosen category/difficulty pool, words are shuffled and do not repeat until that pool is exhausted. Then that pool reshuffles. A card drawn but left unanswered at timeout is treated as seen. A very small custom pool can therefore repeat during a round. Reset word history explicitly if you want all words available again.

## Deploy on Render

1. Extract `Heads-Up-Game-Render.zip`.
2. Create a **new GitHub repository** for this game (keep the cricket game separate).
3. Upload the **contents inside `Heads-Up-Game`**, including `public` and `test`, so `package.json` is at the repository root.
4. Create a Render **Web Service** connected to that repository:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Branch | Your uploaded branch, usually `main` |
| Root directory | Leave blank |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check | `/healthz` |
| Environment | `NODE_VERSION=22` and `NODE_ENV=production` |

A `render.yaml` Blueprint is also included. No database, secrets, API keys, or third-party Node dependencies are needed. Open the HTTPS Render URL on your phone. Sensor permissions depend on the browser and device; a successful deployment does not guarantee motion support. The button fallback works without sensors.

## Play

1. Select category, difficulty, 30/60/90/120-second timer, and controls.
2. Enter 1–8 team/player names separated by commas. Each correct word earns one point; skipping has no penalty.
3. Press Let's play. For tilt controls, press Enable motion and allow the browser request if shown.
4. Hold the screen upright at forehead height, facing your friends. Hold still for a second and press Calibrate upright.
5. Practice a downward tilt, return upright, and practice the opposite upward tilt. The app learns the actual down direction rather than assuming a sensor sign.
6. Return upright and press Ready. A five-second countdown gives time to place the phone.
7. Guess words. Tilt the screen down for Correct and up for Skip. **Return upright after every tilt.** Brief sound/color feedback confirms the result.
8. Review answers after the round. Toggle any incorrect outcome before passing the phone to the next team.

Desktop: **Space / right arrow** = correct, **left arrow** = skip, **P** = pause. Buttons remain available during tilt rounds. Typing in form fields does not trigger gameplay.

Full-screen and screen wake-lock are best effort. A browser may refuse either; play remains available. Landscape is recommended but portrait works. Motion calibration uses screen inclination relative to gravity so it does not depend on a specific portrait/landscape Euler-angle axis.

## Motion implementation and limits

The app listens to `devicemotion` and uses `accelerationIncludingGravity`. It checks for a secure context, requests `DeviceMotionEvent.requestPermission()` from an explicit button press where that API exists, and waits for actual sensor data. A device can expose the API but supply no usable samples; the UI reports that and offers buttons.

Calibration requires at least twelve recent, relatively stable samples, with the screen near upright. Gravity magnitude checks reject missing/implausible samples. A low-pass filter suppresses jitter. A deliberate tilt must exceed 35 degrees relative to calibration for at least 160 ms. Returning within 12 degrees of neutral for at least 250 ms re-arms input, with an 800 ms minimum between detections. The training step learns which sign is the player's down gesture. These are heuristics, not a guarantee against all false detections.

The timer uses a monotonic clock. Pausing freezes time and blocks input. Hiding the page automatically pauses an active round; a hidden countdown stops. Motion data stopping during play pauses the round; Resume switches to buttons if motion is still unavailable. A short feedback lock prevents rapid button clicks from double-counting.

No camera, microphone, accounts, remote messages, or motion-data uploads are used. The Node server serves files only. Scores, settings, custom words and seen-word history are stored locally in this browser. They are not shared across devices, and clearing site data removes them. Private mode, disabled storage, or storage quota exhaustion can prevent persistence; the scoreboard displays a notice. Reset buttons ask for confirmation.

Reference: [MDN — DeviceMotionEvent.requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static) and [MDN — devicemotion event](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event).

## Run locally

With Node.js 22 or newer installed:

```sh
npm ci
npm run build
npm start
```

Visit `http://localhost:3000`. Motion on a separate phone using a plain HTTP LAN address will generally be blocked; use the deployed HTTPS URL for the phone test.

## Validation

```sh
npm test
```

**14 automated tests** cover single-word validity and exact bank counts, category/difficulty coverage, filtering, repeat handling, import validation, scoring, timeout, pause/resume, review corrections, gravity math, calibration, tilt thresholds, re-arming, jitter rejection, HTTP routes, required client IDs and security headers. Client JavaScript was syntax-checked and the build passed.

A physical phone and visual browser playtest were not available during development. Before a group session, test permission acceptance/denial, both tilt directions, repeat prevention, landscape display, pause/resume and button fallback on your intended phones. Sensor behavior can vary across browsers and hardware.

## Files

- `server.js`: small Node HTTP server and health check.
- `public/index.html`, `public/style.css`: responsive interface.
- `public/app.js`: UI, calibration, permissions, rounds, audio, storage and imports.
- `public/engine.js`: testable deck, round and tilt logic.
- `public/words.js`: complete curated single-word bank.
- `test/`: engine and HTTP tests.
- `render.yaml`: deployment configuration.
