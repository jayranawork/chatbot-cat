import Store from "electron-store";
import { app } from "electron";
import type { AiChatMessage } from "./AiTypes";

export type AiMemory = {
  userName: string | null;
  catName: string | null;
  conversationSummary: string | null;
  recentHistory: AiChatMessage[];
};

const defaultMemory: AiMemory = {
  userName: null,
  catName: "the cat",
  conversationSummary: null,
  recentHistory: [],
};

function resolveStoreDirectory() {
  return process.env.DESKTOP_DEV_CAT_USER_DATA_DIR ?? app.getPath("userData");
}

export function createMemoryStore() {
  return new Store<AiMemory>({ name: "ai-memory", cwd: resolveStoreDirectory(), defaults: defaultMemory });
}

export function readMemory(store: Store<AiMemory>): AiMemory {
  return {
    userName: store.get("userName"),
    catName: store.get("catName"),
    conversationSummary: store.get("conversationSummary"),
    recentHistory: store.get("recentHistory").slice(-6),
  };
}

export function clearMemory(store: Store<AiMemory>) {
  store.clear();
  store.set("catName", null);
  return readMemory(store);
}

export function setMemoryUserName(store: Store<AiMemory>, userName: string) {
  store.set("userName", userName);
  return readMemory(store);
}

export function appendRecentHistory(store: Store<AiMemory>, messages: AiChatMessage[]) {
  const nextHistory = [...readMemory(store).recentHistory, ...messages].slice(-6);
  store.set("recentHistory", nextHistory);
  return nextHistory;
}

export function setConversationSummary(store: Store<AiMemory>, summary: string) {
  store.set("conversationSummary", summary);
  return readMemory(store);
}
