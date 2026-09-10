# Design Document — Personal Dashboard

## Overview

The Personal Dashboard is a single-page web application that runs entirely in the browser with no backend. It provides a unified start-page experience with a live clock and greeting, a Pomodoro-style focus timer, a persistent to-do list, and saved quick-access links. All state is stored in `localStorage` using a simple JSON schema. The entire application ships as three files: `index.html`, `css/style.css`, and `js/app.js`.

The design philosophy is intentional simplicity: no frameworks, no build step, no module bundlers. Every design decision favors plain DOM APIs and CSS custom properties over abstractions that would require tooling.

---

## Architecture

The application follows a **component-per-concern** pattern inside a single JavaScript file. Each logical widget (Clock, Timer, TaskManager, LinkManager, ThemeToggle, Greeting) is an isolated function scope that owns its DOM queries, event listeners, and `localStorage` keys. There is no shared global state object — each component reads and writes its own dedicated `localStorage` key.

```
┌──────────────────────────────────────────────┐
│                   index.html                  │
│   (declares DOM structure, loads style.css   │
│    and app.js, defines all element IDs)       │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│                    app.js                     │
│                                               │
│  DOMContentLoaded                             │
│  ├─ initClock()        ← setInterval 1s      │
│  ├─ initGreeting()     ← localStorage        │
│  ├─ initTimer()        ← setInterval 1s      │
│  ├─ initTaskManager()  ← localStorage        │
│  ├─ initLinkManager()  ← localStorage        │
│  └─ initThemeToggle()  ← localStorage        │
│                                               │
│  (All functions are IIFEs or called once      │
│   inside DOMContentLoaded)                    │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│               localStorage                    │
│                                               │
│  dashboard_tasks    → JSON array of Tasks    │
│  dashboard_links    → JSON array of Links    │
│  dashboard_username → string                 │
│  dashboard_theme    → "light" | "dark"       │
└──────────────────────────────────────────────┘
```

**Rendering model**: All list-based widgets (tasks, links) use a `render()` function that wipes and redraws the list from the in-memory array on every mutation. This keeps state authoritative in JavaScript, not in the DOM.

---

## Components and Interfaces

### Clock (`initClock`)

Responsible for the time display (`#time-display`), date display (`#date-display`), and indirectly driving the greeting update.

- Calls `updateClock()` immediately on init and then via `setInterval(updateClock, 1000)`.
- Wraps `new Date()` in a try/catch; on failure, writes a static error string to both display elements.
- Exports nothing; interacts only via direct DOM writes.

### Greeting (`initGreeting`)

Responsible for `#greeting-text`, `#user-name`, and the inline name-edit interaction.

- Reads `dashboard_username` from `localStorage` on init; defaults to `"User"`.
- Clicking `#user-name` swaps the `<span>` for an `<input>` in-place; blur and Enter commit the value.
- Saves the trimmed name (or `"User"` if blank/whitespace-only) back to `localStorage`.
- The greeting text (`"Good Morning"` / `"Good Afternoon"` / `"Good Evening"`) is re-derived on every clock tick and written to `#greeting-text`.

### Focus Timer (`initTimer`)

Responsible for `#timer-display`, `#start-btn`, `#stop-btn`, `#reset-btn`.

- Internal state: `totalSeconds` (integer), `timerInterval` (interval ID or `null`).
- `start`: Guards against re-entry with `if (timerInterval !== null) return`.
- `stop`: Clears interval, sets `timerInterval = null`.
- `reset`: Stops any running interval, resets `totalSeconds = 1500`, re-renders display.
- On reaching 0: clears interval, renders `00:00`, shows a non-blocking inline notification element (not `alert()`).
- Start button gains `disabled` attribute while `timerInterval !== null`.

### Task Manager (`initTaskManager`)

Responsible for `#task-form`, `#task-input`, `#task-list`, and an inline `#task-error` element.

