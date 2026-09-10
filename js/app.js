/* =============================================
   PERSONAL DASHBOARD — app.js
   Pure Vanilla JavaScript, no frameworks.
   All state lives in localStorage.
   ============================================= */

/* =============================================
   PURE HELPER FUNCTIONS
   (Hoisted named declarations — usable anywhere)
   ============================================= */

/**
 * Returns a time-of-day greeting for a given hour (0–23).
 * @param {number} hour
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"}
 */
function getGreeting(hour) {
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

/**
 * Formats a total-seconds integer as zero-padded "MM:SS".
 * @param {number} totalSeconds  Integer 0–1500
 * @returns {string}  e.g. "25:00", "01:05", "00:00"
 */
function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/**
 * Returns "User" for blank/whitespace-only input, otherwise returns trimmed value.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeName(raw) {
    const trimmed = (raw || '').trim();
    return trimmed.length > 0 ? trimmed : 'User';
}

/**
 * Prepends "https://" to a URL if it doesn't already start with http:// or https://.
 * Idempotent — calling twice on an already-valid URL returns the same string.
 * @param {string} raw
 * @returns {string}
 */
function normalizeUrl(raw) {
    const trimmed = (raw || '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return 'https://' + trimmed;
}

/* =============================================
   LOCALSTORAGE HELPERS
   Centralised safe read/write with try/catch.
   ============================================= */

/** @type {boolean} Tracks whether the storage-unavailable banner has been shown. */
let storageBannerShown = false;

/**
 * Safely reads a key from localStorage.
 * Returns null on any error (SecurityError, private browsing, etc.).
 * @param {string} key
 * @returns {string|null}
 */
function lsGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (_) {
        showStorageBanner();
        return null;
    }
}

/**
 * Safely writes a value to localStorage.
 * Returns true on success, false on failure.
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
function lsSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (_) {
        showStorageBanner();
        return false;
    }
}

/**
 * Displays a one-time storage-unavailable banner at the top of the dashboard.
 */
function showStorageBanner() {
    if (storageBannerShown) return;
    storageBannerShown = true;
    const container = document.querySelector('.dashboard-container');
    if (!container) return;
    const banner = document.createElement('div');
    banner.id = 'storage-banner';
    banner.setAttribute('role', 'alert');
    banner.className = 'error-msg';
    banner.textContent = 'Storage unavailable — changes won\'t be saved.';
    banner.style.cssText = 'text-align:center;padding:12px 16px;margin-bottom:0;font-size:0.9rem;';
    container.insertBefore(banner, container.firstChild);
}

/* =============================================
   COMPONENT: THEME TOGGLE
   Must run BEFORE other components so theme
   is applied before any visible content renders.
   ============================================= */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    /**
     * Applies a theme to <body> and updates the button label.
     * Label always shows the theme that will be applied on the NEXT click.
     * @param {"light"|"dark"} theme
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<span class="material-symbols-rounded">light_mode</span> Light Mode';
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.innerHTML = '<span class="material-symbols-rounded">dark_mode</span> Dark Mode';
        }
    }

    // Load saved theme before rendering — prevents flash of wrong theme.
    const saved = lsGet('dashboard_theme');
    const validTheme = (saved === 'light' || saved === 'dark') ? saved : 'light';
    applyTheme(validTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(newTheme);
        lsSet('dashboard_theme', newTheme);
    });
}

/* =============================================
   COMPONENT: CLOCK
   ============================================= */
function initClock() {
    const timeEl = document.getElementById('time-display');
    const dateEl = document.getElementById('date-display');
    if (!timeEl || !dateEl) return;

    function updateClock() {
        let now;
        try {
            now = new Date();
            if (isNaN(now.getTime())) throw new Error('Invalid date');
        } catch (_) {
            timeEl.textContent = 'Time unavailable';
            dateEl.textContent = 'Date unavailable';
            return;
        }

        // Time: HH:MM:SS (24-hour)
        timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Date: e.g. "Thursday, September 10 2026"
        dateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Drive the greeting text on every tick
        updateGreetingText(now.getHours());
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/* =============================================
   COMPONENT: GREETING
   ============================================= */

// updateGreetingText is declared here at module scope so initClock can call it.
function updateGreetingText(hour) {
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.textContent = getGreeting(hour);
}

function initGreeting() {
    const container = document.getElementById('greeting-container');
    if (!container) return;

    // Load saved name (default "User")
    let currentName = sanitizeName(lsGet('dashboard_username'));

    // Get or rebuild the #user-name span
    function getUserNameSpan() {
        return document.getElementById('user-name');
    }

    // Write name into span on initial load
    const initialSpan = getUserNameSpan();
    if (initialSpan) initialSpan.textContent = currentName;

    // Attach click-to-edit listener to a given span element
    function attachNameClickListener(span) {
        span.addEventListener('click', function handleClick() {
            // Build the inline input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'name-input-inline';
            input.maxLength = 50;
            input.value = currentName;
            input.setAttribute('aria-label', 'Edit your name');

            let committed = false;

            function commitName() {
                if (committed) return;
                committed = true;

                const newName = sanitizeName(input.value);
                currentName = newName;

                const saved = lsSet('dashboard_username', newName);

                // Rebuild the span
                const newSpan = document.createElement('span');
                newSpan.id = 'user-name';
                newSpan.className = 'editable-name';
                newSpan.title = 'Click to change name';
                newSpan.textContent = newName;

                // Show inline error if storage write failed
                if (!saved) {
                    const errSpan = document.createElement('span');
                    errSpan.className = 'error-msg';
                    errSpan.style.display = 'inline';
                    errSpan.style.marginLeft = '8px';
                    errSpan.textContent = 'Name could not be saved.';
                    input.replaceWith(newSpan);
                    newSpan.after(errSpan);
                    setTimeout(() => errSpan.remove(), 3000);
                } else {
                    input.replaceWith(newSpan);
                }

                attachNameClickListener(newSpan);
            }

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commitName();
                }
            });
            input.addEventListener('blur', commitName);

            // Swap span → input
            span.replaceWith(input);
            input.focus();
            input.select();
        });
    }

    if (initialSpan) attachNameClickListener(initialSpan);
}

