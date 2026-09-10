# Implementation Plan: Personal Dashboard

## Overview

Complete and refactor the existing `index.html` / `css/style.css` / `js/app.js` codebase so that every requirement and correctness property in the spec is fully satisfied. The HTML and CSS are partially scaffolded; `app.js` has a working skeleton but contains structural bugs (code outside `DOMContentLoaded`, a duplicate event listener that crashes, wrong element ID references) and is missing all validation logic, pure helper functions, inline error handling, and the task Edit feature.

All code is plain HTML, CSS, and Vanilla JavaScript — no frameworks, build tools, or package managers.

---

## Tasks

- [x] 1. Fix `index.html` — complete element IDs, ARIA attributes, and input constraints
  - [x] 1.1 Add missing inline error elements and fix existing markup issues
    - Fix typo `clas=` → `class=` on `#user-name`; ensure `class="editable-name"` and `title="Click to change name"` are set
    - Add `<p id="task-error" role="alert" class="error-msg" hidden></p>` immediately after `#task-list` inside `.tasks-card`
    - Add `<p id="link-error" role="alert" class="error-msg" hidden></p>` immediately after `#links-container` inside `.links-card`
    - Add `<p id="timer-notification" class="timer-notification" hidden></p>` immediately after `.timer-controls` inside `.timer-card`
    - Add `maxlength="100"` to `#task-input`
    - Add `maxlength="50"` to `#link-name` and `maxlength="2048"` to `#link-url`
    - _Requirements: 2.5, 3.7, 4.3, 5.7, 9.3_

- [x] 2. Fix `css/style.css` — add missing rules and repair broken values
  - [x] 2.1 Add missing component styles and repair CSS variable errors
    - Fix broken value `--text-muted: #aaa-aaa` → `--text-muted: #aaaaaa` in `body.dark-theme`
    - Add `.error-msg` rule: `color: #e53e3e; font-size: 0.85rem; margin-top: 6px; display: block;`
    - Add `.btn-primary:disabled` rule: `opacity: 0.5; cursor: not-allowed;`
    - Add `.timer-notification` rule: `text-align: center; color: #5c6ac4; font-size: 0.95rem; margin-top: 10px; font-weight: 500;`
    - Ensure `.card`, `body`, `.card h3`, `.header-card h2`, `.header-card p`, `.task-item`, and `.input-group input` use `var(--card-bg)`, `var(--text-color)`, `var(--text-muted)`, and `var(--border-color)` respectively so dark mode applies to all visible content
    - Add `min-height: 44px` and `min-width: 44px` to `.btn` to meet the 44×44 px touch-target requirement
    - Add `overflow-x: hidden` to `body` to prevent horizontal scrollbars at any viewport width
    - Confirm `@media (max-width: 650px)` collapses grid to `grid-template-columns: 1fr`
    - _Requirements: 6.6, 8.1, 8.2, 8.3, 8.4, 9.1_