- Internal state: `tasks` array, loaded from `localStorage` (or `[]` on parse failure).
- `addTask(text)`: validates length ≤ 100 chars, non-empty after trim, and case-insensitive uniqueness before pushing.
- `toggleTask(id)`: flips `completed` boolean; re-renders.
- `editTask(id)`: replaces the task `<span>` with an `<input>`; commit on Enter/blur.
- `deleteTask(id)`: filters the array; re-renders.
- All mutations call `saveTasks()` → `localStorage.setItem(...)`.
- `renderTasks()`: full redraw of `#task-list` from the array.

### Link Manager (`initLinkManager`)

Responsible for `#link-form`, `#link-name`, `#link-url`, `#links-container`, and an inline `#link-error` element.

- Internal state: `quickLinks` array, loaded from `localStorage` (or `[]` on parse failure).
- `addLink(name, url)`: validates name ≤ 50 chars, URL ≤ 2048 chars, both non-empty, and total count < 20.
- Auto-prepends `https://` if URL doesn't begin with `http://` or `https://`.
- `deleteLink(id)`: filters and re-renders.
- `renderLinks()`: full redraw of `#links-container`.
- Each rendered anchor has `target="_blank" rel="noopener noreferrer"`.

### Theme Toggle (`initThemeToggle`)

Responsible for `#theme-toggle` button and the `dark-theme` class on `<body>`.

- Reads `dashboard_theme` from `localStorage` on init; applies `dark-theme` class if value is `"dark"`.
- Sets the button label to the name of the theme that will be applied on the **next** click:
  - Current: light → label shows `"🌙 Dark Mode"`
  - Current: dark → label shows `"☀️ Light Mode"`
- On toggle: flips class, updates label, writes new value to `localStorage`.

---

## Data Models

### Task

```js
{
  id: number,          // Date.now() at creation time — unique within a session
  text: string,        // 1–100 characters, trimmed
  completed: boolean   // default: false
}
```

`localStorage` key: `dashboard_tasks`  
Serialization: `JSON.stringify(tasks)` / `JSON.parse(raw) || []`

### Quick Link

```js
{
  id: number,    // Date.now() at creation time
  name: string,  // 1–50 characters, trimmed
  url: string    // 1–2048 characters; always begins with http:// or https://
}
```

`localStorage` key: `dashboard_links`  
Serialization: `JSON.stringify(quickLinks)` / `JSON.parse(raw) || []`

### User Name

Plain string stored under `dashboard_username`. Default: `"User"`. Max length enforced by input `maxlength="50"` attribute and JS trim + fallback logic.

### Theme

Plain string, one of `"light"` or `"dark"`, stored under `dashboard_theme`. Default: `"light"` (no class applied).

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` unavailable (private browsing in some browsers) | Wrap all `localStorage` calls in try/catch. App runs in-memory only; show a one-time banner: _"Storage unavailable — changes won't be saved."_ |
| Corrupt `localStorage` data (not valid JSON) | `JSON.parse` wrapped in try/catch; returns `null`. Component falls back to empty array / default string. |
| `new Date()` throws (extremely rare browser bug) | Clock displays static string: _"Time unavailable"_ in both `#time-display` and `#date-display`. |
| Task input empty or > 100 chars | Show inline error in `#task-error`; do not add task; keep input value. |
| Task duplicate (case-insensitive match) | Show inline error in `#task-error`; do not add task. |
| Link name empty or > 50 chars | Show inline error in `#link-error`; do not add link. |
| Link URL empty or > 2048 chars | Show inline error in `#link-error`; do not add link. |
| 20 Quick Links already saved | Show inline error in `#link-error`; do not add link. |
| Edit task confirmed with empty value | Discard change silently; restore original text. No error message. |
| Edit task confirmed with duplicate text | Discard change; restore original text; show inline error. |
| Timer Start clicked while already running | Guard `if (timerInterval !== null) return`; no visible error. |
| Timer Stop clicked while not running | Guard `if (!timerInterval) return`; no visible error. |
| Name input submitted as empty/whitespace | Store and display `"User"` silently. |