/* =============================================
   COMPONENT: FOCUS TIMER
   ============================================= */
function initTimer() {
    const timerDisplay   = document.getElementById('timer-display');
    const startBtn       = document.getElementById('start-btn');
    const stopBtn        = document.getElementById('stop-btn');
    const resetBtn       = document.getElementById('reset-btn');
    const notification   = document.getElementById('timer-notification');
    if (!timerDisplay || !startBtn || !stopBtn || !resetBtn) return;

    let totalSeconds = 1500; // 25 minutes
    let timerInterval = null;

    function renderTimer() {
        timerDisplay.textContent = formatTime(totalSeconds);
    }

    function setRunning(running) {
        startBtn.disabled = running;
    }

    function hideNotification() {
        if (notification) notification.hidden = true;
    }

    function showNotification(msg) {
        if (!notification) return;
        notification.innerHTML = msg;
        notification.hidden = false;
    }

    startBtn.addEventListener('click', () => {
        if (timerInterval !== null) return; // Guard: already running
        hideNotification();
        setRunning(true);

        timerInterval = setInterval(() => {
            totalSeconds--;
            renderTimer();

            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                setRunning(false);
                showNotification('<span class="material-symbols-rounded">celebration</span> Focus session complete! Take a break.');
            }
        }, 1000);
    });

    stopBtn.addEventListener('click', () => {
        if (timerInterval === null) return; // Guard: not running
        clearInterval(timerInterval);
        timerInterval = null;
        setRunning(false);
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        totalSeconds = 1500;
        renderTimer();
        setRunning(false);
        hideNotification();
    });

    renderTimer();
}

/* =============================================
   COMPONENT: TASK MANAGER
   ============================================= */
