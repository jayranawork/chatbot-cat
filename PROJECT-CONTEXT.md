# Desktop Dev Cat — Complete Project Context

> Purpose: This document is the working handoff for future development and AI-feature planning. It describes the code that currently exists, the behavior the cat currently provides, the project architecture, the assets, the development workflow, known gaps, and safe extension points.

## 1. Project identity

**Project name:** Desktop Dev Cat  
**Package name:** `desktop-dev-cat`  
**Version:** `0.1.0`  
**Author:** Jay Rana  
**Primary target:** Windows desktop  
**Product type:** A small always-on-top desktop companion cat for developers  
**Current phase:** Early Phase 1 / functional MVP prototype

Desktop Dev Cat is not a normal browser application. It is an Electron desktop utility with a transparent, frameless floating window. The cat is intended to live above the user's desktop, react to interaction, provide gentle developer-oriented reminders, and eventually react intelligently to development activity and AI events.

The product direction is inspired by expressive desktop pets and Comnyang-like interactions, but the current art and behavior system is an independent implementation. The current cat uses an imported grey cartoon sprite pack; the planned visual direction is a compact black pixel-art cat with a bright outline.

## 2. What the cat does today

The following capabilities are implemented in the current codebase.

### Desktop presence

- Opens as a transparent, frameless Electron window.
- Uses a fixed-size non-resizable cat window.
- Keeps the window above other windows using Electron's `screen-saver` always-on-top level.
- Hides the normal window frame and menu bar.
- Supports Windows desktop behavior rather than browser-only behavior.
- Can be shown, hidden, toggled, focused, or reset through the app and tray.
- When hidden, a small restore window appears near the lower-right of the current display.
- The restore window provides a `Show Cat` button and changes to `Stop Walking` while roaming.

### Cat animation

The current frame assets are loaded from `src/assets/cat/**/*.png` with Vite's eager `import.meta.glob`. The loader groups files by their containing folder and numerically sorts frames.

Current animation folders and frame counts:

| Animation key | Current frames | Current use |
|---|---:|---|
| `idle` | 10 | Normal idle and curious states |
| `walk` | 10 | Walking and dragging |
| `run` | 8 | Stretching / stronger movement |
| `jump` | 8 | Happy reaction |
| `fall` | 8 | Loaded for future or alternate behavior |
| `hurt` | 10 | Angry state |
| `dead` | 10 | Loaded but not mapped to a current state |
| `slide` | 10 | Sleeping state |

The animation controller maps logical cat states to animation keys and playback speeds:

- `idle` → idle
- `curious` → idle
- `dragging` → walk
- `walking` → walk
- `stretching` → run
- `sleeping` → slide
- `happy` → jump
- `angry` → hurt

### Idle life and motion

The motion controller adds procedural motion on top of the frame animation:

- light idle bobbing
- idle sway
- subtle random phase variation per app instance
- cursor-based look/follow offset
- blinking with randomized cooldown and hold duration
- different movement rhythm for sleeping and walking
- facing/orientation support
- release spring motion after dragging
- edge-contact spring motion after hitting a screen/window boundary

Blinking is disabled or eased out while dragging and sleeping. Cursor following is softened during dragging and disabled for sleeping/walking follow behavior.

### Dragging

- The cat can be dragged from the renderer.
- Drag tracking is handled by the Electron main process on a roughly 16 ms interval.
- The main process reads the current cursor position and moves the window.
- Dragging is clamped to the active display work area.
- The cat remains partly visible near screen boundaries rather than disappearing fully.
- Drag start, move, and end travel through the preload IPC bridge.
- Release momentum is passed to the motion controller to create a spring/settle effect.
- Dragging changes the cat state and animation.
- Edge contact emits an event so the cat can show an impact effect and motion response.

### Roaming / walking across the desktop

- The cat can roam horizontally across the active display.
- Roaming runs on a 16 ms timer at approximately 3.2 pixels per tick.
- Direction reverses at the horizontal work-area edges.
- The renderer receives direction changes and edge events.
- Roaming state is available to both the main cat window and the restore window.
- Pausing the app stops the roaming timer while preserving the user's roam request.

### Reactions and overlays

