# Requirements Document

## Introduction

A personal dashboard is a single-page web application that serves as a personalized browser start page. It gives users a unified view of the current time, a focused work timer, a to-do list, and quick-access links — all stored locally in the browser with no backend required. The dashboard is built with plain HTML, CSS, and Vanilla JavaScript, and must run as a standalone web app or browser extension in any modern browser.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Clock**: The UI component that displays the current time and date.
- **Greeting**: The time-of-day-sensitive salutation shown to the user.
- **Focus_Timer**: The countdown timer component set to 25 minutes by default.
- **Task_Manager**: The UI component that manages the user's to-do list.
- **Task**: A single to-do item with text, a completion state, and a unique identifier.
- **Link_Manager**: The UI component that manages user-defined quick-access links.
- **Quick_Link**: A named, clickable button that opens a URL in a new browser tab.
- **Local_Storage**: The browser's `localStorage` API used for client-side persistence.
- **Theme**: The visual color scheme of the Dashboard (light or dark).

---

## Requirements

### Requirement 1: Clock and Date Display

**User Story:** As a user, I want to see the current time and date at a glance, so that I can stay oriented without switching tabs.

#### Acceptance Criteria

1. THE Clock SHALL display the current time in HH:MM:SS format using a 24-hour clock, where HH is 00–23, MM is 00–59, and SS is 00–59.
2. THE Clock SHALL display the current date as a single formatted string containing the full weekday name, full month name, numeric day, and four-digit year (e.g., "Thursday, September 10 2026").
3. WHEN 1 second elapses, THE Clock SHALL update both the time and date displays to reflect the current local device time without requiring a page reload.
4. IF the browser cannot access the local device time, THEN THE Clock SHALL display a static error message indicating that the time is unavailable.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a personalized greeting based on the time of day, so that the dashboard feels contextual and welcoming.

#### Acceptance Criteria

1. WHILE the local hour is between 00:00 and 11:59, THE Greeting SHALL display "Good Morning".
2. WHILE the local hour is between 12:00 and 17:59, THE Greeting SHALL display "Good Afternoon".
3. WHILE the local hour is between 18:00 and 23:59, THE Greeting SHALL display "Good Evening".
4. THE Greeting SHALL display the user's saved name alongside the time-of-day salutation in the format "[salutation], [name]".
5. WHEN the user clicks the name in the Greeting, THE Dashboard SHALL replace the name with an editable inline text input pre-filled with the current name, with a maximum length of 50 characters.
6. WHEN the user presses Enter or removes focus from the name input, THE Dashboard SHALL save the entered name to Local_Storage and restore the name to non-editable text within 100ms.
7. IF the user submits an empty or whitespace-only name, THEN THE Dashboard SHALL store and display the fallback name "User".
8. IF Local_Storage is unavailable when saving the name, THEN THE Dashboard SHALL display an inline error message indicating that the name could not be saved.
9. WHEN the page loads and no name is saved in Local_Storage, THE Greeting SHALL display "User" as the default name.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer, so that I can time focused work sessions without leaving the dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a duration of 25 minutes (1500 seconds) on first load and after a reset.
2. THE Focus_Timer SHALL display the remaining time in MM:SS format, where MM is zero-padded minutes (00–25) and SS is zero-padded seconds (00–59).
3. WHEN the user clicks the Start button, THE Focus_Timer SHALL begin counting down at one-second intervals.
4. WHEN the user clicks the Start button, THE Focus_Timer SHALL change the Start button to a visually disabled state.
5. WHEN the user clicks the Stop button, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
6. WHEN the user clicks the Reset button, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop counting and display a notification message indicating the session has ended.
8. IF the Start button is clicked while the timer is already running, THEN THE Focus_Timer SHALL ignore the click and not start a second interval.
9. IF the Stop button is clicked while the timer is not running, THEN THE Focus_Timer SHALL ignore the click and retain the current displayed time.

---

### Requirement 4: To-Do List

**User Story:** As a user, I want to manage a list of tasks, so that I can track what I need to do and mark items as complete.

#### Acceptance Criteria

1. THE Task_Manager SHALL render all tasks saved in Local_Storage on page load in the order they were originally added.
2. WHEN the user submits the task input form with a non-empty value of 100 characters or fewer, THE Task_Manager SHALL add a new Task to the list with the entered text and a default completed state of false.
3. IF the user submits the task input form with an empty value or a value exceeding 100 characters, THEN THE Task_Manager SHALL display an inline error message and not add the Task.
4. IF the user submits the task input form with text that matches an existing Task's text (case-insensitive), THEN THE Task_Manager SHALL display an inline error message and not add the duplicate Task.
5. WHEN the user checks the checkbox on a Task, THE Task_Manager SHALL toggle the Task's completed state.
6. WHILE a Task has a completed state of true, THE Task_Manager SHALL render that Task's text with a strikethrough style.
7. WHEN the user clicks the Delete button on a Task, THE Task_Manager SHALL remove that Task from the list.
8. WHEN the user clicks the Edit button on a Task, THE Task_Manager SHALL replace the Task's text with an editable inline input pre-filled with the current text.
9. WHEN the user confirms an edit (by pressing Enter or removing focus), THE Task_Manager SHALL update the Task's text with the new value and return to the non-editable display.
10. IF the user confirms an edit with an empty value, THEN THE Task_Manager SHALL discard the change and restore the original text.
11. IF the user confirms an edit with a value that matches another existing Task's text (case-insensitive), THEN THE Task_Manager SHALL discard the change, restore the original text, and display an inline error message.
12. WHEN any Task is added, toggled, edited, or deleted, THE Task_Manager SHALL persist the updated task list to Local_Storage.