**Inline error pattern**: Each component that surfaces user errors has a dedicated `<p>` element (e.g., `<p id="task-error" role="alert" class="error-msg" hidden></p>`). The component sets `textContent` and removes the `hidden` attribute to show an error; any subsequent successful action re-hides it. The `role="alert"` attribute ensures screen readers announce the message.

---

## Testing Strategy

> **Why property-based testing does not apply here**: The dashboard has no test runner, no module system, and must execute via `file://` protocol with zero tooling. It is a UI-rendering application built from DOM manipulation, `localStorage` persistence, and timer callbacks — none of which are pure functions amenable to universal quantification across generated inputs. All verification is done manually in-browser and through targeted integration checks.

### Unit-Level Checks (Pure Logic Functions)

These are the only parts of the application that are pure and can be isolated:

| Function | Input | Expected Output |
|---|---|---|
| `getGreeting(hour)` | `0–11` | `"Good Morning"` |
| `getGreeting(hour)` | `12–17` | `"Good Afternoon"` |
| `getGreeting(hour)` | `18–23` | `"Good Evening"` |
| `formatTime(seconds)` | `1500` | `"25:00"` |
| `formatTime(seconds)` | `0` | `"00:00"` |
| `formatTime(seconds)` | `65` | `"01:05"` |
| `sanitizeName(raw)` | `""` | `"User"` |
| `sanitizeName(raw)` | `"   "` | `"User"` |
| `sanitizeName(raw)` | `"Nura"` | `"Nura"` |
| `normalizeUrl(raw)` | `"google.com"` | `"https://google.com"` |
| `normalizeUrl(raw)` | `"https://x.com"` | `"https://x.com"` |
| `normalizeUrl(raw)` | `"http://x.com"` | `"http://x.com"` |

These helpers should be extracted as named functions (not inlined in event listeners) so they can be called from a browser console or a simple test script.

### Integration / Manual Test Scenarios

**Clock & Greeting**
- [ ] Time display updates every second without page reload
- [ ] Date string includes full weekday name, month name, day, and four-digit year
- [ ] Greeting changes to "Good Morning" / "Good Afternoon" / "Good Evening" at correct hour boundaries
- [ ] Clicking name shows editable input pre-filled with current name
- [ ] Pressing Enter saves name to `localStorage` and restores span
- [ ] Submitting empty/whitespace name displays "User"

**Focus Timer**
- [ ] Display initializes at `25:00`
- [ ] Start begins countdown; display decrements each second
- [ ] Clicking Start again while running has no effect
- [ ] Stop pauses countdown; display retains current value
- [ ] Reset from running state restores `25:00` and stops countdown
- [ ] Countdown reaching `00:00` shows inline notification (not `alert()`)
- [ ] Start button is visually disabled while timer is running

**Task Manager**
- [ ] Tasks load from `localStorage` on page load
- [ ] Adding a valid task appends it to the list and persists it
- [ ] Adding an empty task shows inline error
- [ ] Adding a task > 100 chars shows inline error
- [ ] Adding a duplicate (case-insensitive) shows inline error
- [ ] Checkbox toggles `completed` state and strikethrough styling
- [ ] Delete removes task from list and `localStorage`
- [ ] Edit replaces text with inline input; Enter confirms; Blur confirms
- [ ] Confirming edit with empty value restores original text
- [ ] Confirming edit with duplicate text restores original text and shows error
- [ ] Corrupt `localStorage` data renders empty list

**Quick Links**
- [ ] Links load from `localStorage` on page load
- [ ] Adding a valid link appends it and persists it
- [ ] URL without `http(s)://` gets `https://` prepended
- [ ] Clicking a link opens it in a new tab
- [ ] Clicking delete removes link immediately, no confirmation
- [ ] Empty name or URL shows inline error
- [ ] Adding a 21st link shows inline error
- [ ] Corrupt `localStorage` data renders empty list

