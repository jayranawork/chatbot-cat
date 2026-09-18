import { describe, expect, it } from "vitest";
import { redact } from "../src/ai/redaction";

describe("redact", () => {
  it("redacts API keys", () => {
    expect(redact("API_KEY=sk-abc123")).toBe("[REDACTED]");
  });

  it("redacts tokens", () => {
    expect(redact("TOKEN: token-value")).toBe("[REDACTED]");
  });

  it("redacts passwords", () => {
    expect(redact("PASSWORD=hunter2")).toBe("[REDACTED]");
  });

  it("shortens Windows paths to the last two segments", () => {
    expect(redact("C:\\Users\\HP\\project\\src\\main.ts")).toContain("...\\src\\main.ts");
  });

  it("shortens Unix paths to the last two segments", () => {
    expect(redact("/home/jay/project/src/main.ts")).toContain(".../src/main.ts");
  });

  it("redacts URL credentials", () => {
    expect(redact("https://user:password@example.com/api")).toBe("https://[REDACTED]@example.com/api");
  });

  it("leaves plain text unchanged", () => {
    expect(redact("The build completed successfully.")).toBe("The build completed successfully.");
  });
});
