# Low-Level Design (LLD)
## Desktop Dev Cat — AI Companion Expansion

**Related:** 04-TRD-Desktop-Dev-Cat.md

---

## 1. `src/ai/AiTypes.ts`

```ts
export type AiRequestKind = "explainSignal" | "chat";

export interface AiRequest {
  requestId: string;
  kind: AiRequestKind;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
}

export interface AiResponse {
  text: string;
  providerId: string;
  durationMs: number;
}

export interface AiStatus {
  providerId: string;
  available: boolean;
  model: string;
  lastError?: string;
}

export class AiTimeoutError extends Error {}
export class AiProviderUnavailableError extends Error {}
```

## 2. `src/ai/AiProvider.ts`

```ts
import type { AiRequest, AiResponse } from "./AiTypes";

export interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse>;
}
```

## 3. `src/ai/OllamaProvider.ts`

```ts
import type { AiProvider } from "./AiProvider";
import type { AiRequest, AiResponse } from "./AiTypes";

const BASE_URL = "http://localhost:11434";

export class OllamaProvider implements AiProvider {
  readonly id = "ollama";
  readonly displayName = "Ollama (local)";

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse> {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model ?? "llama3.2:3b",
        messages: request.messages,
        stream: false,
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.message?.content ?? "",
      providerId: this.id,
      durationMs: Date.now() - start,
    };
  }
}
```

## 4. `src/ai/AiService.ts`

```ts
import type { AiProvider } from "./AiProvider";
import type { AiRequest, AiResponse } from "./AiTypes";
import { AiTimeoutError } from "./AiTypes";

const DEFAULT_TIMEOUT_MS = 15000;

export class AiService {
  private inFlight = new Map<string, AbortController>();

  constructor(private provider: AiProvider, private timeoutMs = DEFAULT_TIMEOUT_MS) {}

  async run(request: AiRequest): Promise<AiResponse> {
    const controller = new AbortController();
    this.inFlight.set(request.requestId, controller);

    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const available = await this.provider.isAvailable();
      if (!available) {
        throw new Error(`Provider ${this.provider.id} unavailable`);
      }
      return await this.provider.complete(request, controller.signal);
    } catch (err) {
      if (controller.signal.aborted) {
        throw new AiTimeoutError(`Request ${request.requestId} timed out`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
      this.inFlight.delete(request.requestId);
    }
  }

  cancel(requestId: string): void {
    this.inFlight.get(requestId)?.abort();
    this.inFlight.delete(requestId);
  }
}
```

## 5. `src/ai/redaction.ts`

```ts
const SECRET_PATTERN = /\b(TOKEN|KEY|SECRET|PASSWORD|API_KEY)\s*[=:]\s*\S+/gi;
const WINDOWS_PATH_PATTERN = /[A-Za-z]:\\(?:[^\\\/\n]+\\)*([^\\\/\n]+)/g;
const UNIX_PATH_PATTERN = /\/(?:[^\/\n]+\/)+([^\/\n]+)/g;

export function redact(input: string): string {
  return input
    .replace(SECRET_PATTERN, "[REDACTED]")
    .replace(WINDOWS_PATH_PATTERN, (_match, last) => `...\\${last}`)
    .replace(UNIX_PATH_PATTERN, (_match, last) => `.../${last}`);
}
```

**Test cases to cover (Vitest):**
```ts
redact("API_KEY=sk-abc123") === "[REDACTED]"
redact("C:\\Users\\jay\\project\\src\\main.ts") === "...\\main.ts"
redact("/home/jay/project/src/main.ts") === ".../main.ts"
redact("normal text with no secrets") === "normal text with no secrets"
```

## 6. `src/cat/CatTypes.ts` (diff)

```ts
export type CatState =
  | "idle"
  | "curious"
  | "dragging"
  | "walking"
  | "stretching"
  | "sleeping"
  | "happy"
  | "angry"
  | "thinking"      // new
  | "confused"      // new
  | "celebrating";  // new
```

## 7. `src/cat/CatStateMachine.ts` (diff — transition table addition)

```ts
const transitions: Record<CatState, CatState[]> = {
  // ...existing entries unchanged...
  idle: ["curious", "dragging", "walking", "sleeping", "happy", "angry", "thinking"],
  thinking: ["celebrating", "confused", "idle"],
  celebrating: ["idle"],
  confused: ["idle"],
};
```

## 8. `src/cat/CatAnimationController.ts` (diff)

```ts
const stateToAnimation: Record<CatState, AnimationKey> = {
  // ...existing entries unchanged...
  thinking: "idle",       // slower playback speed applied separately
  celebrating: "jump",
  confused: "hurt",
};

const stateToSpeed: Record<CatState, number> = {
  thinking: 0.6, // slowed down idle loop reads as "processing"
  // others default to 1.0
};
```

## 9. `src/main/main.ts` (new IPC handlers, sketch)

```ts
ipcMain.handle("ai:request", async (_event, rawPayload) => {
  const payload = validateAiRequest(rawPayload); // throws on bad shape
  return aiService.run(toAiRequest(payload));
});

ipcMain.handle("ai:cancel", async (_event, rawRequestId) => {
  const requestId = validateRequestId(rawRequestId);
  aiService.cancel(requestId);
});

ipcMain.handle("ai:status", async () => {
  return {
    providerId: activeProvider.id,
    available: await activeProvider.isAvailable(),
    model: currentModel,
  };
});
```

## 10. `src/main/preload.ts` (diff)

```ts
contextBridge.exposeInMainWorld("desktopDevCat", {
  // ...existing API...
  ai: {
    request: (payload: AiRequestPayload) => ipcRenderer.invoke("ai:request", payload),
    cancel: (requestId: string) => ipcRenderer.invoke("ai:cancel", requestId),
    status: () => ipcRenderer.invoke("ai:status"),
    onStatusChange: (cb: (status: AiStatus) => void) => {
      const listener = (_e: unknown, status: AiStatus) => cb(status);
      ipcRenderer.on("ai:status-changed", listener);
      return () => ipcRenderer.removeListener("ai:status-changed", listener);
    },
  },
});
```

## 11. Validation Schemas (zod, sketch)

```ts
import { z } from "zod";

export const aiRequestSchema = z.object({
  requestId: z.string().min(1),
  kind: z.enum(["explainSignal", "chat"]),
  signalId: z.string().optional(),
  message: z.string().max(4000).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(20).optional(),
});
```

## 12. Sequence — Ask the Cat (chat)

```text
Renderer: user submits message
  → validate locally (non-empty, <4000 chars)
  → window.desktopDevCat.ai.request({ requestId, kind: "chat", message, history })
  → CatEvents.emit(AI_REQUEST_STARTED) → state: thinking

Main: ipcMain.handle("ai:request")
  → zod validate
  → AiContextBuilder.buildChatPrompt(message, history)   // no redaction needed, user-authored
  → AiService.run(request)
  → resolve/reject to renderer

Renderer: on resolve
  → CatEvents.emit(AI_COMPLETED, { text }) → state: celebrating → idle
  → append to local chat history (in-memory)
Renderer: on reject (timeout/error)
  → CatEvents.emit(AI_FAILED, { error }) → state: confused → idle
  → show fallback bubble: "Couldn't reach the local model."
```