`CatOverlayRenderer` provides PixiJS overlays for:

- `Zzz` sleep text while sleeping
- `:)` happy text while happy
- animated yellow sparkles for happy and stretching states
- steam puffs for angry and intense stretching states
- reminder speech bubbles with badge, title, message, and directional tail
- automatic reminder bubble placement above, below, or beside the cat depending on available room

`CatPropController` provides a small procedural pencil prop. It is shown during writing-related behavior, follows the cat's facing direction, and has a small animated movement.

The smoke explosion asset pack is used for secondary effects such as edge hits and reminder/interaction effects. The smoke pack is not used as the cat's body art.

### Tap and pet interactions

The renderer currently includes:

- quick multi-tap tracking
- a triple-tap happy reaction with jump animation and a smile marker
- an eight-tap unlock gesture for the hidden reminder launcher
- hover/cursor awareness
- drag-versus-click handling so normal dragging is not mistaken for tapping

### Reminders

The cat has built-in developer and wellbeing reminders.

Built-in reminder categories include:

`stretch`, `coffee`, `focus`, `water`, `debug`, `build`, `git`, `lint`, `refactor`, `test`, `push`, `logs`, `break`, and `panic`.

The scheduler supports:

- focus reminders every 45 minutes
- coffee reminders every 90 minutes
- randomized surprise reminders between 14 and 31 minutes
- custom reminders at a selected local time
- enabled/disabled custom reminders
- duplicate prevention for a reminder on the same day/time
- approximately 8 seconds of visible reminder time
- manually triggered test popup, sparkle, and steam reactions through the hidden reminder panel

The reminder UI is intentionally hidden during normal use. It is unlocked by tapping the cat eight times quickly, then opening the small corner launcher.

### Developer activity awareness

The project includes terminal tracking scripts and a shared command classifier.

Recognized command categories:

- build
- test
- git
- debug
- install
- run
- serve
- watch
- unknown

The classifier detects common commands such as npm, pnpm, yarn, Vite, Electron, TypeScript, Jest, Vitest, Git, Cargo, Go, Maven, Gradle, pip, and Poetry patterns. It also marks likely long-running commands.

The development runner writes an activity signal to an application signal directory, normally:

```text
%USERPROFILE%\\.desktop-dev-cat\\activity-signal.json
```

The Electron main process watches this directory and forwards valid signal changes to the renderer. The cat can use those signals to change developer-oriented behavior. This is a local development-awareness path, not an AI system yet.

### Settings and tray

Persistent settings are stored using Electron Store. Current settings are:

- `alwaysOnTop`
- `focusMode`
- `launchAtStartup`
- `paused`

The tray supports:

- show
- hide
- toggle
- reset position
- pause/resume
- always-on-top toggle
- focus mode toggle
- launch-at-startup toggle
- quit

On Windows, `launchAtStartup` is connected to Electron's login item settings.

### Runtime and diagnostics

The preload bridge exposes runtime information including:

- app version
- Electron version
- Chrome version
- Node version
- platform
- packaged/development status

The main process also contains file-watching and error logging paths used by the development workflow. The documented Pino dependency is not currently present in `package.json`; current source uses native console logging in several places.

## 3. What is not implemented yet

The following items are planned or discussed in documentation but are not currently complete implementations:

- AI provider integration
- natural-language chat with the cat
- AI-generated developer explanations
- stack-trace explanation
- compiler-error summarization
- AI fix suggestions
- model/provider selection
- cloud synchronization
- voice input or output
- sound effects
- Git integration beyond command classification
- full VS Code integration
- robust terminal integration beyond the local development scripts
- multiple pets
- themes and skins
- production-quality custom black pixel-art cat assets
- dedicated stretch, blink, typing, kneading, overheat, hunting, and scroll-paper art
- full physics or rigged segmented-body animation
- installer/update system
- automated test suite
- release smoke-test automation

The project documents several future Comnyang-like ideas: cursor and eye following, mouse hunting, head petting, keyboard kneading, overheat/steam mode, paper unrolling on scroll, and AI thinking/completion reactions. These are product ideas, not all current features.

## 4. Architecture

### Process model