**Theme Toggle**
- [ ] Saved dark theme applies on load before any visible content renders
- [ ] Toggle switches visual scheme across all sections
- [ ] Button label always reflects the **next** theme to be applied
- [ ] Theme value persists to `localStorage` on toggle

**Responsive Layout**
- [ ] Above 650px: timer, tasks, links render in two-column grid
- [ ] At/below 650px: grid collapses to single column
- [ ] No horizontal scrollbar appears at any viewport width
- [ ] Interactive controls meet 44×44px minimum touch target size

**Cross-Browser**
- [ ] All features function in latest Chrome, Firefox, Edge, and Safari
- [ ] No `console.error` or unhandled exceptions in any tested browser
- [ ] App loads and functions correctly when opened via `file://` protocol

### Regression Check Procedure

Before any change is considered complete:
1. Open `index.html` directly via `file://` in Chrome
2. Run through the Integration scenarios for the affected component
3. Open DevTools → Console; confirm zero errors
4. Open DevTools → Application → Local Storage; confirm expected keys and values are written
5. Hard-reload (`Ctrl+Shift+R`) and confirm persisted state is restored correctly


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The four pure helper functions (`getGreeting`, `formatTime`, `sanitizeName`, `normalizeUrl`) and the core stateful invariants of the task list, quick-link list, and theme toggle are the right targets for property-based testing. UI rendering, timer side-effects, and CSS layout are covered by the manual integration checklist in the Testing Strategy section above.

---

### Property 1: Greeting covers every valid hour

