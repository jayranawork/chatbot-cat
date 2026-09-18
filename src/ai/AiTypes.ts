export type AiMessageRole = "system" | "user" | "assistant";

export type AiMessage = {
  role: AiMessageRole;
  content: string;
};

export type AiRequest = {
  requestId: string;
  messages: AiMessage[];
  model?: string;
};

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatRequestPayload = {
  requestId: string;
  kind: "chat";
  message: string;
  history?: AiChatMessage[];
};

export type AiResponse = {
  text: string;
  providerId: string;
  durationMs: number;
};

export type AiStatus = {
  providerId: string;
  available: boolean;
  model: string;
  lastError?: string;
};

export class AiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiTimeoutError";
  }
}

export class AiProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderUnavailableError";
  }
}
