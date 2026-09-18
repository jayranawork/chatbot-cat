# Proposed Repository Structure
## Desktop Dev Cat — post AI-integration

```text
ai-companion/
├─ src/
│  ├─ main/
│  │  ├─ main.ts                     Electron lifecycle, windows, tray, IPC, roaming, drag, signal watch
│  │  ├─ preload.ts                  contextBridge API (adds .ai namespace)
│  │  ├─ appSettings.ts              Electron Store settings (adds aiProvider, aiModel, aiTimeoutMs)
│  │  ├─ appTray.ts                  Tray menu (adds AI on/off toggle)
│  │  └─ ipcValidation.ts            NEW — zod schemas for all IPC payloads
│  │
│  ├─ window/
│  │  └─ createMainWindow.ts         Main transparent cat window creation
│  │
│  ├─ renderer/
│  │  ├─ App.tsx                     Renderer root
│  │  ├─ main.tsx                    React bootstrap
│  │  └─ styles.css                  Global styles + design tokens (see UI spec)
│  │
│  ├─ cat/
│  │  ├─ CatRenderer.tsx             Main PixiJS scene (adds AI event wiring)
│  │  ├─ CatStateMachine.ts          Adds thinking/confused/celebrating transitions
│  │  ├─ CatAnimationController.ts   Adds new state → animation/speed mapping
│  │  ├─ CatAssetLoader.ts           Unchanged
│  │  ├─ CatMotionController.ts      Unchanged (thinking gets subtle head-tilt idle motion)
│  │  ├─ CatOverlayRenderer.ts       Extends bubble for scrollable AI text
│  │  ├─ CatPropController.ts        Unchanged
│  │  ├─ CatReminderScheduler.ts     Unchanged
│  │  ├─ CatReminderContent.ts       Unchanged
│  │  ├─ CatEvents.ts                Adds AI_REQUEST_STARTED/AI_COMPLETED/AI_FAILED/AI_CANCELLED
│  │  └─ CatTypes.ts                 Adds new states, AI event names
│  │
│  ├─ ai/                            NEW — AI domain, isolated from cat/render logic
│  │  ├─ AiProvider.ts               Provider interface
│  │  ├─ AiProviderRegistry.ts       Registers/selects active provider
│  │  ├─ OllamaProvider.ts           Default local provider implementation
│  │  ├─ AiService.ts                Timeout, cancel, orchestration
│  │  ├─ AiContextBuilder.ts         Builds prompts from signals/chat history
│  │  ├─ AiEventAdapter.ts           Maps AI lifecycle → CatEvents
│  │  ├─ redaction.ts                Pure redaction function + patterns
│  │  └─ AiTypes.ts                  Request/response/status/error types
│  │
│  ├─ ui/                            NEW (extracted from ad-hoc renderer JSX)
│  │  ├─ ControlPanel/
│  │  │  ├─ ControlPanel.tsx         Tabbed shell (Reminders / Controls / AI)
│  │  │  ├─ RemindersTab.tsx
│  │  │  ├─ ControlsTab.tsx
│  │  │  ├─ AiTab.tsx                NEW — provider/model/status settings
│  │  │  └─ StatusIndicator.tsx      NEW — connection dot + label, reusable
│  │  ├─ ReminderCard/
│  │  │  ├─ ReminderCard.tsx         Restyled card (color accent, relative time)
│  │  │  └─ ReminderCard.module.css
│  │  ├─ AskTheCat/
│  │  │  ├─ AskTheCatPanel.tsx       NEW — floating non-modal chat UI
│  │  │  └─ AskTheCatPanel.module.css
│  │  └─ tokens.css                  NEW — shared design tokens (colors, spacing, radii)
│  │
│  ├─ shared/
│  │  ├─ devSignalClassifier.ts      Unchanged
│  │  ├─ appSettingsTypes.ts         Adds AI settings fields
│  │  └─ runtimeTypes.ts             Unchanged
│  │
│  └─ assets/
│     ├─ cat/                        Current frame-based PNG animation (unchanged this phase)
│     ├─ effects/                    Smoke explosion frames (unchanged)
│     └─ sprites/cat/                Experimental segmented SVG parts (unchanged)
│
├─ scripts/
│  ├─ dev.mjs                        Fix: add Node globals for lint
│  └─ track-terminal.mjs             Fix: add Node globals for lint
│
├─ tests/                            NEW — Vitest test files
│  ├─ CatStateMachine.test.ts
│  ├─ devSignalClassifier.test.ts
│  ├─ redaction.test.ts
│  └─ AiService.test.ts
│
├─ docs/
│  ├─ 01-BRD-Desktop-Dev-Cat.md
│  ├─ 02-PRD-Desktop-Dev-Cat.md
│  ├─ 03-HLD-Desktop-Dev-Cat.md
│  ├─ 04-TRD-Desktop-Dev-Cat.md
│  ├─ 05-LLD-Desktop-Dev-Cat.md
│  ├─ 06-Repo-Structure-Desktop-Dev-Cat.md
│  └─ 07-UI-Spec-Desktop-Dev-Cat.md
│
├─ public/
├─ index.html
├─ package.json                      Adds: zod (dep), vitest config if not present
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
└─ eslint.config.js                  Fix: add Node env block for scripts/*.mjs
```

## Notes on the change

- New top-level `src/ai/` folder keeps AI fully separable — deleting the folder and its IPC handlers should be enough to fully strip AI from the build if ever needed.
- New `src/ui/` folder extracts what's currently likely inline JSX inside `CatRenderer.tsx`/renderer files into dedicated components — makes the control panel and card restyle (doc 07) tractable without touching cat logic.
- `tests/` sits at root rather than colocated, matching the doc's stated priority list (state machine, classifier, redaction, scheduler, drag clamping) as first four target files.
