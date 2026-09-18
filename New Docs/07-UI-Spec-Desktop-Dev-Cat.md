# UI Spec — Control Panel & Reminder Card Restyle + New Features

**Related:** 02-PRD (2.5, 2.6), 06-Repo-Structure

---

## 1. Problems With Current UI (from screenshots)

- Flat stacked sections, no visual hierarchy beyond bold text
- Plain checkboxes (native browser style) clash with the rest of the dark theme
- No connection/status feedback anywhere (will matter a lot once AI ships)
- Reminder cards are plain text blocks; category shown only as a small pill, no color coding at the card level
- Panel appears to scroll as one long column — Reminders/Controls tabs exist but content still feels like one continuous list
- No empty states, no loading states — will be needed for AI responses

## 2. Design Tokens (new `src/ui/tokens.css`)

```css
:root {
  --ddc-bg-panel: #14141c;
  --ddc-bg-card: #1c1c26;
  --ddc-bg-card-hover: #23232f;
  --ddc-border: #2a2a38;
  --ddc-text-primary: #f2f2f5;
  --ddc-text-secondary: #9a9aa8;
  --ddc-accent: #f0b23c;       /* existing amber/gold buttons */
  --ddc-accent-hover: #ffc65c;
  --ddc-danger: #e05a5a;
  --ddc-success: #4caf7d;
  --ddc-info: #4c8bf5;

  /* category accent colors — map 1:1 to CatReminderContent categories */
  --cat-color-stretch: #4caf7d;
  --cat-color-coffee: #b07b4f;
  --cat-color-focus: #4c8bf5;
  --cat-color-water: #3fb8c9;
  --cat-color-debug: #e05a5a;
  --cat-color-build: #f0b23c;
  --cat-color-git: #9a6bd6;
  --cat-color-break: #4caf7d;
  --cat-color-panic: #e05a5a;

  --ddc-radius-sm: 6px;
  --ddc-radius-md: 10px;
  --ddc-radius-lg: 14px;
  --ddc-space-1: 4px;
  --ddc-space-2: 8px;
  --ddc-space-3: 12px;
  --ddc-space-4: 16px;
  --ddc-space-5: 24px;
}
```

## 3. Control Panel Redesign

### 3.1 Layout
- Keep the existing tab pattern, add third tab: **AI**
- Tab bar gets an active-tab underline instead of solid-fill button (lighter, more modern)
- Each tab's content area gets consistent padding (`--ddc-space-4`) and a max-height with internal scroll — panel border itself never grows unbounded

### 3.2 Toggle switches (replace native checkboxes)