---

### Requirement 5: Quick Links

**User Story:** As a user, I want to save and access favorite website links as buttons, so that I can navigate to them in one click.

#### Acceptance Criteria

1. THE Link_Manager SHALL render all Quick_Links saved in Local_Storage on page load.
2. WHEN the user submits the link form with a non-empty name (max 50 characters) and a non-empty URL (max 2048 characters) and fewer than 20 Quick_Links are saved, THE Link_Manager SHALL add a new Quick_Link button to the display.
3. IF the submitted URL does not begin with "http://" or "https://", THEN THE Link_Manager SHALL prepend "https://" to the URL before saving.
4. WHEN the user clicks a Quick_Link button, THE Dashboard SHALL open the link's URL in a new browser tab.
5. WHEN the user clicks the delete control on a Quick_Link, THE Link_Manager SHALL remove that Quick_Link from the display immediately without a confirmation step.
6. WHEN any Quick_Link is added or deleted, THE Link_Manager SHALL persist the updated link list to Local_Storage.
7. IF the user submits the link form with an empty name or empty URL, THEN THE Link_Manager SHALL display an inline error message and not add the Quick_Link.
8. IF the user attempts to add a Quick_Link when 20 Quick_Links are already saved, THEN THE Link_Manager SHALL display an inline error message and not add the Quick_Link.

---

### Requirement 6: Light / Dark Theme Toggle

**User Story:** As a user, I want to switch between light and dark color schemes, so that the dashboard is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. WHEN the page loads, THE Dashboard SHALL apply the Theme saved in Local_Storage by reflecting it as the active visual style across all dashboard content.
2. IF no Theme is saved in Local_Storage, THEN THE Dashboard SHALL default to the light Theme.
3. WHEN the user clicks the theme toggle button, THE Dashboard SHALL switch between the light and dark Themes.
4. WHEN the Theme changes, THE Dashboard SHALL update the toggle button label to display the name of the Theme that will be applied on the next click (either "Light" or "Dark").
5. WHEN the Theme changes, THE Dashboard SHALL persist the new Theme value to Local_Storage.
6. WHEN the Theme is applied, THE Dashboard SHALL update all visible dashboard sections — including background, text, and widget areas — to reflect the active Theme's color scheme without requiring a page reload.

---

### Requirement 7: Data Persistence

**User Story:** As a user, I want my tasks, links, name, and theme preference to survive a page refresh, so that I don't have to re-enter data every session.

#### Acceptance Criteria

1. WHEN the page loads, THE Dashboard SHALL load the saved task list from Local_Storage.
2. WHEN the page loads, THE Dashboard SHALL load the saved Quick_Link list from Local_Storage.
3. WHEN the page loads, THE Dashboard SHALL load the saved user name from Local_Storage.
4. WHEN the page loads, THE Dashboard SHALL load the saved Theme from Local_Storage before rendering any visible content.
5. IF Local_Storage contains no saved tasks or stored data is unreadable, THEN THE Task_Manager SHALL render an empty list.
6. IF Local_Storage contains no saved Quick_Links or stored data is unreadable, THEN THE Link_Manager SHALL render an empty list.
7. IF Local_Storage contains no saved user name, THEN THE Greeting SHALL display "User" as the default name.
8. IF Local_Storage contains no saved or valid Theme, THEN THE Dashboard SHALL default to the light Theme.

---

### Requirement 8: Responsive Layout

**User Story:** As a user, I want the dashboard to be usable on screens of different widths, so that it works on both desktop and smaller displays.

#### Acceptance Criteria

1. WHILE the viewport width is greater than 650px, THE Dashboard SHALL display the timer, task list, and quick-links sections in a two-column grid layout.
2. WHILE the viewport width is 650px or less, THE Dashboard SHALL collapse the grid to a single-column layout.
3. WHILE the viewport width is greater than 650px, all text SHALL render at a minimum of 14px font size and all interactive controls SHALL have a minimum click target of 44×44px with no horizontal clipping or scrolling.
4. WHILE the viewport width is 650px or less, all text SHALL render at a minimum of 14px font size and all interactive controls SHALL have a minimum click target of 44×44px with no horizontal clipping or scrolling.

---

### Requirement 9: Technical Stack Constraints

**User Story:** As a developer, I want the project to use only HTML, CSS, and Vanilla JavaScript with no build tools, so that the codebase is simple to maintain and deploy.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript — no frameworks, libraries, transpilers, bundlers, or package managers.
2. THE Dashboard SHALL require no backend server; all functionality SHALL operate using browser-native client-side storage only.
3. THE Dashboard SHALL consist of exactly one HTML file at the project root, one CSS file in the `css/` directory, and one JavaScript file in the `js/` directory, with no additional source files.
4. THE Dashboard SHALL load and operate correctly when opened directly via the `file://` protocol with no local server running.
5. WHEN tested in the latest stable versions of Chrome, Firefox, Edge, and Safari at the time of release, all interactive features SHALL produce expected outputs without JavaScript console errors.