- [x] 3. Rewrite `js/app.js` — fix structural bugs and implement pure helper functions
  - [x] 3.1 Fix the module structure: move all code inside a single `DOMContentLoaded` listener
    - Remove the theme toggle block (`themeToggleBtn`, `currentTheme`, and its event listener) that currently runs outside `DOMContentLoaded` — this causes a race condition and `null` reference errors before the DOM is ready
    - Remove the duplicate `taskForm.addEventListener('submit', ...)` block outside `DOMContentLoaded` — it crashes because `taskForm` is `undefined` in that scope
    - Remove the custom-name block (`userNameSpan`, `savedName`, and its event listener) that currently runs outside `DOMContentLoaded`
    - Create a single `document.addEventListener('DOMContentLoaded', () => { ... })` wrapper; call `initThemeToggle()` first (so theme is applied before other content renders), then `initClock()`, `initGreeting()`, `initTimer()`, `initTaskManager()`, `initLinkManager()` in sequence
    - _Requirements: 6.1, 7.4, 9.1, 9.5_

  - [x] 3.2 Implement the four pure helper functions at the top of `app.js`
    - `getGreeting(hour)`: returns `"Good Morning"` for hours 0–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–23
    - `formatTime(totalSeconds)`: returns zero-padded `"MM:SS"` string; `Math.floor(totalSeconds / 60)` padded to 2 digits + `totalSeconds % 60` padded to 2 digits
    - `sanitizeName(raw)`: trims input; returns `"User"` if blank/whitespace-only, otherwise returns `raw.trim()`
    - `normalizeUrl(raw)`: if `raw` does not start with `"http://"` or `"https://"`, prepend `"https://"`; otherwise return unchanged
    - Place all four as named `function` declarations (not `const` arrow functions) at the very top of the file so they are hoisted
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 3.2, 5.3_

  - [x]* 3.3 Write property tests for `getGreeting` (Properties 1 and 2)
    - **Property 1: Greeting covers every valid hour** — loop hours 0–23; assert result is one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`
    - **Property 2: Greeting boundaries are non-overlapping and exhaustive** — assert exact string for each hour 0–11 → Morning, 12–17 → Afternoon, 18–23 → Evening
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Implement inside a `runTests()` function appended at the bottom of `app.js`; call it only when `location.search` includes `?test`; log `PASS`/`FAIL` to `console`

  - [x]* 3.4 Write property tests for `formatTime` (Properties 3 and 4)
    - **Property 3: formatTime output always matches MM:SS pattern** — test a representative sample: 0, 1, 59, 60, 65, 1499, 1500; assert each matches `/^\d{2}:\d{2}$/`
    - **Property 4: formatTime round-trip** — for the same inputs, split on `":"`, compute `m*60+s`, assert equals original value
    - **Validates: Requirements 3.2**

  - [x]* 3.5 Write property tests for `sanitizeName` (Properties 5 and 6)
    - **Property 5: sanitizeName returns "User" for any blank input** — test `""`, `"   "`, `"\t"`, `"\n"`
    - **Property 6: sanitizeName preserves non-blank names unchanged up to trimming** — test `"Nura"`, `"  Nura  "`, a 50-character string
    - **Validates: Requirements 2.7, 2.9, 7.7**

  - [x]* 3.6 Write property tests for `normalizeUrl` (Properties 7 and 8)
    - **Property 7: normalizeUrl always produces an http:// or https:// prefix** — test `"google.com"`, `"ftp://x.com"`, `"//x.com"`, `""`
    - **Property 8: normalizeUrl is idempotent for already-valid URLs** — test `"https://x.com"` and `"http://x.com"` remain unchanged after one call
    - **Validates: Requirements 5.3**

- [x] 4. Implement `initClock()` and fix the greeting text element reference
  - [x] 4.1 Rewrite `initClock()` with correct element IDs and error handling
    - Query `#time-display` and `#date-display` once; store as constants
    - Define `updateClock()`: wrap `new Date()` in a `try/catch`; on failure write `"Time unavailable"` to both elements and return
    - Format time with `{ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }` → `#time-display`
    - Format date with `{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }` → `#date-display`
    - After writing date/time, call `updateGreetingText(now.getHours())` (defined in `initGreeting`)
    - Call `updateClock()` immediately on init; then schedule `setInterval(updateClock, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Implement `initGreeting()` — fix the wrong element ID and add name-edit logic
    - Fix the current code that writes to `#greeting-display` (non-existent) → write to `#greeting-text` using `getGreeting(hour)`
    - Define `updateGreetingText(hour)` that sets `#greeting-text.textContent = getGreeting(hour)`; this function will be called by `initClock` on every tick
    - On init, read `dashboard_username` from `localStorage` (wrapped in `try/catch`; default `"User"`); write to `#user-name`
    - Attach `click` listener to `#user-name` span that: creates `<input type="text" class="name-input-inline" maxlength="50">` pre-filled with current name; replaces the span with the input; calls `input.focus()` and `input.select()`
    - Define `commitName(input, flag)`: guard double-commit with a `committed` flag; apply `sanitizeName(input.value)`; write result to `localStorage` key `dashboard_username` in `try/catch`; on storage failure insert a temporary `<span class="error-msg">` after `#greeting-container`; replace `<input>` with a new `<span id="user-name" class="editable-name">` containing the saved name; re-attach the click listener
    - Attach `keydown` (Enter key) and `blur` event listeners on the inline input to call `commitName`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.3, 7.7_

- [x] 5. Checkpoint — Clock and Greeting
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` via `file://`; verify: time updates every second, date string contains full weekday/month/day/year, greeting changes at the correct hour boundaries, clicking the name shows the inline input pre-filled with the current name, Enter/blur saves it, submitting blank falls back to "User".

