import type { ReminderKind } from "./CatTypes";

export const categoryColor: Record<ReminderKind, number> = {
  stretch: 0x4caf7d,
  coffee: 0xb07b4f,
  focus: 0x4c8bf5,
  water: 0x3fb8c9,
  debug: 0xe05a5a,
  build: 0xf0b23c,
  git: 0x9a6bd6,
  lint: 0xf0b23c,
  refactor: 0x9a6bd6,
  test: 0x4c8bf5,
  push: 0x9a6bd6,
  logs: 0x9a9aa8,
  break: 0x4caf7d,
  panic: 0xe05a5a,
};