```text
Electron main process
  ├─ creates and controls windows
  ├─ owns tray and startup settings
  ├─ handles window movement and roaming
  ├─ watches developer activity signal files
  └─ exposes narrow IPC handlers

Preload bridge
  └─ exposes window.desktopDevCat with typed application operations

Renderer process
  ├─ React application shell
  ├─ CatRenderer
  ├─ PixiJS animation scene
  ├─ overlays, props, reminders, and effects
  └─ local reminder UI state

Shared layer
  ├─ app settings types/defaults
  ├─ runtime information types
  ├─ developer signal types
  └─ command classification
```

### Important source files

| File | Responsibility |
|---|---|
| `src/main/main.ts` | Electron lifecycle, windows, tray wiring, IPC, roaming, drag tracking, signal watching |
| `src/main/preload.ts` | Safe renderer-to-main API exposed through `contextBridge` |
| `src/main/appSettings.ts` | Electron Store creation and settings persistence |
| `src/main/appTray.ts` | System tray menu and tray actions |
| `src/window/createMainWindow.ts` | Main transparent cat window creation and dev/production loading |
| `src/renderer/App.tsx` | Renderer root; mounts `CatRenderer` |
| `src/renderer/main.tsx` | React renderer bootstrap |
| `src/renderer/styles.css` | Renderer UI and transparent-window styles |
| `src/cat/CatRenderer.tsx` | Main PixiJS cat scene, interaction wiring, animation loop, reminders, and UI |
| `src/cat/CatStateMachine.ts` | Allowed logical state transitions |
| `src/cat/CatAnimationController.ts` | Logical state to frame-animation mapping |
| `src/cat/CatAssetLoader.ts` | Dynamic PNG discovery, grouping, sorting, and Pixi texture loading |
| `src/cat/CatMotionController.ts` | Procedural bob, blink, look, drag release, edge spring, and movement offsets |
| `src/cat/CatOverlayRenderer.ts` | Text, sparkle, steam, and reminder bubble overlays |
| `src/cat/CatPropController.ts` | Pencil/writing prop |
| `src/cat/CatReminderScheduler.ts` | Built-in, surprise, and custom reminder timing |
| `src/cat/CatReminderContent.ts` | Reminder labels, colors, titles, and messages |
| `src/cat/CatEvents.ts` | Typed in-memory event bus |
| `src/cat/CatTypes.ts` | States, animation keys, reminder types, and event names |
| `src/shared/devSignalClassifier.ts` | Command categorization |
| `scripts/dev.mjs` | Starts Vite, TypeScript watch, Electron, and signal handling |
| `scripts/track-terminal.mjs` | Runs a command while recording developer activity signals |
| `scripts/devSignalClassifier.mjs` | JavaScript counterpart of the shared classifier |

### State machine

Current logical states:

```text
idle, curious, dragging, walking, stretching, sleeping, happy, angry
```

The state machine blocks invalid transitions. Examples:

- `idle` can transition to curious, dragging, walking, sleeping, happy, or angry.
- `dragging` can transition to stretching or idle.
- `happy` can return to idle.
- `sleeping` can return to idle.

State changes emit `CAT_STATE_CHANGE` through the local event bus. The event bus also defines drag-start, drag-end, assets-ready, and reminder events.

### IPC boundary

The preload API currently provides methods for:

- reading and updating settings
- reading runtime info
- reading developer signals
- showing, hiding, toggling, and resetting the cat window
- enabling/disabling roaming
- receiving settings, signal, roam direction, roam state, and edge-contact events
- starting, moving, and ending window drag tracking

The main window uses `contextIsolation: true` and `nodeIntegration: false`, which is the correct baseline for Electron renderer isolation.

## 5. Repository layout

```text
ai-companion/
├─ src/
│  ├─ main/                 Electron main process and preload
│  ├─ window/               BrowserWindow construction
│  ├─ renderer/             React entry point and CSS
│  ├─ cat/                  Cat behavior, PixiJS rendering, reminders
│  ├─ shared/               Shared types, settings, runtime, signals
│  └─ assets/
│     ├─ cat/               Current frame-based cat animation PNGs
│     ├─ effects/            Smoke explosion PNG frames
│     └─ sprites/cat/         Experimental segmented SVG parts and manifest
├─ scripts/                 Development runner and terminal tracking
├─ public/                  Tray icon and public assets
├─ docs/                    Product, architecture, art, deployment, and phase notes
├─ index.html               Vite renderer HTML entry
├─ package.json              Scripts, dependencies, and electron-builder config
├─ vite.config.ts           Renderer build configuration
├─ tsconfig.json            Renderer/shared/cat TypeScript configuration
├─ tsconfig.node.json       Main-process TypeScript configuration
└─ eslint.config.js         ESLint flat configuration
```