- [x] 6. Rewrite `initTimer()` — replace `alert()` with inline notification and fix disabled state
  - [x] 6.1 Implement the Focus Timer with inline notification and Start button disabled state
    - Query `#timer-display`, `#start-btn`, `#stop-btn`, `#reset-btn`, `#timer-notification` once
    - Internal state: `let totalSeconds = 1500; let timerInterval = null`
    - `renderTimer()`: write `formatTime(totalSeconds)` to `#timer-display`
    - `setTimerRunning(running)`: set `startBtn.disabled = running` (uses the `.btn-primary:disabled` CSS added in Task 2.1)
    - Start click: guard `if (timerInterval !== null) return`; hide `#timer-notification`; call `setTimerRunning(true)`; start `setInterval` decrementing `totalSeconds` and calling `renderTimer()`; when `totalSeconds === 0`, clear interval, set `timerInterval = null`, call `setTimerRunning(false)`, set `timerNotification.textContent = "Focus session complete! Take a break."`, remove `hidden` attribute from `#timer-notification`
    - Stop click: guard `if (!timerInterval) return`; `clearInterval`; `timerInterval = null`; `setTimerRunning(false)`
    - Reset click: `clearInterval`; `timerInterval = null`; `totalSeconds = 1500`; `renderTimer()`; `setTimerRunning(false)`; add `hidden` back to `#timer-notification`
    - Call `renderTimer()` on init
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x]* 6.2 Write unit tests for `formatTime` edge cases (Properties 3 and 4 — covered by Task 3.4)
    - Assert `formatTime(0) === "00:00"`, `formatTime(1500) === "25:00"`, `formatTime(65) === "01:05"`, `formatTime(59) === "00:59"`, `formatTime(60) === "01:00"`
    - _Requirements: 3.2_

- [x] 7. Rewrite `initTaskManager()` — add validation, inline errors, and the Edit feature
  - [x] 7.1 Implement task state, persistence, and rendering with Edit button
    - Query `#task-form`, `#task-input`, `#task-list`, `#task-error` once
    - Load tasks: wrap `JSON.parse(localStorage.getItem('dashboard_tasks'))` in `try/catch`; default to `[]` (remove the hardcoded seed data `[{ id:1, text:'belanja'... }]`)
    - `saveTasks()`: `localStorage.setItem('dashboard_tasks', JSON.stringify(tasks))`
    - `showTaskError(msg)` / `hideTaskError()`: set `#task-error.textContent` and toggle the `hidden` attribute
    - `renderTasks()`: wipe `#task-list.innerHTML`; for each task create a `<li class="task-item">` with: a `<div class="task-content">` containing a checkbox and `<span>`; add `class="completed"` to the div when `task.completed === true`; add an Edit button (`btn btn-secondary`) and a Delete button (`btn btn-danger`) after the content div
    - Wire `task-form` submit to `addTask(taskInput.value)`; call `e.preventDefault()`; this replaces the existing submit listener
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.12, 7.1, 7.5_

  - [x] 7.2 Implement `addTask`, `toggleTask`, and `deleteTask` with full validation
    - `addTask(raw)`: trim the input; if empty, call `showTaskError("Task cannot be empty.")` and return; if length > 100, call `showTaskError("Task must be 100 characters or fewer.")` and return; if a case-insensitive duplicate exists, call `showTaskError("Task already exists.")` and return; on success push `{ id: Date.now(), text: trimmed, completed: false }`, call `saveTasks()`, `renderTasks()`, clear `#task-input`, call `hideTaskError()`
    - `toggleTask(id)`: flip `completed` boolean; call `saveTasks()`; call `renderTasks()`
    - `deleteTask(id)`: filter array; call `saveTasks()`; call `renderTasks()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 4.12_

  - [x] 7.3 Implement inline task editing (`editTask` / `commitEdit`)
    - In `renderTasks()`, attach a click listener to each Edit button that: replaces the task `<span>` with `<input type="text" maxlength="100">` pre-filled with `task.text`; focuses the input; disables Edit and Delete buttons for other tasks during the edit
    - Define `commitEdit(id, inputEl)`: use a `committed` flag to guard against double-commit on blur+Enter; trim `inputEl.value`; if empty, restore original text silently and return; if the trimmed value matches another task's text (case-insensitive, excluding itself), restore original text and call `showTaskError("Task already exists.")`; otherwise update `tasks` array entry, call `saveTasks()`, call `renderTasks()`
    - Attach `keydown` (Enter) and `blur` listeners to the inline input to call `commitEdit`
    - _Requirements: 4.8, 4.9, 4.10, 4.11_

  - [x]* 7.4 Write property tests for task list operations (Properties 9–15)
    - **Property 9: Adding a valid task grows the list by exactly one** — call `addTask` with various valid texts; assert `tasks.length === n + 1` and last item has `completed: false`
    - **Property 10: Invalid task input leaves the list unchanged** — test empty string, whitespace, and strings of length 101+; assert list length and contents unchanged
    - **Property 11: Duplicate task (case-insensitive) leaves the list unchanged** — test exact and mixed-case duplicates; assert list unchanged
    - **Property 12: Task completion toggle is an involution** — toggle task twice; assert `completed` returns to original value; assert `id` and `text` unchanged
    - **Property 13: Deleting a task removes it and only it** — assert length `n − 1`, absence of deleted task, and preservation of all other tasks in original order
    - **Property 14: Edit with duplicate text leaves list unchanged** — attempt edit of task A to match task B; assert task A retains original text
    - **Property 15: Task list mutation persists and round-trips through localStorage** — after each mutation, `JSON.parse(localStorage.getItem('dashboard_tasks'))` must deep-equal the in-memory `tasks` array
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12**

- [x] 8. Checkpoint — Task Manager
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` via `file://`; verify: tasks load from storage on reload; add valid task; add empty task (inline error, no add); add task > 100 chars (inline error); add duplicate (inline error); checkbox toggles strikethrough; Delete removes item; Edit shows inline input with current text; Enter confirms; blur confirms; empty edit restores original; duplicate edit shows inline error and restores; hard-reload confirms persistence.

