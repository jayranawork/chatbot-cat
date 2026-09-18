# Desktop Dev Cat — Claude Handoff and UI Specification

This document is a complete implementation handoff for working on the Desktop Dev Cat project. It describes the current product, the code architecture, the features that already exist, the local Ollama integration, the exact chat-panel styling and behavior, the files changed during the AI/chat phase, and rules for future changes.

## 1. Project overview

Desktop Dev Cat is a Windows-first Electron desktop companion. It displays an animated cat in a transparent frameless always-on-top window and provides developer reminders, terminal/build awareness, local AI chat, and desktop controls.

The project is not a normal browser app. It runs as an Electron application with:

- Electron main process for windows, tray, IPC, roaming, settings, and local Ollama access
- Preload bridge for safe renderer APIs
- React renderer for panels and controls
- PixiJS for cat rendering and frame animation
- TypeScript for all application code
- Vite for renderer builds
- Electron Store for persistent settings
- Ollama as an optional local LLM runtime

The application must continue working when Ollama is stopped, missing, slow, or unavailable.

## 2. Current technology and commands

### Stack

- Electron
- React 19
- TypeScript
- PixiJS 8
- Vite
- Electron Store
- Zod
- Vitest
- ESLint
- Prettier
- Electron Builder

### Development commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

