import { describe, expect, it } from "vitest";
import { CatStateMachine } from "../src/cat/CatStateMachine";

describe("CatStateMachine", () => {
  it("starts idle", () => {
    expect(new CatStateMachine().getState()).toBe("idle");
  });

  it("allows the existing idle transitions", () => {
    const targets = ["curious", "dragging", "walking", "sleeping", "happy", "angry"] as const;

    for (const target of targets) {
      const machine = new CatStateMachine();
      expect(machine.transition(target)).toBe(true);
      expect(machine.getState()).toBe(target);
    }
  });

  it("allows existing movement and reaction transitions", () => {
    const cases = [
      ["idle", "dragging", "stretching"],
      ["idle", "dragging"],
      ["idle", "walking", "curious"],
      ["idle", "walking", "dragging"],
      ["idle", "walking", "sleeping"],
      ["idle", "walking"],
      ["idle", "dragging", "stretching", "walking"],
      ["idle", "dragging", "stretching", "idle"],
      ["idle", "sleeping", "idle"],
      ["idle", "happy", "idle"],
      ["idle", "angry", "idle"],
    ] as const;

    for (const path of cases) {
      const machine = new CatStateMachine();
      for (const state of path.slice(1)) {
        expect(machine.transition(state)).toBe(true);
      }
      expect(machine.getState()).toBe(path[path.length - 1]);
    }
  });

  it("rejects invalid existing-state transitions", () => {
    const machine = new CatStateMachine();

    expect(machine.transition("stretching")).toBe(false);
    expect(machine.getState()).toBe("idle");

    expect(machine.transition("happy")).toBe(true);
    expect(machine.transition("angry")).toBe(false);
    expect(machine.getState()).toBe("happy");
  });

  it("accepts a no-op transition", () => {
    const machine = new CatStateMachine();
    expect(machine.transition("idle")).toBe(true);
    expect(machine.getState()).toBe("idle");
  });
});