function initTaskManager() {
    const taskForm   = document.getElementById('task-form');
    const taskInput  = document.getElementById('task-input');
    const taskList   = document.getElementById('task-list');
    const taskError  = document.getElementById('task-error');
    if (!taskForm || !taskInput || !taskList) return;

    // Load tasks from localStorage (empty array on failure or absence)
    let tasks = [];
    try {
        const raw = lsGet('dashboard_tasks');
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) tasks = parsed;
    } catch (_) {
        tasks = [];
    }

    function saveTasks() {
        lsSet('dashboard_tasks', JSON.stringify(tasks));
    }

    function showTaskError(msg) {
        if (!taskError) return;
        taskError.textContent = msg;
        taskError.hidden = false;
    }

    function hideTaskError() {
        if (!taskError) return;
        taskError.textContent = '';
        taskError.hidden = true;
    }

    function renderTasks() {
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';

            // --- Content (checkbox + text / edit input) ---
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content' + (task.completed ? ' completed' : '');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', 'Mark task as complete');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const span = document.createElement('span');
            span.textContent = task.text;

            contentDiv.appendChild(checkbox);
            contentDiv.appendChild(span);

            // --- Action buttons ---
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary';
            editBtn.textContent = 'Edit';
            editBtn.style.cssText = 'padding:5px 10px;min-height:36px;font-size:0.8rem;';
            editBtn.setAttribute('aria-label', 'Edit task');
            editBtn.addEventListener('click', () => startEdit(task.id, li, contentDiv, span, actionsDiv));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.setAttribute('aria-label', 'Delete task');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(contentDiv);
            li.appendChild(actionsDiv);
            taskList.appendChild(li);
        });
    }

    /** Replace the span with an inline edit input. */
    function startEdit(id, li, contentDiv, span, actionsDiv) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Build inline input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = task.text;
        input.maxLength = 100;

        span.replaceWith(input);
        input.focus();
        input.select();

        // Disable other edit/delete buttons while editing
        const allBtns = taskList.querySelectorAll('button');
        allBtns.forEach(b => { if (b !== input) b.disabled = true; });

        let committed = false;

        function commitEdit() {
            if (committed) return;
            committed = true;

            // Re-enable all buttons
            const allBtns2 = taskList.querySelectorAll('button');
            allBtns2.forEach(b => { b.disabled = false; });

            const newText = input.value.trim();

            // Empty → restore silently
            if (!newText) {
                input.replaceWith(span);
                return;
            }

            // Duplicate (case-insensitive, excluding self) → restore + error
            const isDuplicate = tasks.some(
                t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase()
            );
            if (isDuplicate) {
                input.replaceWith(span);
                showTaskError('A task with that name already exists.');
                return;
            }

            // Commit
            hideTaskError();
            task.text = newText;
            saveTasks();
            renderTasks();
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
            if (e.key === 'Escape') {
                committed = true; // suppress blur commit
                input.replaceWith(span);
                const allBtns3 = taskList.querySelectorAll('button');
                allBtns3.forEach(b => { b.disabled = false; });
            }
        });
        input.addEventListener('blur', commitEdit);
    }

    function addTask(rawText) {
        const text = rawText.trim();

        if (!text) {
            showTaskError('Task cannot be empty.');
            return;
        }
        if (text.length > 100) {
            showTaskError('Task must be 100 characters or fewer.');
            return;
        }
        const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
        if (isDuplicate) {
            showTaskError('That task already exists.');
            return;
        }

        hideTaskError();
        tasks.push({ id: Date.now(), text, completed: false });
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value);
    });

    renderTasks();
}

/* =============================================
   COMPONENT: LINK MANAGER
   ============================================= */
function initLinkManager() {
    const linkForm        = document.getElementById('link-form');
    const linkNameInput   = document.getElementById('link-name');
    const linkUrlInput    = document.getElementById('link-url');
    const linksContainer  = document.getElementById('links-container');
    const linkError       = document.getElementById('link-error');
    if (!linkForm || !linkNameInput || !linkUrlInput || !linksContainer) return;

    // Load links from localStorage (empty array on failure)
    let quickLinks = [];
    try {
        const raw = lsGet('dashboard_links');
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) quickLinks = parsed;
    } catch (_) {
        quickLinks = [];
    }

    function saveLinks() {
        lsSet('dashboard_links', JSON.stringify(quickLinks));
    }

    function showLinkError(msg) {
        if (!linkError) return;
        linkError.textContent = msg;
        linkError.hidden = false;
    }

    function hideLinkError() {
        if (!linkError) return;
        linkError.textContent = '';
        linkError.hidden = true;
    }

    function renderLinks() {
        linksContainer.innerHTML = '';

        quickLinks.forEach(link => {
            const anchor = document.createElement('a');
            anchor.className = 'link-btn';
            anchor.href = link.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.setAttribute('aria-label', link.name + ' (opens in new tab)');

            const nameText = document.createTextNode(link.name);
            anchor.appendChild(nameText);

            const closeSpan = document.createElement('span');
            closeSpan.className = 'close-btn';
            closeSpan.innerHTML = '<span class="material-symbols-rounded">close</span>';
            closeSpan.setAttribute('role', 'button');
            closeSpan.setAttribute('aria-label', 'Remove ' + link.name);
            closeSpan.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteLink(link.id);
            });

            anchor.appendChild(closeSpan);
            linksContainer.appendChild(anchor);
        });
    }

    function addLink(rawName, rawUrl) {
        const name = (rawName || '').trim();
        const rawUrlTrimmed = (rawUrl || '').trim();

        if (!name) {
            showLinkError('Link name cannot be empty.');
            return;
        }
        if (name.length > 50) {
            showLinkError('Link name must be 50 characters or fewer.');
            return;
        }
        if (!rawUrlTrimmed) {
            showLinkError('URL cannot be empty.');
            return;
        }
        if (rawUrlTrimmed.length > 2048) {
            showLinkError('URL must be 2048 characters or fewer.');
            return;
        }
        if (quickLinks.length >= 20) {
            showLinkError('Maximum 20 quick links allowed.');
            return;
        }

        const url = normalizeUrl(rawUrlTrimmed);

        hideLinkError();
        quickLinks.push({ id: Date.now(), name, url });
        saveLinks();
        renderLinks();
        linkNameInput.value = '';
        linkUrlInput.value = '';
        linkNameInput.focus();
    }

    function deleteLink(id) {
        quickLinks = quickLinks.filter(l => l.id !== id);
        saveLinks();
        renderLinks();
    }

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addLink(linkNameInput.value, linkUrlInput.value);
    });

    renderLinks();
}