Windows PowerShell may require `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.

### Current verification status

The project currently passes:

```text
npm run lint  — passes with zero errors
npm test      — 12 tests passing
npm run build — renderer and Electron main build pass
```

Vite still reports a non-blocking warning that the main renderer chunk is larger than 500 KB because PixiJS and its renderer modules are bundled together.

## 3. Current Ollama setup

The application connects to the local Ollama HTTP API:

```text
http://localhost:11434
```

The provider checks:

```text
GET /api/tags
```

Chat requests use:

```text
POST /api/chat
```

The current default model is:

```text
llama3.2:3b
```

The provider also supports an explicitly supplied model through the request type. Ollama is not bundled with the application; it is an external local dependency.

The current machine has previously exposed models such as:

- `llama3.2:3b`
- `Talwar:latest`

## 4. User-facing cat features

### Desktop window

- Transparent Electron window
- Frameless window
- Always-on-top behavior
- Fixed compact cat window by default: `360×360`
- Expanded panel workspace: `520×660`
- Show, hide, toggle, and reset position controls
- Restore button shown when the cat is hidden
- Window position clamping across the current display work area
- Multi-monitor-aware positioning through Electron `screen`

### Cat animation

Current frame animation folders:

- `idle`
- `walk`
- `run`
- `jump`
- `fall`
- `hurt`
- `dead`
- `slide`

Logical cat states currently include:

- `idle`
- `curious`
- `dragging`
- `walking`
- `stretching`
- `sleeping`
- `happy`
- `angry`

The current state machine rejects invalid existing-state transitions. AI-specific states such as `thinking`, `confused`, and `celebrating` are not currently added to the cat state machine.

### Motion and interaction

- Cursor awareness and look direction
- Randomized blink timing
- Idle bob and sway
- Sleeping motion
- Walking motion
- Dragging with stretch and squash interpolation
- Spring-like release motion
- Edge-contact motion response
- Edge smoke burst effect
- Click/tap detection
- Triple-tap happy reaction
- Eight-tap hidden launcher unlock
- Pointer capture and cursor changes for dragging

The drag mechanics are handled through existing renderer/main-process IPC. Future work should not bypass the main-process window movement system.

### Roaming

- Cat can walk horizontally between display edges
- Roaming direction reverses at boundaries
- Roaming state is exposed through IPC
- Pausing stops active roaming
- Tray and Controls actions can start/stop roaming

### Reminders

Reminder kinds currently include:

```text
stretch
coffee
focus
water
debug
build
git
lint
refactor
test
push
logs
break
panic
```

The reminder scheduler provides:

- Focus reminders
- Coffee reminders
- Random developer surprise reminders
- Custom reminders stored in localStorage
- Enabled/disabled custom reminders
- Reminder deletion
- Reminder test actions
- Reminder popup duration and timing
- Reminder categories and messages from `CatReminderContent.ts`

Reminder scheduling, content data, and timing must not be changed when making purely visual reminder changes.

### Reminder speech bubble visuals

The PixiJS reminder bubble now has:

- Light cream vertical gradient
- Soft manual drop shadow
- Shared category-color mapping
- Category-colored left accent stripe
- Filled category badge
- Small category-colored title dot icon
- Strong title/message hierarchy
- Softer muted message text
- Rounded tail tip
- Entrance animation from scale `0.9` and alpha `0` to full size/opacity
- Ease-out/back-like entrance curve
- Exit fade with slight upward drift
- Small idle vertical float based on the existing elapsed animation phase
- Existing above/below/beside placement logic preserved

The shared palette is in:

```text
src/cat/categoryColors.ts
```

Palette:

```text
stretch  #4caf7d
coffee   #b07b4f
focus    #4c8bf5
water    #3fb8c9
debug    #e05a5a
build    #f0b23c
git      #9a6bd6
lint     #f0b23c
refactor #9a6bd6
test     #4c8bf5
push     #9a6bd6
logs     #9a9aa8
break    #4caf7d
panic    #e05a5a
```

## 5. Control panel

The hidden launcher is unlocked by tapping the cat eight times quickly. The plus button opens the AI tab directly.

The panel currently contains three tabs:

- Reminders
- Controls
- AI

The panel expands the Electron window to a larger workspace while open and returns to the compact cat window when closed.

### Panel window behavior

Compact window:

```text
360×360
```

Panel window:

```text
520×660
```

The main process preserves the window center while changing size.

The panel header is draggable. Dragging the header moves the entire Electron window using the existing `window-drag:start` and `window-drag:end` IPC path.

The close button is excluded from header dragging.

### Reminders tab

The Reminders tab supports:

- Time selection
- Reminder category selection
- Custom reminder message
- Add Reminder
- Test Sparkles
- Test Steam
- Test Popup
- Enable/disable saved reminder
- Delete saved reminder
- Reminder list scrolling

The native category dropdown uses dark option styling so the text remains readable.

### Controls tab

The Controls tab contains:

#### Window

- Show
- Hide
- Reset

#### Behavior

- Pause cat behavior
- Focus mode
- Always on top

#### Movement

- Start edge walking
- Stop edge walking

#### Startup

- Launch at startup

#### Dev Signal

- Current status
- Source
- Message
- Command
- Command category
- Long-running status
- Duration
- Current working directory

#### Session

- Active session time
- Long-session nudge status

#### Build Info

- App version
- Electron version
- Chrome version
- Node version
- Platform
- Packaged/development status

The Controls tab has a hidden scrollbar but supports mouse wheel and trackpad scrolling.

## 6. AI chat feature

### Opening chat

1. Tap the cat eight times quickly.
2. Click the plus launcher beside the cat.
3. The AI tab opens automatically.

The plus launcher follows the cat’s actual Pixi root X/Y position. It is hidden while the panel is open so it cannot appear over the chat panel.

### Chat panel visual design

The chat panel uses a dark glass-style interface.

Primary visual characteristics:

- Deep navy/charcoal background
- Soft translucent borders
- Rounded cards
- Amber/gold action color
- Muted warm-white text
- Green connection dot
- Compact status line
- User messages aligned right
- Cat messages aligned left
- Internal message scrolling
- Input fixed at the bottom
- Hidden scrollbars

Important UI colors:

```text
Panel background:       #141923 / #0b0e14 gradient family
Primary text:           #f5f2eb
Secondary text:         rgba(245, 242, 235, 0.68)
Accent gold:            #f0b23c
Accent hover:           #f7d46b
Success green:          #4caf7d
Error red:              #e05a5a
User bubble:            rgba(240, 178, 60, 0.16)
Cat bubble:             rgba(255, 255, 255, 0.07)
Border:                 rgba(255, 255, 255, 0.1–0.14)
```

### AI header

The AI panel header contains:

- `Ask the Cat` title
- Description: `Chat privately with your local Ollama model.`
- Close button

### Compact Ollama status

The previous large Ollama card and Check button were removed.

The current status is a small inline row:

```text
● Local AI ready · llama3.2:3b
```

When unavailable:

```text
● Local AI unavailable
```

The dot is green when available and red when unavailable.

### Message bubbles

User messages:

- Right aligned
- Warm brown/gold translucent background
- Label `YOU`
- Compact rounded shape

Cat messages:

- Left aligned
- Soft dark gray card
- Label `CAT`
- Text uses normal readable light color
- Copy button in the message metadata row

Long assistant text wraps and remains selectable.

### Copy behavior

Every Cat response has a `Copy` button.

When clicked:

1. The response is copied using `navigator.clipboard.writeText`.
2. Button text changes to `Copied`.
3. It returns to `Copy` after approximately 1.4 seconds.

Assistant text also uses `user-select: text`, so the user can manually select and copy text using `Ctrl+C`.

The overall application body remains non-selectable to protect drag interactions; only assistant message paragraphs are explicitly selectable.

### Chat input

The composer is a multiline textarea:

- Placeholder: `Ask the cat...`
- Maximum length: 4000 characters
- Enter sends the message
- Shift+Enter inserts a new line
- Send button appears when idle
- Stop button appears while an AI request is running
- Native textarea scrollbar is hidden
- Textarea remains scrollable when content exceeds its maximum height

### Chat request flow

```text
User enters message
  → renderer validates non-empty input
  → renderer creates request ID
  → renderer appends user message locally
  → preload invokes ai:request
  → main validates payload using Zod
  → main builds system + history + user messages
  → AiService checks Ollama availability
  → OllamaProvider calls /api/chat
  → response returns through IPC
  → renderer appends Cat response
