Implement Phase 2 foundation for Desktop Dev Cat, in this exact order. Do not skip steps. Do not touch existing cat animation, motion, drag, roaming, or reminder code except where explicitly listed.

STEP 1 — Fix ESLint
Add a Node environment/globals block in eslint.config.js for scripts/dev.mjs and scripts/track-terminal.mjs so setTimeout, clearTimeout, fetch, console, AbortController are recognized. Confirm `npm run lint` passes with zero errors.

STEP 2 — Add Vitest
Install vitest as a dev dependency. Add a `test` script to package.json. Add a minimal vitest.config.ts if needed. Create a tests/ folder at repo root.

STEP 3 — Add zod
Install zod as a dependency. Create src/main/ipcValidation.ts with a zod schema for the existing app-settings:set payload (booleans only: alwaysOnTop, focusMode, launchAtStartup, paused). Wire this validator into the existing app-settings:set IPC handler in main.ts so invalid payloads are rejected, not silently written.

STEP 4 — AI foundation files (new src/ai/ folder)
Create:
- src/ai/AiTypes.ts — AiRequest, AiResponse, AiStatus, AiTimeoutError, AiProviderUnavailableError types
- src/ai/AiProvider.ts — AiProvider interface: id, displayName, isAvailable(), complete(request, signal)
- src/ai/OllamaProvider.ts — implements AiProvider against http://localhost:11434, default model "llama3.2:3b", isAvailable() checks GET /api/tags with 1500ms timeout
- src/ai/AiService.ts — run(request) with AbortController, default 15000ms timeout, cancel(requestId)
- src/ai/redaction.ts — redact(input: string) function. Must strip API_KEY/TOKEN/SECRET/PASSWORD key-value pairs, strip process.env dumps, strip URLs with embedded credentials, and shorten Windows and Unix file paths to their LAST TWO segments (not one) — e.g. C:\Users\HP\project\src\main.ts becomes ...\src\main.ts, not ...\main.ts.

STEP 5 — Tests
Create tests/redaction.test.ts covering: API key redaction, token redaction, password redaction, Windows path shortened to last two segments, Unix path shortened to last two segments, URL with credentials redacted, plain text unchanged.
Create tests/CatStateMachine.test.ts covering existing transitions only (idle/curious/dragging/walking/sleeping/happy/angry) — do not add thinking/confused/celebrating states yet, that is a later step.

After each step, run lint and test and report pass/fail before moving to the next step. Do not implement AI IPC handlers, AI settings UI, Ask-the-Cat panel, or new cat states yet — those come after this foundation is verified working.
















================================================================================================
Upgrade the reminder speech bubble visuals in CatOverlayRenderer.ts (PixiJS-drawn bubble shown above/below/beside the cat). Do not touch reminder scheduling logic, reminder content data, or timing — visual/draw code only.

CONTEXT
Current bubble: flat cream background, orange outline pill badge, plain rounded-rect body, sharp triangle tail, title and message text same visual weight, no entrance/exit animation, no per-category color.

REQUIREMENTS

1. Category color mapping
Create/reuse a single categoryColor map (category -> hex) covering all existing reminder categories: stretch, coffee, focus, water, debug, build, git, lint, refactor, test, push, logs, break, panic. Use this exact palette:
stretch: #4caf7d, coffee: #b07b4f, focus: #4c8bf5, water: #3fb8c9, debug: #e05a5a, build: #f0b23c, git: #9a6bd6, lint: #f0b23c, refactor: #9a6bd6, test: #4c8bf5, push: #9a6bd6, logs: #9a9aa8, break: #4caf7d, panic: #e05a5a.
Export this map from a shared location (e.g. src/cat/categoryColors.ts) so it can later be reused by the reminder card UI — do not duplicate the palette in two places.

2. Bubble background
Replace flat cream fill with a subtle vertical gradient (lighter at top, slightly darker at bottom, same cream family — keep it light, not dark-mode). Add a soft drop shadow behind the bubble (small y-offset, low alpha, blurred if Pixi filter available, otherwise a duplicated offset shape at low alpha as fallback).

3. Left accent stripe
Add a 3-4px solid color stripe along the left inside edge of the bubble, using categoryColor[reminder.category]. Corners of the stripe should follow the bubble's rounded corners, not overhang square.

4. Badge redesign
Replace the current outlined pill badge with a filled pill using categoryColor[reminder.category] as background and white/light text for contrast, keeping current badge text (e.g. "PUSH").

5. Title row icon
Add a small icon/glyph next to the title text, one per category (reuse any icon set already in the project, or simple Pixi-drawn glyphs if no icon set exists — keep it simple: a colored dot is an acceptable fallback if a full icon set is out of scope). Icon color also uses categoryColor[reminder.category].

6. Text hierarchy
Title text stays current weight/size. Message text should use a visually lighter/muted shade of its current color (reduce opacity or shift to a softer gray-brown tone) so title reads as primary and message as secondary.

7. Tail shape
Round the tip of the direction tail slightly instead of a sharp triangle point — small radius, matching the bubble's corner rounding style.

8. Entrance animation
On bubble show: start at scale 0.9 and alpha 0, animate to scale 1 and alpha 1 over ~180ms with an ease-out/back-out curve. Use the project's existing ticker/animation approach (no new animation library unless one is already a dependency).

9. Idle float
While visible, apply a small vertical bob to the bubble synced with or derived from the existing cat idle bob phase in CatMotionController (reuse the existing sine/phase value if accessible, do not create a fully separate unrelated oscillator) — amplitude ~2px.

10. Exit animation
On bubble hide: fade alpha to 0 and drift upward slightly (~4-6px) over ~150ms before removal, instead of an instant pop/removal.

CONSTRAINTS
- No new dependencies unless something is clearly missing for blur/shadow (check package.json first; prefer a manual fallback over adding a library).
- Keep all existing bubble placement logic (above/below/beside cat, directional tail) unchanged — this task is styling and motion only.
- After changes, run lint and confirm it still passes. If a test file exists for CatOverlayRenderer, run it; if none exists, do not add one for this task.
- Report back a short summary of exactly which files were changed and which were left untouched.





so this will be the full prompt i need to give to this 
but i am also tinging to create a web page to manage the cat functionlity liek user can do some custom this on webpage the cat on window is fine i also want to make a web page for this so that the 
