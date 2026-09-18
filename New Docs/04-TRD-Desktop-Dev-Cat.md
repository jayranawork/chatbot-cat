# Technical Requirements Document (TRD)
## Desktop Dev Cat — AI Companion Expansion

**Related:** 03-HLD-Desktop-Dev-Cat.md, 05-LLD-Desktop-Dev-Cat.md

---

## 1. Technology Choices

| Concern | Choice | Notes |
|---|---|---|
| Local LLM runtime | Ollama (default) | HTTP API on `localhost:11434`; OpenAI-compatible mode also available if needed |
| Alt runtime support | llama.cpp server / LM Studio | Both expose OpenAI-compatible `/v1/chat/completions`; supported via same provider interface |
| IPC validation | `zod` (new dependency) | Schema-validate every IPC payload before handler logic runs |
| State management (renderer) | Existing pattern (no Zustand per doc note — keep as-is) | Do not introduce new state library; extend existing event bus |
| Testing | Vitest | Already used per project scripts; add test files alongside pure modules |
| Redaction | Custom regex module, no new dependency | Keep dependency-light; encode rules as data-driven array of patterns |

## 2. Functional Requirements

### FR-1: Provider availability check
System shall check provider availability (`GET /api/tags` for Ollama) with a max 1.5s timeout before enabling any AI UI action.

### FR-2: Timeout and cancellation
Every `complete()` call shall accept an `AbortSignal`; default request timeout is 15000ms, configurable in settings (min 5000ms, max 60000ms).

### FR-3: Redaction
System shall run all outbound context (dev signals, user-typed messages are exempt) through `redact()` before it is included in any prompt. Redaction shall strip:
- Key-value pairs matching `(TOKEN|KEY|SECRET|PASSWORD|API_KEY)\s*[=:]\s*\S+`
- Absolute file paths beyond the last two path segments
- Environment variable blocks (`process.env` dumps)

### FR-4: IPC schema validation
Every payload received on `ai:request`, `ai:cancel`, `app-settings:set` shall be validated against a schema. Invalid payloads are rejected with a typed error, never silently coerced.

### FR-5: State machine extension
`CatStateMachine` shall support: `idle → thinking`, `thinking → celebrating`, `thinking → confused`, `celebrating → idle`, `confused → idle`. No other module may set cat state directly; all transitions go through the state machine.

### FR-6: Non-blocking AI calls
No `await` on an AI `complete()` call may occur inside the PixiJS ticker function or any function invoked synchronously by it.

## 3. Interface Specifications

### 3.1 Preload API additions

```ts
window.desktopDevCat.ai = {
  request: (payload: AiRequestPayload) => Promise<AiResponsePayload>;
  cancel: (requestId: string) => Promise<void>;
  status: () => Promise<AiStatus>;
  onStatusChange: (cb: (status: AiStatus) => void) => () => void;
};
```

### 3.2 Types

```ts
interface AiRequestPayload {
  requestId: string;
  kind: "explainSignal" | "chat";
  signalId?: string;          // required if kind === "explainSignal"
  message?: string;           // required if kind === "chat"
  history?: { role: "user" | "assistant"; content: string }[];
}

interface AiResponsePayload {
  requestId: string;
  text: string;
  providerId: string;
  durationMs: number;
}

interface AiStatus {
  providerId: string;
  available: boolean;
  model: string;
  lastError?: string;
}
```

## 4. Performance Requirements

- AI availability check must not delay app startup (run async after window shown)
- UI must show "thinking" state within 100ms of request dispatch (perceived responsiveness)
- Panel open/close animations must not drop below 50fps on reference hardware (mid-range laptop, integrated GPU)

## 5. Security Requirements

- `contextIsolation: true`, `nodeIntegration: false` maintained on all windows, including any new AI panel window/overlay
- No AI-generated text is ever executed as a shell command or file operation automatically
- Model/provider endpoint is restricted to `localhost`/configured local address by default; any remote endpoint requires explicit user opt-in setting with a visible warning

## 6. Testing Requirements

| Module | Test type | Priority |
|---|---|---|
| `CatStateMachine` (incl. new states) | Unit | High |
| `redaction.ts` | Unit (table-driven cases) | High |
| `devSignalClassifier` | Unit | High |
| `AiService` timeout/cancel logic | Unit (mocked provider) | High |
| IPC schema validators | Unit | Medium |
| Reminder scheduler | Unit | Medium |
| Drag clamping | Unit | Medium |

## 7. Tooling / Build Requirements

- Fix ESLint flat config: add Node env block for `scripts/*.mjs`
- Add `zod` to `package.json` dependencies
- No change to Vite/Electron build pipeline required beyond new source files being included by existing glob/tsconfig includes