```

The system prompt currently tells the model:

```text
You are Desktop Dev Cat, a concise and kind local developer companion. Give practical answers in plain text. Never claim to have run commands or changed files.
```

### Cancellation

While a request is running:

- Send changes to Stop
- Stop calls `ai:cancel`
- AiService aborts the matching request controller
- Renderer exits the busy state and shows cancellation feedback

## 7. AI architecture

### AI files

```text
src/ai/AiTypes.ts
src/ai/AiProvider.ts
src/ai/OllamaProvider.ts
src/ai/AiService.ts
src/ai/redaction.ts
```

### `AiTypes.ts`

Contains:

- AI message roles
- AI messages
- AI requests
- AI chat request payload
- AI responses
- AI status
- `AiTimeoutError`
- `AiProviderUnavailableError`

### `AiProvider.ts`

Provider interface:

```ts
interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse>;
}
```

### `OllamaProvider.ts`

Responsibilities:

- Check Ollama availability using `/api/tags`
- Use a 1500 ms availability timeout
- Send non-streaming chat requests to `/api/chat`
- Return response text, provider ID, and duration
- Use `llama3.2:3b` by default

### `AiService.ts`

Responsibilities:

- Maintain in-flight requests by request ID
- Create an `AbortController` for every request
- Apply a default 15-second timeout
- Check provider availability before completion
- Convert aborted calls to `AiTimeoutError`
- Support explicit cancellation
- Clean up timers and request entries in `finally`

### Redaction

`src/ai/redaction.ts` redacts:

- API keys
- Tokens
- Secrets
- Passwords
- Key-value secret patterns
- URLs with embedded credentials
- `process.env` values/dumps
- Windows paths
- Unix paths

Paths are shortened to their last two segments. Example:

```text
C:\\Users\\HP\\project\\src\\main.ts
→ ...\\src\\main.ts
```

## 8. IPC API

The preload bridge exposes `window.desktopDevCat`.

Existing APIs include:

- `getAppSettings`
- `setAppSettings`
- `getRuntimeInfo`
- `getDevSignal`
- `showWindow`
- `hideWindow`
- `toggleWindow`
- `resetWindowPosition`
- `setWindowRoam`
- `getWindowRoamState`
- drag start/move/end
- settings and signal listeners
- `setPanelMode`

AI APIs:

```ts
window.desktopDevCat.ai.request(payload)
window.desktopDevCat.ai.cancel(requestId)
window.desktopDevCat.ai.status()
```

Current AI payload:

```ts
type AiChatRequestPayload = {
  requestId: string;
  kind: "chat";
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
};
```

AI IPC channels:

- `ai:request`
- `ai:cancel`
- `ai:status`

The settings payload is validated before Electron Store persistence. Unknown fields and non-boolean values are rejected.

## 9. Main-process window behavior

`src/main/main.ts` owns:

- Electron lifecycle
- Main window creation
- Restore window
- Tray lifecycle
- Settings persistence
- Always-on-top changes
- Drag position tracking
- Roaming timer
- Developer signal file watching
- AI service initialization
- AI IPC handlers
- Panel window resize mode

The panel resize behavior uses:

```text
DEFAULT_WINDOW_SIZE = 360×360
PANEL_WINDOW_SIZE   = 520×660
```

The current window center is preserved while changing size.

## 10. Important source files

```text
src/main/main.ts                 Electron lifecycle, window, tray, IPC, AI handlers
src/main/preload.ts              contextBridge API
src/main/appSettings.ts          Electron Store persistence
src/main/ipcValidation.ts        Zod schemas for settings and AI payloads
src/window/createMainWindow.ts   BrowserWindow construction