- [x] 9. Rewrite `initLinkManager()` — add validation, 20-link cap, and `rel` attribute
  - [x] 9.1 Implement link state, persistence, and rendering
    - Query `#link-form`, `#link-name`, `#link-url`, `#link-error`, `#links-container` once
    - Load links: wrap `JSON.parse(localStorage.getItem('dashboard_links'))` in `try/catch`; default to `[]` (remove hardcoded seed data)
    - `saveLinks()`: `localStorage.setItem('dashboard_links', JSON.stringify(quickLinks))`
    - `showLinkError(msg)` / `hideLinkError()`: toggle `#link-error`
    - `renderLinks()`: wipe `#links-container.innerHTML`; for each link create `<a class="link-btn" href="..." target="_blank" rel="noopener noreferrer">` with name text and a `<span class="close-btn">` that calls `deleteLink(link.id)` and calls `e.stopPropagation()`; append anchor to container
    - _Requirements: 5.1, 5.4, 5.6, 7.2, 7.6_

  - [x] 9.2 Implement `addLink` and `deleteLink` with full validation
    - `addLink(rawName, rawUrl)`: trim both inputs; if name is empty or length > 50, `showLinkError("Link name must be 1–50 characters.")` and return; if url is empty or length > 2048, `showLinkError("URL must be 1–2048 characters.")` and return; if `quickLinks.length >= 20`, `showLinkError("Maximum 20 quick links allowed.")` and return; call `normalizeUrl(trimmedUrl)`; push `{ id: Date.now(), name: trimmedName, url: normalizedUrl }`; `saveLinks()`; `renderLinks()`; clear both inputs; `hideLinkError()`
    - `deleteLink(id)`: filter array; `saveLinks()`; `renderLinks()`
    - Wire `link-form` submit to call `addLink(linkNameInput.value, linkUrlInput.value)`; call `e.preventDefault()`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x]* 9.3 Write property tests for quick-link operations (Properties 16–20)
    - **Property 16: Adding a valid link grows the list by exactly one** — test with various name/URL combos; assert last entry has normalised URL
    - **Property 17: Link count cap prevents exceeding 20 entries** — seed `quickLinks` with 20 entries, attempt `addLink`, assert length stays 20
    - **Property 18: Empty name or URL leaves the list unchanged** — test empty name with valid URL; valid name with empty URL; assert list unchanged
    - **Property 19: Deleting a link removes it and only it** — assert length `n − 1`, absence of deleted link, and original order of remaining items
    - **Property 20: Link list mutation persists and round-trips through localStorage** — `JSON.parse(localStorage.getItem('dashboard_links'))` must deep-equal the in-memory `quickLinks` array after add and delete
    - **Validates: Requirements 5.2, 5.5, 5.6, 5.7, 5.8**

