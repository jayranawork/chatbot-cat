# Product Requirements Document (PRD)
## Desktop Dev Cat — AI Companion + UI Refresh

**Version:** 0.2.0 (Draft)
**Related:** 01-BRD-Desktop-Dev-Cat.md

---

## 1. Overview

This phase adds a local-LLM-powered AI layer to the cat and refreshes the reminder card and control panel UI. AI remains fully optional; the pet must work identically with AI off.

## 2. Feature List

### 2.1 AI Provider Framework
- Provider interface (`AiProvider`) with `isAvailable()` and `complete()`
- `OllamaProvider` as default/first implementation
- Provider registry to allow future providers (LM Studio, llama.cpp server, cloud) without touching cat logic
- Settings: selected provider, selected model, enabled/disabled toggle, timeout value

**Acceptance criteria**
- With no provider running, app launches normally, AI menu shows "Unavailable," no errors thrown
- Switching provider in settings takes effect without app restart

### 2.2 Cat AI States
New logical states: `thinking`, `confused`, `celebrating`.

| State | Trigger | Animation (reuse existing) |
|---|---|---|
| thinking | AI_REQUEST_STARTED | idle frames, slower speed, subtle head-tilt motion |
| celebrating | AI_COMPLETED (success) | jump frames + sparkle overlay |
| confused | AI_FAILED / timeout | hurt frames, muted (no angry steam) |

**Acceptance criteria**
- State machine rejects invalid transitions (e.g., cannot go dragging → thinking directly)
- States auto-return to idle after response is shown or after timeout

### 2.3 "Explain Last Signal" Feature
- One-click action (tray + hidden panel) that takes the most recent dev signal (build/test/git failure)
- Redacts paths/secrets, sends to local model with fixed system prompt
- Displays response in extended speech bubble (scrollable)

**Acceptance criteria**
- No raw file paths or env values ever leave redaction step (unit tested)
- Response bubble supports at least 400 characters with internal scroll
- Feature works with zero prior AI setup beyond having Ollama running

### 2.4 "Ask the Cat" Panel
- Small floating chat input, opened via existing 8-tap unlock + new launcher button
- Non-modal — user can keep working while panel is open
- Maintains short local conversation history (in-memory, cleared on close by default)
- Cancel button aborts in-flight request

**Acceptance criteria**
- Opening/closing panel never pauses roaming, drag, or animation loop
- Cancel reliably aborts fetch (AbortController wired through IPC)

### 2.5 Control Panel Redesign
See UI spec doc (06) for detail. Summary:
- Convert flat stacked sections into tabbed layout (already partially tabbed: Reminders/Controls) — add third tab: **AI**
- Visual hierarchy: section headers get icon + label, consistent spacing, consistent card elevation
- Replace plain checkboxes with styled toggle switches
- Status indicator (dot + text) for AI provider connection state, live-updating

### 2.6 Reminder Card Redesign
- Card gets category color accent (already color-coded, formalize into design tokens)
- Add relative time ("in 12 min") alongside absolute time
- Add subtle enter/exit animation for card list
- Disable/Delete buttons restyled as icon buttons with confirm-on-delete for destructive action

## 3. Non-Functional Requirements

- No AI call may block UI thread or PixiJS render tick
- All new IPC channels validated (schema) before reaching main process handlers
- Every AI network call has an explicit timeout (default 15s, configurable)
- Feature must be disableable entirely from tray (single toggle)

## 4. Out of Scope
- Persisting AI chat history across app restarts (phase 2+)
- Multi-turn context beyond a single "Ask the Cat" session
- Streaming token-by-token responses (phase 2+, nice-to-have)

## 5. Open Questions
- Which default local model ships as the recommended pull target (llama3.2:3b vs phi3:mini)? — needs hardware testing on low-end target machines.
- Should redaction rules be user-editable, or fixed for v1? — recommend fixed for v1, editable later.