/* =============================================
   OPTIONAL: PROPERTY TESTS
   Run by opening: index.html?test
   Results logged to browser console only.
   ============================================= */
function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(description, condition) {
        if (condition) {
            console.log('%cPASS%c ' + description, 'color:green;font-weight:bold', '');
            passed++;
        } else {
            console.error('FAIL ' + description);
            failed++;
        }
    }

    console.group('Personal Dashboard — Property Tests');

    // Property 1 & 2: getGreeting covers every valid hour, non-overlapping
    for (let h = 0; h <= 23; h++) {
        const g = getGreeting(h);
        const valid = ['Good Morning', 'Good Afternoon', 'Good Evening'].includes(g);
        assert('getGreeting(' + h + ') returns a valid greeting', valid);
    }
    for (let h = 0; h <= 11; h++)  assert('getGreeting(' + h + ') === "Good Morning"',   getGreeting(h) === 'Good Morning');
    for (let h = 12; h <= 17; h++) assert('getGreeting(' + h + ') === "Good Afternoon"', getGreeting(h) === 'Good Afternoon');
    for (let h = 18; h <= 23; h++) assert('getGreeting(' + h + ') === "Good Evening"',   getGreeting(h) === 'Good Evening');

    // Property 3 & 4: formatTime output pattern and round-trip
    [0, 1, 59, 60, 65, 1499, 1500].forEach(s => {
        const result = formatTime(s);
        assert('formatTime(' + s + ') matches MM:SS pattern', /^\d{2}:\d{2}$/.test(result));
        const [m, sec] = result.split(':').map(Number);
        assert('formatTime(' + s + ') round-trips correctly', m * 60 + sec === s);
    });

    // Property 5 & 6: sanitizeName
    ['', '   ', '\t', '\n'].forEach(v =>
        assert('sanitizeName("' + v.replace(/\n/g,'\\n').replace(/\t/g,'\\t') + '") === "User"', sanitizeName(v) === 'User')
    );
    assert('sanitizeName("Nura") === "Nura"', sanitizeName('Nura') === 'Nura');
    assert('sanitizeName("  Nura  ") === "Nura"', sanitizeName('  Nura  ') === 'Nura');
    assert('sanitizeName("A") === "A"', sanitizeName('A') === 'A');

    // Property 7 & 8: normalizeUrl
    assert('normalizeUrl("google.com") starts with https://', normalizeUrl('google.com').startsWith('https://'));
    assert('normalizeUrl("ftp://x.com") starts with https://', normalizeUrl('ftp://x.com').startsWith('https://'));
    assert('normalizeUrl("//x.com") starts with https://', normalizeUrl('//x.com').startsWith('https://'));
    assert('normalizeUrl("https://x.com") unchanged', normalizeUrl('https://x.com') === 'https://x.com');
    assert('normalizeUrl("http://x.com") unchanged', normalizeUrl('http://x.com') === 'http://x.com');

    console.log('');
    console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
    console.groupEnd();
}

/* =============================================
   BOOT — DOMContentLoaded
   initThemeToggle runs FIRST to prevent
   flash of wrong theme before content renders.
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();   // ← must be first
    initClock();
    initGreeting();
    initTimer();
    initTaskManager();
    initLinkManager();

    // Run property tests when ?test is in the URL
    if (window.location.search.includes('test')) {
        runTests();
    }
});
