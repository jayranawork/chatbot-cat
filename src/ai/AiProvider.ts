import type { AiRequest, AiResponse } from "./AiTypes";

export interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse>;
}
