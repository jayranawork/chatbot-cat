import type { AiProvider } from "./AiProvider";
import { AiProviderUnavailableError, AiTimeoutError, type AiRequest, type AiResponse } from "./AiTypes";

const DEFAULT_TIMEOUT_MS = 15_000;

export class AiService {
  private readonly inFlight = new Map<string, AbortController>();

  constructor(
    private readonly provider: AiProvider,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async run(request: AiRequest): Promise<AiResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    this.inFlight.set(request.requestId, controller);

    try {
      if (!(await this.provider.isAvailable())) {
        throw new AiProviderUnavailableError(`Provider ${this.provider.id} is unavailable`);
      }

      return await this.provider.complete(request, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new AiTimeoutError(`Request ${request.requestId} timed out or was cancelled`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
      this.inFlight.delete(request.requestId);
    }
  }

  cancel(requestId: string) {
    this.inFlight.get(requestId)?.abort();
    this.inFlight.delete(requestId);
  }
}