```tsx
function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="ddc-toggle">
      <span className="ddc-toggle-label">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        className={`ddc-toggle-track ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="ddc-toggle-thumb" />
      </button>
    </label>
  );
}
```

```css
.ddc-toggle-track {
  width: 36px; height: 20px;
  border-radius: 999px;
  background: var(--ddc-border);
  position: relative;
  transition: background 0.15s ease;
  border: none;
}
.ddc-toggle-track.on { background: var(--ddc-accent); }
.ddc-toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}
.ddc-toggle-track.on .ddc-toggle-thumb { transform: translateX(16px); }
```

Applies to: Pause cat behavior, Focus mode, Always on top, Launch at startup, and new AI enabled toggle.

### 3.3 New AI Tab

```text
┌─────────────────────────────────────┐
│  AI                                    │
│  Optional local assistant for the cat. │
├─────────────────────────────────────┤
│  ● Connected — Ollama (llama3.2:3b)    │   ← StatusIndicator component
│                                         │
│  PROVIDER            [ Ollama      ▾ ] │
│  MODEL                [ llama3.2:3b ▾ ] │
│  TIMEOUT (sec)        [   15        ] │
│                                         │
│  [ Enable AI features        ●───○ ]   │
│                                         │
│  [ Test Connection ]                    │
└─────────────────────────────────────┘
```

`StatusIndicator` states:
- Connected → green dot, "Connected — {provider} ({model})"
- Checking → amber pulsing dot, "Checking connection…"
- Unavailable → red dot, "Unavailable — install/start Ollama"

```css
.ddc-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.ddc-status-dot.connected { background: var(--ddc-success); }
.ddc-status-dot.checking { background: var(--ddc-info); animation: pulse 1.2s infinite; }
.ddc-status-dot.unavailable { background: var(--ddc-danger); }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
```

## 4. Reminder Card Redesign

### 4.1 Structure

```text
┌──────────────────────────────────────┐
│ ▐  15:00 · in 12 min          [⏸] [🗑] │   ← ▐ = 4px color accent bar (category color)
│ ▐  Coffee reset                        │
│ ▐  "You've been in the zone a while.   │
│ ▐   Stand up, grab water."             │
└──────────────────────────────────────┘
```

### 4.2 Component sketch

```tsx
function ReminderCard({ reminder, onDisable, onDelete }: ReminderCardProps) {
  const accent = categoryColor(reminder.category);
  return (
    <div className="ddc-reminder-card" style={{ borderLeftColor: accent }}>
      <div className="ddc-reminder-card-header">
        <span className="ddc-reminder-time">
          {reminder.time} <span className="ddc-reminder-relative">· {relativeTime(reminder.time)}</span>
        </span>
        <div className="ddc-reminder-actions">
          <IconButton icon="pause" onClick={onDisable} aria-label="Disable reminder" />
          <IconButton icon="trash" onClick={onDelete} aria-label="Delete reminder" confirmOnClick />
        </div>
      </div>
      <div className="ddc-reminder-title" style={{ color: accent }}>{reminder.title}</div>
      <div className="ddc-reminder-message">{reminder.message}</div>
    </div>
  );
}
```

```css
.ddc-reminder-card {
  background: var(--ddc-bg-card);
  border-left: 4px solid transparent;
  border-radius: var(--ddc-radius-md);
  padding: var(--ddc-space-3) var(--ddc-space-4);
  margin-bottom: var(--ddc-space-2);
  transition: background 0.15s ease, transform 0.15s ease;
}
.ddc-reminder-card:hover { background: var(--ddc-bg-card-hover); }
```

### 4.3 List enter/exit animation
Wrap the reminder list in a simple CSS transition group (no new dependency needed — use `AnimatePresence`-style manual class toggling or a lightweight `react-transition-group` if acceptable):

```css
.ddc-reminder-enter { opacity: 0; transform: translateY(-4px); }
.ddc-reminder-enter-active { opacity: 1; transform: translateY(0); transition: all 0.18s ease; }
.ddc-reminder-exit { opacity: 1; }
.ddc-reminder-exit-active { opacity: 0; transform: translateY(-4px); transition: all 0.15s ease; }
```

### 4.4 Delete confirmation
`IconButton` with `confirmOnClick` shows an inline two-state confirm (click once → button becomes "Confirm?" for 3s → click again to delete, or auto-reverts). Avoids a separate modal for a small destructive action.

## 5. Ask-the-Cat Panel (new component, styling)

```text
┌─────────────────────────────────┐
│  Ask the Cat              [ x ] │
├─────────────────────────────────┤
│  You: why did my build fail?     │
│  Cat: Looks like a missing dep…  │
│                                   │
├─────────────────────────────────┤
│  [ type a message...        ] ➤  │
└─────────────────────────────────┘
```

- Floating, draggable-by-header, fixed max-height with internal scroll for message history
- "Cat" messages left-aligned with small paw icon; "You" messages right-aligned, accent background
- Input disabled + shows spinner dot in send button while `thinking`
- Cancel (stop icon) appears in place of send while a request is in flight, wired to `ai.cancel`

## 6. Empty / Loading States (new, previously missing)

| Context | Empty state | Loading state |
|---|---|---|
| Reminder list | "No reminders yet — add one below." | n/a |
| Ask the Cat | "Ask me about your last build, or anything else." | Three-dot typing indicator in cat's message bubble |
| AI tab status | n/a | "Checking connection…" (amber pulse, Section 3.3) |

## 7. Accessibility Notes

- All new toggle/icon buttons need `aria-label` and keyboard focus states (visible outline using `--ddc-accent` at 2px)
- Status dot color must always pair with text label (never color-only signal) — already reflected in Section 3.3 copy