src/ai/AiTypes.ts                AI contracts and errors
src/ai/AiProvider.ts             Provider interface
src/ai/OllamaProvider.ts         Ollama HTTP implementation
src/ai/AiService.ts              timeout/cancel orchestration
src/ai/redaction.ts              outbound context redaction

src/cat/CatRenderer.tsx          Pixi scene plus React panel/chat UI
src/cat/CatOverlayRenderer.ts    Pixi reminder bubble and overlays
src/cat/CatMotionController.ts   idle/drag/release/edge motion
src/cat/CatStateMachine.ts       existing cat state transitions
src/cat/CatAnimationController.ts state-to-animation mapping
src/cat/CatAssetLoader.ts        PNG frame discovery/loading
src/cat/CatReminderScheduler.ts  reminder timing
src/cat/CatReminderContent.ts    reminder text and categories
src/cat/categoryColors.ts        shared reminder palette

src/renderer/styles.css          all panel, chat, control, and global styles
src/renderer/vite-env.d.ts       window.desktopDevCat TypeScript declaration
src/shared/constants.ts          window dimensions and app constants
src/shared/appSettings.ts        settings type/defaults

tests/redaction.test.ts          redaction tests
tests/CatStateMachine.test.ts    existing state transition tests
```

## 11. Rules for future changes

### Preserve existing behavior

Do not change these systems during a visual/UI task unless explicitly requested:

- Reminder scheduler
- Reminder content data
- Reminder timing
- Cat frame loading
- Drag movement mechanics
- Roaming mechanics
- Existing cat state transitions
- Edge burst behavior

### AI safety

- AI is optional.
- Never execute model output as a shell command.
- Never modify files automatically from model output.
- Keep AI calls outside the Pixi ticker.
- Validate every IPC payload at runtime.
- Keep request timeouts and cancellation.
- Do not send source code, paths, logs, or secrets without explicit future opt-in.
- Redact sensitive developer context before sending it to any provider.

### UI behavior

- Keep the panel draggable by its header.
- Do not reintroduce visible scrollbars unless explicitly requested.
- Keep scrolling available even when scrollbars are visually hidden.
- Keep assistant responses selectable/copyable.
- Keep Enter-to-send and Shift+Enter newline behavior.
- Keep the Ollama status compact and non-intrusive.
- Keep the cat visible and animated while the panel is open.

### Verification rule

After every feature or behavior change, run:

```bash
npm run lint
npm test
npm run build
```

Do not move to the next feature until all three pass.

## 12. Known limitations

- AI states `thinking`, `confused`, and `celebrating` are not yet part of the cat state machine.
- AI does not yet explain the latest developer signal automatically.
- AI chat history is in-memory only.
- AI streaming is not implemented.
- Model selection UI is not implemented.
- Ollama endpoint configuration UI is not implemented.
- The main production renderer bundle is larger than 500 KB.
- The current project has no full end-to-end UI automation suite.
- The controls panel is functional but still uses some basic native checkbox styling.
- The chat panel is intentionally a local panel inside the Electron window rather than a separate BrowserWindow.

## 13. Suggested next features

The next safe AI/product additions are:

1. Explain Last Signal using the most recent build/test/dev signal.
2. Add optional redacted signal context to chat.
3. Add AI model selection from installed Ollama models.
4. Add a compact AI settings section.
5. Add AI thinking/complete/error cat reactions.
6. Add unit tests for `AiService` timeout/cancellation.
7. Add tests for IPC validation.
8. Add a small mock provider for offline UI testing.
9. Add a user-controlled clear-chat action.
10. Add a copy-all conversation action.

## 14. Handoff summary

Desktop Dev Cat currently has a working desktop pet shell, animated cat, dragging, roaming, reminders, controls, developer signals, local Ollama chat, status display, cancellation, copyable responses, hidden scrollbars, draggable chat panel, and validated IPC boundaries.

The current AI chat can be opened by unlocking the hidden launcher, clicking the plus button beside the cat, and using the AI tab. Ollama runs locally through `localhost:11434`; AI failures should never prevent the cat, controls, reminders, or animation from working.
