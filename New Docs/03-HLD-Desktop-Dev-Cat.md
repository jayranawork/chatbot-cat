# High-Level Design (HLD)
## Desktop Dev Cat — AI Companion Expansion

**Related:** 02-PRD-Desktop-Dev-Cat.md, 04-TRD, 05-LLD

---

## 1. System Context

```text
┌─────────────────────────────────────────────────────────┐
│                     Electron Main Process                 │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  Window /  │  │  Tray /  │  │   AI Service Layer      │ │
│  │  Roaming / │  │  Startup │  │  (Provider Registry,     │ │
│  │  Drag IPC  │  │  Settings│  │   Redaction, Timeout)    │ │
│  └───────────┘  └──────────┘  └───────────┬────────────┘ │
│                                             │ HTTP (local)  │
└─────────────────────────────────────────────┼──────────────┘
                                               ▼
                                    ┌─────────────────────┐
                                    │  Local LLM Runtime   │
                                    │  (Ollama / llama.cpp) │
                                    └─────────────────────┘
                    ▲ IPC (contextBridge, validated)
                    │
┌───────────────────┴─────────────────────────────────────┐
│                     Renderer Process                      │
│  React shell → CatRenderer (PixiJS)                       │
│  ├─ CatStateMachine (adds thinking/confused/celebrating)   │
│  ├─ CatOverlayRenderer (extended bubble for AI text)        │
│  ├─ Control Panel (Reminders / Controls / AI tabs)          │
│  └─ Ask-the-Cat panel (non-modal chat UI)                   │
└────────────────────────────────────────────────────────────┘
```

## 2. Key Design Decisions

| Decision | Rationale |
|---|---|
| AI calls happen in main process, not renderer | Avoids CORS/security issues with `contextIsolation: true`; keeps renderer sandboxed |
| Provider abstraction (`AiProvider` interface) | Swap Ollama for llama.cpp/cloud later without touching cat logic |
| New states added to existing state machine, not bypassed | Keeps all cat behavior inside typed, tested transition system |
| Redaction happens before any signal leaves the sanitizer, not inside the provider | Single enforcement point; testable in isolation |
| All AI IPC channels distinct and allowlisted (`ai:request`, `ai:cancel`, `ai:status`) | Matches existing narrow IPC surface pattern already used for settings/signals |

## 3. Major Components (new/changed)

### 3.1 AI Domain (`src/ai/`) — new
- `AiProvider.ts` — interface
- `AiProviderRegistry.ts` — holds registered providers, exposes active one
- `OllamaProvider.ts` — concrete implementation
- `AiService.ts` — orchestration: timeout, cancellation, retry (single retry on transient network error only)
- `AiContextBuilder.ts` — builds redacted context from dev signals or chat history
- `AiEventAdapter.ts` — maps AI lifecycle to `CatEvents`
- `redaction.ts` — pure function, regex-based secret/path stripping

### 3.2 Cat Domain (changed)
- `CatTypes.ts` — add `thinking | confused | celebrating` to state union
- `CatStateMachine.ts` — add transitions to/from new states
- `CatAnimationController.ts` — map new states to existing frame sets
- `CatOverlayRenderer.ts` — extend bubble to support scrollable long text

### 3.3 UI Domain (changed)
- Control panel: add AI tab, connection status indicator
- Reminder card: restyle per UI spec (doc 06)
- New: Ask-the-Cat floating panel component

### 3.4 Main Process (changed)
- `main.ts` — register `ai:*` IPC handlers
- `preload.ts` — expose `window.desktopDevCat.ai.request/cancel/status`

## 4. Data Flow — "Explain Last Signal"

```text
User clicks "Explain" → renderer sends ai:request(signalId) via IPC
  → main process AiService.explainSignal(signalId)
    → AiContextBuilder builds redacted prompt from signal store
    → AiProviderRegistry.active.complete(prompt, signal)
    → on success: AI_COMPLETED event → renderer receives ai:status update
    → on failure/timeout: AI_FAILED event → renderer shows confused state + fallback text
  → renderer CatStateMachine transitions idle → thinking → celebrating/confused → idle
```

## 5. Deployment / Runtime Topology

- Single Electron app, unchanged packaging target (Windows installer/portable)
- Local LLM runtime (Ollama) is an **external dependency**, not bundled; app detects presence at runtime
- No new network egress beyond `localhost` unless user explicitly configures a remote/cloud provider in future phase

## 6. Non-Functional Concerns Addressed at HLD Level

- **Resilience:** AI subsystem isolated behind service layer; failures cannot propagate into window/tray/roaming code paths
- **Performance:** All AI I/O off the render tick; IPC async by design
- **Security:** No new `nodeIntegration`; all new IPC validated against schema before use
- **Privacy:** Redaction enforced as a mandatory step in the data flow, not optional per-call
