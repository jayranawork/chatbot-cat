# Business Requirements Document (BRD)
## Desktop Dev Cat — AI Companion Expansion

**Version:** 0.2.0 (Draft)
**Owner:** Jay Rana
**Status:** Draft for review

---

## 1. Purpose

Desktop Dev Cat is an Electron-based always-on-top desktop companion for developers. This BRD defines the business case, goals, and success criteria for expanding it from a reactive animated pet into an AI-assisted developer companion powered by a **local LLM** (no cloud dependency required).

## 2. Background

The current product (v0.1.0) is a functional MVP: transparent floating window, sprite-based animation, procedural motion, reminders, and basic dev-activity signal detection. It has no AI capability today. Product docs already scope an AI domain (`src/ai/`) but it is unimplemented.

## 3. Business Objectives

| # | Objective | Success Metric |
|---|---|---|
| 1 | Differentiate from generic desktop pets | AI companion features not found in comparable apps (Bongo Cat, etc.) |
| 2 | Keep zero mandatory cost / cloud dependency | 100% of AI features work fully offline via local LLM |
| 3 | Increase daily engagement | Reminder + AI interactions used at least 1x/session |
| 4 | Maintain reliability of core pet experience | AI failures never crash or freeze animation/render loop |
| 5 | Build toward monetizable "pro" tier later | Architecture supports optional cloud provider without rework |

## 4. Target Users

- Solo developers who work long unattended coding sessions
- Developers who want ambient feedback (build/test/git signals) without opening a dashboard
- Users who like desktop pets / companion apps and want it to be "useful," not just decorative

## 5. Scope

### In scope (this phase)
- Local LLM integration (Ollama primary target)
- AI-driven cat states (thinking, confused, celebrating)
- "Explain last dev signal" feature
- "Ask the cat" conversational panel
- Redesigned control panel and reminder card UI
- Reliability hardening (IPC validation, timeouts, tests)

### Out of scope (this phase)
- Cloud LLM providers (OpenAI, Anthropic API, etc.) — architecture must allow it later, not build it now
- Voice input/output
- Multiple pets / multiplayer
- Mobile companion app
- Marketplace/store for skins

## 6. Constraints

- Must run on Windows desktop (primary target); no regression to existing Electron packaging
- Must degrade gracefully with zero AI provider installed
- Must not require the user to expose secrets, source code, or full file paths without explicit opt-in
- Must not introduce blocking calls on the PixiJS render loop

## 7. Assumptions

- Users installing AI features are willing to install Ollama (or equivalent local runtime) separately
- Small local models (1B–8B parameter range) are sufficient for the target use cases (explain error, short chat)
- Existing IPC/preload architecture is sound and only needs extension, not replacement

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Local LLM not installed/running | AI features silently unavailable | `isAvailable()` check + clear UI status, no crash |
| Model response slow on low-end hardware | Perceived app freeze | Async IPC, timeout + cancel, "thinking" state animation |
| Sensitive data leaked to model context | Privacy/trust damage | Mandatory redaction pass, opt-in context sharing |
| Scope creep into full IDE integration | Delayed delivery | Explicit out-of-scope list (Section 6) enforced per phase |

## 9. Stakeholders

- Product/Owner: Jay Rana
- End users: individual developers (self-installed desktop tool)

## 10. Success Criteria for This Phase

1. Local LLM answers "explain last signal" and general chat questions with the cat, offline, no crash.
2. Control panel and reminder card visually upgraded (see PRD/UI doc).
3. Lint passes cleanly, core logic modules have unit tests.
4. AI is fully optional — app functions identically to v0.1.0 with AI disabled/unavailable.