## 6. Asset system

### Current production path

The active renderer loads PNG animation frames from `src/assets/cat`. The active body animation pack is separate from the experimental SVG segmented-part set.

### Experimental segmented assets

The following reusable SVG parts exist under `src/assets/sprites/cat/parts`:

- body
- head
- tail
- left paw
- right paw
- open face
- closed face
- happy face

The manifest is at `src/assets/sprites/cat/meta/cat-sprite-manifest.json`. These parts support the longer-term goal of transform-based stretch, head tilt, tail movement, and facial expression changes, but they are not currently the primary loaded animation path.

### Intended art direction

Future final art should be:

- black pixel-art inspired
- strongly outlined in white
- compact and readable at approximately 64×64 display size
- consistent across idle, sleep, happy, angry, stretch, bounce, and developer states
- centered consistently between frames

The imported grey cat pack is currently a functional prototype asset, not the final identity.

## 7. Development workflow

Install dependencies:

```bash
npm install
```

Run the full development workflow:

```bash
npm run dev
```

Run renderer only:

```bash
npm run dev:renderer
```

Run main-process TypeScript watch:

```bash
npm run dev:main
```

Build production renderer and main process:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Package Windows installer or portable build:

```bash
npm run package:win
npm run package:win:portable
npm run package:win:installer
```

On the current Windows shell, `npm.cmd` may be required if PowerShell execution policy blocks `npm.ps1`.

## 8. Current validation status

At the time this document was created:

- production build succeeds
- renderer Vite build succeeds
- main-process TypeScript compilation succeeds
- lint does not currently pass
- no automated test suite is configured
- no Git repository metadata is present in the project directory

The lint failures are Node-global errors in `scripts/dev.mjs` and `scripts/track-terminal.mjs`, including `setTimeout`, `clearTimeout`, `fetch`, `console`, and `AbortController`. The ESLint configuration currently defines renderer-specific rules but does not define a Node environment/globals block for `.mjs` scripts.

## 9. Known technical risks and gaps

### Settings validation

`app-settings:set` accepts a partial settings object from the renderer and writes it through Electron Store. TypeScript types do not validate runtime IPC data. Add explicit runtime validation and reject unknown keys or non-boolean values before persistence.

### Testing

There are no unit tests for the state machine, command classifier, reminder scheduler, settings persistence, drag clamping, or motion controller. These are high-value, mostly deterministic areas suitable for tests.

### Packaging verification

The electron-builder configuration exists, but a packaged Windows build still needs real smoke testing for:

- asset paths
- tray icon loading
- startup behavior
- user-data/settings persistence
- restore window behavior
- multi-monitor positioning
- transparent-window behavior under DPI scaling

### Documentation drift

Some older planning documents describe Zustand, Pino, and directory structures that are not currently implemented. Treat the codebase and this document as the current source of truth; treat older plans as historical or future direction.

### Bundle size

The renderer's main production JavaScript chunk is approximately 537 KB minified. This is acceptable for the prototype but can be improved with PixiJS code splitting/manual chunks if startup time becomes important.

### Window and timer lifecycle

The app uses frequent intervals for roaming and drag tracking. Cleanup exists for the major paths, but future features should always unregister event listeners and clear timers when a window, renderer, or behavior is destroyed.

### Electron hardening still recommended

The current isolation settings are good. Before distribution, also consider:

- validating every IPC payload at runtime
- restricting navigation and unexpected new windows
- disabling or guarding production DevTools
- handling renderer crashes and reloads
- adding a Content Security Policy where compatible with the data restore window

## 10. Recommended extension points for AI features

AI should remain optional. The cat must remain useful and functional when no model, API key, network connection, or AI provider is available.