- [x] 10. Rewrite `initThemeToggle()` — move inside `DOMContentLoaded` and fix label logic
  - [x] 10.1 Implement the theme toggle component correctly
    - Query `#theme-toggle` once
    - Define `applyTheme(theme)`: if `theme === "dark"`, add `dark-theme` class to `<body>` and set button label to `"☀️ Light Mode"`; otherwise remove `dark-theme` class and set label to `"🌙 Dark Mode"` (label always shows the **next** theme to be applied)
    - On init: read `dashboard_theme` from `localStorage` (try/catch; default `"light"` if absent, `null`, or any unrecognised value); call `applyTheme(savedTheme)` immediately so the theme is applied before other init functions render visible content
    - On toggle click: derive `newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark'`; call `applyTheme(newTheme)`; write `newTheme` to `localStorage` in `try/catch`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.4, 7.8_

  - [x]* 10.2 Write property tests for theme toggle (Properties 21 and 22)
    - **Property 21: Theme toggle is an involution** — simulate two toggle clicks from `"light"` start; assert `document.body.classList` returns to its original state; simulate two toggles from `"dark"` start; assert same
    - **Property 22: Theme value is always one of two valid states** — after any sequence of toggle operations, assert `localStorage.getItem('dashboard_theme')` is exactly `"light"` or `"dark"`
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 11. Add `localStorage` error handling and the storage-unavailable banner
  - [x] 11.1 Wrap every `localStorage` access in `try/catch` and show a one-time banner on failure
    - In `initGreeting`, `initTaskManager`, `initLinkManager`, and `initThemeToggle`, wrap every `localStorage.getItem` and `localStorage.setItem` call in individual `try/catch` blocks that catch `SecurityError` and `DOMException`
    - Define a module-level `storageBannerShown` flag (initialised to `false`) inside `DOMContentLoaded`
    - On any first-time storage failure during init (read _or_ write), if `!storageBannerShown`, insert `<div id="storage-banner" role="alert" class="error-msg" style="text-align:center;padding:10px;">Storage unavailable — changes won't be saved.</div>` as the first child of `.dashboard-container`; set `storageBannerShown = true`
    - For `commitName` specifically, also show an inline error message near `#greeting-container` when the name `setItem` call fails
    - App MUST continue to function in-memory even when storage is unavailable
    - _Requirements: 1.4, 2.8, 7.5, 7.6_

- [x] 12. Checkpoint — Links, Theme, and Storage Error Handling
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` via `file://`; test: add a link with a URL lacking `https://` (verify prepend); add 20 links then try a 21st (inline error); delete a link; verify `rel="noopener noreferrer"` on rendered anchors in DevTools; toggle dark mode and hard-reload (theme persists); confirm button label always shows the next theme; in DevTools Application tab, manually clear `dashboard_theme` and reload (defaults to light); simulate localStorage block via DevTools (Storage quota override) and confirm the banner appears and the app still works in-memory.

- [x] 13. Responsive layout audit and cross-browser verification
  - [x] 13.1 Audit and fix responsive CSS
    - Resize viewport below 650 px; confirm grid collapses to single column; confirm no horizontal scrollbar
    - Confirm all button elements render at ≥ 44 × 44 px click target at both breakpoints
    - Confirm all text renders at ≥ 14 px font size at both breakpoints
    - Add `overflow-x: hidden` to `body` in `style.css` if horizontal overflow is observed at any viewport width
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 13.2 Cross-browser and `file://` protocol verification
    - Open `index.html` directly via `file://` protocol (no local server); confirm all features load and work
    - Open DevTools Console in Chrome and Firefox; confirm zero `console.error` or unhandled exception messages on load and after exercising each component
    - Verify exactly one `submit` handler exists for `#task-form` (only the one inside `initTaskManager`; the duplicate outside `DOMContentLoaded` was removed in Task 3.1)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Final checkpoint — full integration pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run every integration scenario listed in the design's Testing Strategy section for all six components (Clock & Greeting, Focus Timer, Task Manager, Quick Links, Theme Toggle, Responsive Layout); confirm zero console errors; hard-reload and verify all persisted state (tasks, links, name, theme) restores correctly; open `index.html?test` in the browser console and confirm all `PASS` lines appear for the property tests.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The `?test` query-string property-test runner lives inside the same `app.js` file and requires no build step — output is browser console only
- Tasks 3.1 is the highest-priority fix: the duplicate event listener outside `DOMContentLoaded` causes a `ReferenceError` crash in the current codebase that blocks Tasks 7 and 8 from working correctly
- Checkpoints (Tasks 5, 8, 12, 14) are manual browser verification steps, not coding tasks
- Hardcoded seed data in the current `app.js` (`belanja`/`belajar` tasks and Google/Gmail/Calendar links) must be removed in Tasks 7.1 and 9.1 so the app starts with empty lists as required by Requirement 7.5 and 7.6

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "3.6", "4.1", "4.2"] },
    { "id": 4, "tasks": ["6.1", "7.1", "9.1", "10.1"] },
    { "id": 5, "tasks": ["6.2", "7.2", "9.2", "10.2"] },
    { "id": 6, "tasks": ["7.3"] },
    { "id": 7, "tasks": ["7.4", "9.3", "11.1"] },
    { "id": 8, "tasks": ["13.1", "13.2"] }
  ]
}
```