*For any* integer hour in the range 0–23, `getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, or `"Good Evening"` — never an empty string, never an unrecognised value.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 2: Greeting hour-range boundaries are non-overlapping and exhaustive

*For any* integer hour `h` where 0 ≤ h ≤ 11, `getGreeting(h)` SHALL return `"Good Morning"`; *for any* `h` where 12 ≤ h ≤ 17 it SHALL return `"Good Afternoon"`; *for any* `h` where 18 ≤ h ≤ 23 it SHALL return `"Good Evening"`. No hour maps to more than one salutation.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 3: formatTime output always matches MM:SS pattern

*For any* integer `seconds` in the range 0–1500, `formatTime(seconds)` SHALL return a string that matches the regular expression `^\d{2}:\d{2}$`, where the minutes part equals `Math.floor(seconds / 60)` zero-padded to two digits and the seconds part equals `seconds % 60` zero-padded to two digits.

**Validates: Requirements 3.2**

---

### Property 4: formatTime round-trip — parsing back gives the original value

*For any* integer `seconds` in 0–1500, splitting the output of `formatTime(seconds)` on `":"`, converting each part to an integer, and computing `minutes * 60 + secs` SHALL equal the original `seconds` value.

**Validates: Requirements 3.2**

---

### Property 5: sanitizeName returns "User" for any blank input

*For any* string composed entirely of whitespace characters (including the empty string `""`), `sanitizeName(raw)` SHALL return `"User"`.

**Validates: Requirements 2.7, 2.9, 7.7**

---

### Property 6: sanitizeName preserves non-blank names unchanged (up to trimming)

*For any* string `raw` that contains at least one non-whitespace character and whose trimmed length is ≤ 50, `sanitizeName(raw)` SHALL return `raw.trim()` and SHALL NOT return `"User"`.

**Validates: Requirements 2.4, 2.6**

---

### Property 7: normalizeUrl always produces a URL beginning with http:// or https://

*For any* non-empty string `raw`, `normalizeUrl(raw)` SHALL return a string that begins with either `"http://"` or `"https://"`.

**Validates: Requirements 5.3**

---

### Property 8: normalizeUrl is idempotent for already-valid URLs

*For any* string `raw` that already begins with `"http://"` or `"https://"`, `normalizeUrl(raw)` SHALL return `raw` unchanged (no double-prepending).

**Validates: Requirements 5.3**

---

### Property 9: Adding a valid task grows the task list by exactly one

*For any* task list and *for any* task text that is non-empty after trimming, is ≤ 100 characters, and does not match (case-insensitively) any existing task's text, calling `addTask(text)` SHALL increase the task list length by exactly 1, and the new task SHALL appear as the last element with `completed: false`.

**Validates: Requirements 4.2**

---

### Property 10: Invalid task input leaves the task list unchanged

*For any* task list, attempting to add a string that is empty, whitespace-only, or longer than 100 characters SHALL leave the task list at the same length with the same contents.

**Validates: Requirements 4.3**

---

### Property 11: Duplicate task (case-insensitive) leaves the task list unchanged

*For any* task list containing at least one task, attempting to add any string that matches an existing task's text under case-insensitive comparison SHALL leave the task list at the same length with the same contents.

**Validates: Requirements 4.4**

---

### Property 12: Task completion toggle is an involution (round-trip)

*For any* task, toggling its `completed` state twice SHALL return the task to its original `completed` value. The task's `id` and `text` SHALL remain unchanged by the toggle operation.

**Validates: Requirements 4.5**

---

### Property 13: Deleting a task removes it and only it

*For any* task list of length n ≥ 1 and *for any* task `t` in that list, calling `deleteTask(t.id)` SHALL produce a list of length n − 1 that does not contain `t` and contains all other tasks in their original order.

**Validates: Requirements 4.7**

---

### Property 14: Edit confirmed with duplicate text leaves the task list unchanged

*For any* task list containing tasks A and B (A ≠ B), attempting to edit task A's text to equal task B's text (case-insensitively) SHALL leave task A's text at its original value and the list length unchanged.

**Validates: Requirements 4.11**

---

### Property 15: Task list mutation persists and round-trips through localStorage

*For any* task list state after any mutation (add, toggle, edit, delete), serialising the list to `localStorage` and immediately deserialising it SHALL produce an array that is deeply equal to the in-memory array (same length, same ids, same text, same completed values, same order).

**Validates: Requirements 4.12, 7.1, 7.5**

---

### Property 16: Adding a valid quick-link grows the link list by exactly one

*For any* quick-link list of length n < 20, *for any* name of 1–50 characters and URL of 1–2048 characters, calling `addLink(name, url)` SHALL increase the link list length to n + 1, and the new entry SHALL be the last element with the normalised URL.

**Validates: Requirements 5.2**

---

### Property 17: Quick-link count cap prevents exceeding 20 entries

*For any* quick-link list already containing exactly 20 entries, attempting to add another link SHALL leave the list at length 20 with contents unchanged.

**Validates: Requirements 5.8**

---

### Property 18: Empty name or URL leaves the link list unchanged

*For any* quick-link list, submitting a link form with an empty name or an empty URL SHALL leave the list at the same length with the same contents.

**Validates: Requirements 5.7**

---

### Property 19: Deleting a quick-link removes it and only it

*For any* quick-link list of length n ≥ 1 and *for any* link `L` in that list, calling `deleteLink(L.id)` SHALL produce a list of length n − 1 that does not contain `L` and contains all other links in their original order.

**Validates: Requirements 5.5**

---

### Property 20: Quick-link list mutation persists and round-trips through localStorage

*For any* quick-link list state after any mutation (add, delete), serialising to `localStorage` and immediately deserialising SHALL produce an array deeply equal to the in-memory array.

**Validates: Requirements 5.6, 7.2, 7.6**

---

### Property 21: Theme toggle is an involution (round-trip)

*For any* current theme value (`"light"` or `"dark"`), toggling the theme twice SHALL return the theme to its original value and the toggle button label SHALL reflect the correct next-theme name.

**Validates: Requirements 6.3, 6.4**

---

### Property 22: Theme value is always one of the two valid states

*For any* sequence of toggle operations starting from a valid initial theme, the theme value in `localStorage` SHALL always be exactly `"light"` or `"dark"` — never `null`, `undefined`, or any other string.

**Validates: Requirements 6.1, 6.2, 6.5**