### Suggested AI architecture

Add a separate AI domain rather than putting model calls inside `CatRenderer`:

```text
src/ai/
├─ AiProvider.ts             Provider interface
├─ AiProviderRegistry.ts     Selectable provider implementations
├─ AiTypes.ts                Requests, responses, status, errors
├─ AiService.ts              Orchestration, cancellation, timeout, retry policy
├─ AiContextBuilder.ts       Safe context from signals and user actions
└─ AiEventAdapter.ts         Converts AI lifecycle events to cat events
```

Potential provider interface:

```ts
interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse>;
}
```

The core app should communicate with this service through typed events such as:

- `AI_REQUEST_STARTED`
- `AI_THINKING`
- `AI_COMPLETED`
- `AI_FAILED`
- `AI_CANCELLED`

The cat can map those events to future states such as thinking, typing, celebrating, confused, or worried. These states should be added to the state machine and animation controller, not hardcoded as direct renderer mutations.

### Good first AI features

1. **Explain the latest developer signal** — summarize a build/test failure or command result in a small optional panel.
2. **Explain an error** — accept pasted compiler output or a selected log excerpt and return a concise explanation.
3. **Suggest a next action** — turn a build/test/debug signal into one or two practical next steps.
4. **Cat mood reactions** — show thinking while waiting, happy on useful completion, and gentle concern on failure.
5. **Ask the cat** — a small conversation panel opened from the tray or hidden launcher.

### AI safety and UX requirements

- Never send terminal contents, source code, file paths, or logs without a clear user opt-in.
- Make the provider and network status visible.
- Provide an AI-off mode.
- Use request timeouts and cancellation.
- Avoid blocking the animation loop while waiting for AI.
- Never execute AI-generated shell commands automatically.
- Clearly distinguish suggestions from actions already performed.
- Redact secrets, tokens, passwords, and environment variables before sending context.
- Keep model/API errors from breaking the cat or its desktop controls.

### AI event-to-cat example

```text
terminal signal received
  → signal sanitizer/redactor
  → optional user-approved context builder
  → AI service request
  → CAT/AI thinking event
  → cat thinking animation and small indicator
  → response displayed in panel
  → AI completed event
  → happy/helpful/concerned reaction
```

## 11. Recommended next engineering sequence

### Foundation cleanup

1. Fix ESLint Node globals for the development scripts.
2. Add runtime validation for settings and IPC payloads.
3. Add tests for state transitions, command classification, reminder scheduling, and drag clamping.
4. Update the README's validation claims.
5. Add an explicit production/development environment policy for DevTools and navigation.

### Product polish

1. Improve drag/stretch visuals and spring tuning.
2. Finish the hidden reminder mini-panel and settings workflow.
3. Test roaming and transparent windows on multiple monitors and DPI scales.
4. Replace the temporary cat body art with a consistent custom set.
5. Add dedicated thinking, typing, happy, failure, and stretch visual states.

### AI phase

1. Add AI types and provider interface.
2. Add a disabled-by-default/mock provider for local development.
3. Add opt-in context collection and secret redaction.
4. Add a non-blocking AI panel.
5. Add AI lifecycle events to the cat event/state system.
6. Add one useful feature first: explain the latest build/test failure.
7. Add provider settings, error handling, usage limits, and privacy controls.

## 12. Product principles

- The cat is a desktop companion first and an AI interface second.
- AI must enhance the pet without becoming required for the pet to work.
- Interaction should feel playful, lightweight, and non-intrusive.
- The renderer should remain smooth while developer and AI work happens asynchronously.
- New behaviors should pass through typed state and event boundaries.
- Art, animation, effects, and AI reactions should be replaceable independently.
- Privacy must be explicit because developer data can contain sensitive source code and credentials.

## 13. Source-of-truth notes

Use this order when information conflicts:

1. Current TypeScript/JavaScript implementation
2. `package.json` scripts and dependencies
3. This project-context document
4. README
5. Older planning and phase documents

The project currently has a strong functional shell and a clear path toward richer behaviors. The most important architectural rule for future work is to keep AI, terminal context, and new reactions behind typed services/events so the desktop cat remains stable even when integrations fail.
