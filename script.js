/* ==========================================================================
   CampusAI - Student Help Desk Script
   Author: Devanshi Goyal
   Features: Assignments Tracker, Google Calendar Sync, Gemini AI Chatbot,
             Notices Search, Dynamic Timetable, Dashboard Stats
   ========================================================================== */

/* --------------------------------------------------------------------------
   STATE & DATA INITIALIZATION
   -------------------------------------------------------------------------- */

// Initial default assignments if not already saved in localStorage
var defaultAssignments = [
    {
        id: "asgn_1",
        name: "ER Diagram and SQL Queries",
        subject: "Database Management System",
        description: "Design relational schema, construct ER diagram, and write SQL queries for Assignment 2.",
        date: "2026-10-30",
        completed: false
    },
    {
        id: "asgn_2",
        name: "Stack and Queue Implementation",
        subject: "Data Structures",
        description: "Implement circular queue and stack using linked lists in C++.",
        date: "2026-11-02",
        completed: false
    },
    {
        id: "asgn_3",
        name: "OSI Model and Network Devices",
        subject: "Computer Networks",
        description: "Prepare short notes on 7 layers of OSI model, TCP/IP differences, and router configurations.",
        date: "2026-11-05",
        completed: false
    }
];

// Active assignments array
var assignments = JSON.parse(localStorage.getItem("campusAssignments")) || defaultAssignments;

// Initial notices
var defaultNotices = [
    {
        id: "notice_1",
        title: "Internal Examination Timetable Announced",
        content: "The mid-semester internal examinations will commence from 15th October. Detailed datesheet and room allocation have been posted on the college portal. Students are advised to verify their subjects.",
        date: "24 September 2026",
        category: "Exams"
    },
    {
        id: "notice_2",
        title: "College Hackathon 2026 Registration Open",
        content: "Registrations are officially open for the Annual Campus AI & Web Hackathon! Form teams of 2-4 members. Exciting prizes, internships, and certificates await participants.",
        date: "23 September 2026",
        category: "Events"
    },
    {
        id: "notice_3",
        title: "Assignment Submission Reminder",
        content: "Students are reminded to submit pending Database Management and Data Structures assignments before their deadlines to ensure on-time continuous evaluation grading.",
        date: "22 September 2026",
        category: "Academic"
    }
];

var notices = JSON.parse(localStorage.getItem("campusNotices")) || defaultNotices;

// Weekly Timetable
var timetable = {
    Monday: [
        { time: "09:00 AM - 10:00 AM", subject: "Data Structures", room: "Room 204" },
        { time: "10:00 AM - 11:00 AM", subject: "Database Management", room: "Room 302" },
        { time: "11:30 AM - 12:30 PM", subject: "Mathematics", room: "Room 101" },
        { time: "01:30 PM - 02:30 PM", subject: "Computer Networks", room: "Room 105" }
    ],
    Tuesday: [
        { time: "09:00 AM - 10:00 AM", subject: "Operating Systems", room: "Room 201" },
        { time: "10:00 AM - 11:00 AM", subject: "Data Structures", room: "Room 204" },
        { time: "11:30 AM - 12:30 PM", subject: "Web Development", room: "Lab 3" },
        { time: "01:30 PM - 02:30 PM", subject: "Database Management", room: "Room 302" }
    ],
    Wednesday: [
        { time: "09:00 AM - 10:00 AM", subject: "Computer Networks", room: "Room 105" },
        { time: "10:00 AM - 11:00 AM", subject: "Mathematics", room: "Room 101" },
        { time: "11:30 AM - 12:30 PM", subject: "Operating Systems", room: "Room 201" },
        { time: "01:30 PM - 03:30 PM", subject: "Web Development Lab", room: "Lab 2" }
    ],
    Thursday: [
        { time: "09:00 AM - 10:00 AM", subject: "Database Management", room: "Room 302" },
        { time: "10:00 AM - 11:00 AM", subject: "Data Structures", room: "Room 204" },
        { time: "11:30 AM - 12:30 PM", subject: "Computer Networks", room: "Room 105" },
        { time: "01:30 PM - 02:30 PM", subject: "Mathematics", room: "Room 101" }
    ],
    Friday: [
        { time: "09:00 AM - 10:00 AM", subject: "Web Development", room: "Lab 3" },
        { time: "10:00 AM - 11:00 AM", subject: "Operating Systems", room: "Room 201" },
        { time: "11:30 AM - 12:30 PM", subject: "Data Structures", room: "Room 204" },
        { time: "01:30 PM - 03:30 PM", subject: "DBMS Practical Lab", room: "Lab 1" }
    ]
};

// Current filter for assignments
var currentAssignmentFilter = "all";


/* --------------------------------------------------------------------------
   PAGE NAVIGATION
   -------------------------------------------------------------------------- */

function showPage(pageName) {
    var pages = document.querySelectorAll(".page");
    pages.forEach(function (page) {
        page.classList.add("hidden");
    });

    var targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.remove("hidden");
    }

    var buttons = document.querySelectorAll(".sidebar .menu-btn");
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });

    // Map page name to sidebar button index
    var pageMap = {
        dashboard: 0,
        chat: 1,
        notices: 2,
        assignments: 3,
        timetable: 4
    };

    var targetIndex = pageMap[pageName];
    if (targetIndex !== undefined && buttons[targetIndex]) {
        buttons[targetIndex].classList.add("active");
    }

    // Scroll to top of main content
    var mainEl = document.querySelector(".main");
    if (mainEl) mainEl.scrollTop = 0;

    // Refresh views if needed
    if (pageName === "dashboard") {
        updateDashboard();
    } else if (pageName === "assignments") {
        displayAssignments(currentAssignmentFilter);
    } else if (pageName === "notices") {
        displayNotices();
    }
}


/* --------------------------------------------------------------------------
   ASSIGNMENT TRACKER LOGIC
   -------------------------------------------------------------------------- */

// Calculate relative due date and badge
function getDueStatus(dateStr, isCompleted) {
    if (isCompleted) {
        return { text: "Completed", className: "badge-completed" };
    }
    if (!dateStr) {
        return { text: "No Due Date", className: "badge-upcoming" };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var parts = dateStr.split("-").map(Number);
    var due = new Date(parts[0], parts[1] - 1, parts[2]);
    due.setHours(0, 0, 0, 0);

    var diffTime = due.getTime() - today.getTime();
    var diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        var daysAgo = Math.abs(diffDays);
        return {
            text: "Overdue (" + daysAgo + " day" + (daysAgo === 1 ? "" : "s") + ")",
            className: "badge-overdue"
        };
    } else if (diffDays === 0) {
        return { text: "Due Today", className: "badge-today" };
    } else if (diffDays === 1) {
        return { text: "Due Tomorrow", className: "badge-today" };
    } else {
        return {
            text: "Due in " + diffDays + " days",
            className: "badge-upcoming"
        };
    }
}

// Format date into human readable string
function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    var parts = dateStr.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Generate Google Calendar Web Intent URL
function getGoogleCalendarUrl(assignment) {
    var title = encodeURIComponent("📝 " + assignment.name + " (" + assignment.subject + " Due)");
    var details = encodeURIComponent(
        "Subject: " + assignment.subject + "\n" +
        "Details: " + (assignment.description || "Coursework Assignment") + "\n\n" +
        "Tracked via CampusAI Student Portal"
    );

    var dateClean = assignment.date.replace(/-/g, "");
    var parts = assignment.date.split("-").map(Number);
    var nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    var nextClean = nextDay.getFullYear() +
        String(nextDay.getMonth() + 1).padStart(2, "0") +
        String(nextDay.getDate()).padStart(2, "0");

    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
        title + "&details=" + details + "&dates=" + dateClean + "/" + nextClean;
}

// Open Google Calendar link
function addToGoogleCalendar(id) {
    var assignment = assignments.find(function (a) { return a.id === id; });
    if (!assignment) return;
    var url = getGoogleCalendarUrl(assignment);
    window.open(url, "_blank", "noopener,noreferrer");
    showToast("Opening Google Calendar...", "info");
}

// Download .ics file for offline/Apple/Outlook calendars
function downloadIcsFile(id) {
    var assignment = assignments.find(function (a) { return a.id === id; });
    if (!assignment) return;

    var dateClean = assignment.date.replace(/-/g, "");
    var parts = assignment.date.split("-").map(Number);
    var nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    var nextClean = nextDay.getFullYear() +
        String(nextDay.getMonth() + 1).padStart(2, "0") +
        String(nextDay.getDate()).padStart(2, "0");

    var icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CampusAI//Student Help Desk//EN",
        "BEGIN:VEVENT",
        "UID:campusai-" + assignment.id + "@campusai.local",
        "DTSTAMP:" + dateClean + "T090000Z",
        "DTSTART;VALUE=DATE:" + dateClean,
        "DTEND;VALUE=DATE:" + nextClean,
        "SUMMARY:📝 " + assignment.name + " (" + assignment.subject + ")",
        "DESCRIPTION:" + (assignment.description || "").replace(/\n/g, "\\n"),
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    var blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = assignment.name.replace(/[^a-zA-Z0-9]/g, "_") + ".ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded .ics calendar file!", "success");
}

// Render assignments list with filtering
function displayAssignments(filter) {
    if (filter) currentAssignmentFilter = filter;
    var list = document.getElementById("assignmentList");
    if (!list) return;

    // Filter assignments
    var filtered = assignments.filter(function (a) {
        if (currentAssignmentFilter === "pending") return !a.completed;
        if (currentAssignmentFilter === "completed") return a.completed;
        return true;
    });

    // Sort: pending first, then by date ascending
    filtered.sort(function (a, b) {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.date || "").localeCompare(b.date || "");
    });

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = [
            '<div class="empty-state">',
            '  <div class="empty-icon">🎉</div>',
            '  <h3>No assignments found</h3>',
            '  <p>' + (currentAssignmentFilter === 'completed' ? 'You have not completed any assignments yet.' : 'All caught up! Click "+ Add Assignment" to track a new task.') + '</p>',
            '</div>'
        ].join("");
    } else {
        filtered.forEach(function (assignment) {
            var status = getDueStatus(assignment.date, assignment.completed);
            var isDone = assignment.completed;

            var card = document.createElement("div");
            card.className = "assignment-card" + (isDone ? " completed" : "");
            card.dataset.id = assignment.id;

            card.innerHTML = [
                '<div class="assignment-header">',
                '  <div class="assignment-title-wrap">',
                '    <span class="subject-tag">' + escapeHtml(assignment.subject) + '</span>',
                '    <h3 class="assignment-title">' + escapeHtml(assignment.name) + '</h3>',
                '  </div>',
                '  <span class="due-badge ' + status.className + '">' + status.text + '</span>',
                '</div>',
                '<p class="assignment-desc">' + escapeHtml(assignment.description || "No additional description.") + '</p>',
                '<div class="assignment-footer">',
                '  <div class="due-date-info">',
                '    <b>📅 Due:</b> ' + formatDisplayDate(assignment.date),
                '  </div>',
                '  <div class="assignment-actions">',
                '    <button class="btn-action toggle-btn" onclick="toggleAssignmentStatus(\'' + assignment.id + '\')" title="' + (isDone ? 'Mark as Pending' : 'Mark as Done') + '">',
                '      ' + (isDone ? '↩ Pending' : '✅ Done'),
                '    </button>',
                '    <button class="btn-action cal-btn" onclick="addToGoogleCalendar(\'' + assignment.id + '\')" title="Add to Google Calendar">',
                '      📅 Calendar',
                '    </button>',
                '    <button class="btn-action ics-btn" onclick="downloadIcsFile(\'' + assignment.id + '\')" title="Download .ics for Apple/Outlook/Google Calendar">',
                '      📥 .ics',
                '    </button>',
                '    <button class="btn-action delete-btn" onclick="deleteAssignment(\'' + assignment.id + '\')" title="Delete Assignment">',
                '      🗑️',
                '    </button>',
                '  </div>',
                '</div>'
            ].join("");

            list.appendChild(card);
        });
    }

    // Update counts
    updateAssignmentCounts();
    updateDashboard();
}

// Update filter count numbers
function updateAssignmentCounts() {
    var all = assignments.length;
    var pending = assignments.filter(function (a) { return !a.completed; }).length;
    var completed = assignments.filter(function (a) { return a.completed; }).length;

    var allEl = document.getElementById("allCount");
    var pendingEl = document.getElementById("pendingCount");
    var completedEl = document.getElementById("completedCount");
    var cardCountEl = document.getElementById("assignmentCount");

    if (allEl) allEl.innerText = all;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
    if (cardCountEl) cardCountEl.innerText = pending;
}

// Filter button click handler
function setAssignmentFilter(filter, btn) {
    currentAssignmentFilter = filter;
    var buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach(function (b) { b.classList.remove("active"); });
    if (btn) btn.classList.add("active");
    displayAssignments();
}

// Open assignment popup modal
function openAssignmentPopup() {
    var popup = document.getElementById("assignmentPopup");
    if (!popup) return;

    // Reset inputs
    var nameInput = document.getElementById("assignmentName");
    var subjectInput = document.getElementById("assignmentSubject");
    var descInput = document.getElementById("assignmentDescription");
    var dateInput = document.getElementById("assignmentDate");

    if (nameInput) nameInput.value = "";
    if (subjectInput) subjectInput.value = "";
    if (descInput) descInput.value = "";

    // Set default date to 3 days from now
    if (dateInput) {
        var d = new Date();
        d.setDate(d.getDate() + 3);
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, "0");
        var dd = String(d.getDate()).padStart(2, "0");
        dateInput.value = yyyy + "-" + mm + "-" + dd;
    }

    popup.style.display = "flex";
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 100);
}

// Close assignment popup modal
function closeAssignmentPopup() {
    var popup = document.getElementById("assignmentPopup");
    if (popup) popup.style.display = "none";
}

// Add new assignment
function addAssignment() {
    var name = (document.getElementById("assignmentName").value || "").trim();
    var subject = (document.getElementById("assignmentSubject").value || "").trim();
    var description = (document.getElementById("assignmentDescription").value || "").trim();
    var date = document.getElementById("assignmentDate").value;

    if (!name || !subject || !date) {
        showToast("Please fill in Assignment Title, Subject, and Due Date.", "warning");
        return;
    }

    var newAssignment = {
        id: "asgn_" + Date.now(),
        name: name,
        subject: subject,
        description: description,
        date: date,
        completed: false
    };

    assignments.push(newAssignment);
    saveAssignments();

    closeAssignmentPopup();
    displayAssignments();
    showToast("Assignment added successfully! 📝", "success");
}

// Toggle assignment completion
function toggleAssignmentStatus(id) {
    var assignment = assignments.find(function (a) { return a.id === id; });
    if (!assignment) return;

    assignment.completed = !assignment.completed;
    saveAssignments();
    displayAssignments();

    if (assignment.completed) {
        showToast("Assignment marked as completed! 🎉", "success");
    } else {
        showToast("Assignment marked as pending.", "info");
    }
}

// Delete assignment
function deleteAssignment(id) {
    // If called via inline `this`, find parent ID
    if (typeof id === "object" && id !== null) {
        var card = id.closest(".assignment-card");
        id = card ? card.dataset.id : null;
    }

    var assignment = assignments.find(function (a) { return a.id === id; });
    if (!assignment) return;

    var confirmDelete = confirm("Are you sure you want to delete \"" + assignment.name + "\"?");
    if (!confirmDelete) return;

    assignments = assignments.filter(function (a) { return a.id !== id; });
    saveAssignments();
    displayAssignments();
    showToast("Assignment deleted.", "info");
}

// Save assignments to localStorage
function saveAssignments() {
    localStorage.setItem("campusAssignments", JSON.stringify(assignments));
}


/* --------------------------------------------------------------------------
   COLLEGE NOTICES LOGIC
   -------------------------------------------------------------------------- */

function displayNotices(searchQuery) {
    var list = document.getElementById("noticeList");
    if (!list) return;

    var query = (searchQuery || "").toLowerCase().trim();

    var filtered = notices.filter(function (n) {
        if (!query) return true;
        return n.title.toLowerCase().includes(query) ||
            n.content.toLowerCase().includes(query) ||
            (n.category && n.category.toLowerCase().includes(query));
    });

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = [
            '<div class="empty-state">',
            '  <div class="empty-icon">🔍</div>',
            '  <h3>No notices found</h3>',
            '  <p>No college notices matched your search query "' + escapeHtml(query) + '".</p>',
            '</div>'
        ].join("");
    } else {
        filtered.forEach(function (notice) {
            var div = document.createElement("div");
            div.className = "notice";
            div.innerHTML = [
                '<div class="notice-header">',
                '  <h3>' + escapeHtml(notice.title) + '</h3>',
                '  <span class="notice-category">' + escapeHtml(notice.category || "General") + '</span>',
                '</div>',
                '<p>' + escapeHtml(notice.content) + '</p>',
                '<span class="notice-date">📅 Posted: ' + escapeHtml(notice.date) + '</span>'
            ].join("");
            list.appendChild(div);
        });
    }

    var countEl = document.getElementById("noticeCount");
    if (countEl) countEl.innerText = notices.length;
}

// Live search notices
function searchNotices() {
    var input = document.getElementById("noticeSearch");
    var query = input ? input.value : "";
    displayNotices(query);
}

// Alias for backwards compatibility
function searchNotice() {
    searchNotices();
}


/* --------------------------------------------------------------------------
   CLASS TIMETABLE LOGIC
   -------------------------------------------------------------------------- */

function showDay(day) {
    var titleEl = document.getElementById("dayTitle");
    if (titleEl) titleEl.innerText = day;

    var list = document.getElementById("timetableList");
    if (!list) return;

    // Highlight active day button
    var dayButtons = document.querySelectorAll("#timetableDays .day-btn");
    dayButtons.forEach(function (btn) {
        if (btn.innerText.trim() === day) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    list.innerHTML = "";

    var dayClasses = timetable[day] || [];

    if (dayClasses.length === 0) {
        list.innerHTML = '<p class="empty-text">No scheduled classes for this day.</p>';
        return;
    }

    dayClasses.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "class-item";
        div.innerHTML = [
            '<div class="class-time">⏱️ ' + escapeHtml(item.time) + '</div>',
            '<div class="class-details">',
            '  <h3>' + escapeHtml(item.subject) + '</h3>',
            '  <p>📍 ' + escapeHtml(item.room) + '</p>',
            '</div>'
        ].join("");
        list.appendChild(div);
    });
}

// Get day name for today (or Monday if weekend)
function getTodayName() {
    var dayIndex = new Date().getDay();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var name = days[dayIndex];
    if (name === "Saturday" || name === "Sunday") return "Monday";
    return name;
}


/* --------------------------------------------------------------------------
   DASHBOARD UPDATES
   -------------------------------------------------------------------------- */

function updateDashboard() {
    // 1. Notice count
    var noticeCountEl = document.getElementById("noticeCount");
    if (noticeCountEl) noticeCountEl.innerText = notices.length;

    // 2. Pending assignment count
    var pending = assignments.filter(function (a) { return !a.completed; });
    var assignmentCountEl = document.getElementById("assignmentCount");
    if (assignmentCountEl) assignmentCountEl.innerText = pending.length;

    // 3. Today's classes count
    var todayName = getTodayName();
    var todayClasses = timetable[todayName] || [];
    var classCountEl = document.getElementById("classCount");
    if (classCountEl) classCountEl.innerText = todayClasses.length;

    // 4. Today's Date Badge
    var dateBadge = document.getElementById("todayDateBadge");
    if (dateBadge) {
        var today = new Date();
        dateBadge.innerText = today.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });
    }

    // 5. Populate Today's Updates list with actual data
    var updatesList = document.getElementById("updatesList");
    if (updatesList) {
        updatesList.innerHTML = "";

        // Sort pending assignments by deadline
        var upcomingAsgns = pending.slice().sort(function (a, b) {
            return (a.date || "").localeCompare(b.date || "");
        });

        // Top 2 pending assignments
        upcomingAsgns.slice(0, 2).forEach(function (a) {
            var status = getDueStatus(a.date, a.completed);
            var item = document.createElement("div");
            item.className = "update";
            item.innerHTML = [
                '<b>📝 ' + escapeHtml(a.subject) + ' - ' + escapeHtml(a.name) + '</b>',
                '<p>' + escapeHtml(a.description || "Submit before due date.") + '</p>',
                '<span class="due-badge ' + status.className + '" style="margin-top:6px; display:inline-block;">' + status.text + '</span>'
            ].join("");
            updatesList.appendChild(item);
        });

        // Top Notice
        if (notices.length > 0) {
            var latestNotice = notices[0];
            var noticeItem = document.createElement("div");
            noticeItem.className = "update notice-update";
            noticeItem.innerHTML = [
                '<b>📢 ' + escapeHtml(latestNotice.title) + '</b>',
                '<p>' + escapeHtml(latestNotice.content) + '</p>',
                '<small style="color:#777; display:block; margin-top:4px;">Posted: ' + escapeHtml(latestNotice.date) + '</small>'
            ].join("");
            updatesList.appendChild(noticeItem);
        }

        if (updatesList.children.length === 0) {
            updatesList.innerHTML = '<p style="color:#666;">No pending updates for today. You are all caught up!</p>';
        }
    }
}


/* --------------------------------------------------------------------------
   GEMINI AI & CHAT INTEGRATION
   -------------------------------------------------------------------------- */

var GEMINI_STORAGE_KEY = "campusai_gemini_api_key";
var GEMINI_MODEL_KEY = "campusai_gemini_model";

// Get configured API key
function getGeminiApiKey() {
    return localStorage.getItem(GEMINI_STORAGE_KEY) || "";
}

// Get configured Model
function getGeminiModel() {
    return localStorage.getItem(GEMINI_MODEL_KEY) || "gemini-2.0-flash";
}

// Update AI Status Indicators on UI
function updateAiStatusIndicator() {
    var key = getGeminiApiKey();
    var hasKey = Boolean(key && key.trim().length > 10);

    // Sidebar indicator
    var sideDot = document.getElementById("sidebarStatusDot");
    var sideText = document.getElementById("sidebarStatusText");
    if (sideDot && sideText) {
        if (hasKey) {
            sideDot.className = "status-dot online";
            sideText.innerText = "Gemini AI Active";
        } else {
            sideDot.className = "status-dot";
            sideText.innerText = "Campus Assistant";
        }
    }

    // Chat header indicator
    var chatPill = document.getElementById("chatStatusPill");
    var chatLabel = document.getElementById("chatStatusLabel");
    if (chatPill && chatLabel) {
        if (hasKey) {
            chatPill.className = "ai-status-pill online";
            chatLabel.innerText = "Gemini 2.0 Connected";
        } else {
            chatPill.className = "ai-status-pill offline";
            chatLabel.innerText = "Smart Campus Mode (Offline)";
        }
    }
}

// Open AI Settings Modal
function openAiSettings() {
    var popup = document.getElementById("aiSettingsPopup");
    if (!popup) return;

    var keyInput = document.getElementById("geminiApiKey");
    var modelSelect = document.getElementById("geminiModelSelect");
    var statusMsg = document.getElementById("apiTestStatus");

    if (keyInput) keyInput.value = getGeminiApiKey();
    if (modelSelect) modelSelect.value = getGeminiModel();
    if (statusMsg) {
        statusMsg.innerText = "";
        statusMsg.className = "api-status-msg";
    }

    popup.style.display = "flex";
}

// Close AI Settings Modal
function closeAiSettings() {
    var popup = document.getElementById("aiSettingsPopup");
    if (popup) popup.style.display = "none";
}

// Toggle API Key visibility
function toggleApiKeyVisibility() {
    var keyInput = document.getElementById("geminiApiKey");
    if (!keyInput) return;
    if (keyInput.type === "password") {
        keyInput.type = "text";
    } else {
        keyInput.type = "password";
    }
}

// Save and Test Gemini API Key
async function saveAndTestApiKey() {
    var keyInput = document.getElementById("geminiApiKey");
    var modelSelect = document.getElementById("geminiModelSelect");
    var statusMsg = document.getElementById("apiTestStatus");

    var key = (keyInput ? keyInput.value : "").trim();
    var model = modelSelect ? modelSelect.value : "gemini-2.0-flash";

    if (!key) {
        if (statusMsg) {
            statusMsg.className = "api-status-msg error";
            statusMsg.innerText = "Please enter an API key or click Remove to use offline mode.";
        }
        return;
    }

    if (statusMsg) {
        statusMsg.className = "api-status-msg info";
        statusMsg.innerText = "Testing connection with Google Gemini...";
    }

    try {
        var testUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(key);
        var response = await fetch(testUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello! Reply with 'OK' if you can read this." }] }]
            })
        });

        var data = await response.json();

        if (!response.ok || data.error) {
            var errMsg = (data.error && data.error.message) ? data.error.message : ("HTTP Error " + response.status);
            if (statusMsg) {
                statusMsg.className = "api-status-msg error";
                statusMsg.innerText = "Connection failed: " + errMsg;
            }
            showToast("Failed to verify API key. Please check your key.", "error");
            return;
        }

        // Successfully verified!
        localStorage.setItem(GEMINI_STORAGE_KEY, key);
        localStorage.setItem(GEMINI_MODEL_KEY, model);

        if (statusMsg) {
            statusMsg.className = "api-status-msg success";
            statusMsg.innerText = "✅ Successfully connected to Google Gemini (" + model + ")!";
        }

        updateAiStatusIndicator();
        showToast("Gemini AI API Connected! 🚀", "success");

        setTimeout(function () {
            closeAiSettings();
        }, 1200);

    } catch (err) {
        if (statusMsg) {
            statusMsg.className = "api-status-msg error";
            statusMsg.innerText = "Network error while connecting to Gemini: " + err.message;
        }
        showToast("Network error. Please check your internet connection.", "error");
    }
}

// Remove API Key
function clearApiKey() {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    var keyInput = document.getElementById("geminiApiKey");
    if (keyInput) keyInput.value = "";

    var statusMsg = document.getElementById("apiTestStatus");
    if (statusMsg) {
        statusMsg.className = "api-status-msg info";
        statusMsg.innerText = "API key removed. Running in smart built-in campus mode.";
    }

    updateAiStatusIndicator();
    showToast("API key removed. Switched to Built-in Assistant.", "info");
}

// Build live campus context for AI
function buildCampusContext() {
    var todayStr = new Date().toDateString();
    var todayName = getTodayName();

    var pendingList = assignments
        .filter(function (a) { return !a.completed; })
        .map(function (a) {
            return "- " + a.name + " (" + a.subject + "), Due: " + a.date + ", Details: " + (a.description || "N/A");
        }).join("\n");

    var completedList = assignments
        .filter(function (a) { return a.completed; })
        .map(function (a) { return "- " + a.name + " (" + a.subject + ")"; })
        .join("\n");

    var noticeList = notices.map(function (n) {
        return "- [" + n.category + "] " + n.title + ": " + n.content + " (Posted: " + n.date + ")";
    }).join("\n");

    var todayClasses = (timetable[todayName] || []).map(function (c) {
        return "- " + c.time + ": " + c.subject + " (" + c.room + ")";
    }).join("\n");

    return [
        "CAMPUS LIVE INFORMATION:",
        "Student Name: Devanshi Goyal",
        "Today's Date: " + todayStr + " (" + todayName + ")",
        "",
        "TODAY'S CLASSES (" + todayName + "):",
        todayClasses || "No classes scheduled.",
        "",
        "PENDING ASSIGNMENTS:",
        pendingList || "No pending assignments. All assignments are completed!",
        "",
        "COMPLETED ASSIGNMENTS:",
        completedList || "None yet.",
        "",
        "LATEST COLLEGE NOTICES:",
        noticeList || "No notices posted.",
        ""
    ].join("\n");
}

// Send Chat Message
async function sendMessage() {
    var input = document.getElementById("userInput");
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    // Display user message
    appendMessage(text, "user");
    input.value = "";

    // Display bot thinking placeholder
    var thinkingDiv = appendThinkingMessage();

    var apiKey = getGeminiApiKey();
    var model = getGeminiModel();

    if (apiKey) {
        // Call Gemini REST API
        try {
            var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey);
            var systemPrompt = [
                "You are CampusAI, a friendly, intelligent, and accurate student help desk assistant for college students.",
                "The student's name is Devanshi Goyal.",
                "Answer student questions using the live campus data provided below.",
                "If the information is not present, be honest, polite, and suggest checking with the college admin portal.",
                "Keep answers well-structured, clear, friendly, and formatted with bullet points when listing items.",
                "",
                buildCampusContext()
            ].join("\n");

            var payload = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: systemPrompt + "\n\nSTUDENT QUESTION: " + text }]
                    }
                ],
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 600
                }
            };

            var response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            var data = await response.json();

            if (!response.ok || data.error) {
                var errDesc = (data.error && data.error.message) ? data.error.message : "API request failed";
                removeMessage(thinkingDiv);
                appendMessage("⚠️ **Gemini API Error:** " + errDesc + "\n\n*Falling back to Smart Campus Assistant:*", "bot");
                var fallbackAns = getSmartAnswer(text);
                appendMessage(fallbackAns, "bot");
                return;
            }

            var aiResponse = "";
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                aiResponse = data.candidates[0].content.parts.map(function (p) { return p.text; }).join("\n");
            }

            removeMessage(thinkingDiv);
            appendMessage(aiResponse || "I didn't receive an answer. Please try rephrasing your question.", "bot");

        } catch (err) {
            removeMessage(thinkingDiv);
            appendMessage("⚠️ *Network error connecting to Gemini API. Showing campus info instead:*", "bot");
            var smartAns = getSmartAnswer(text);
            appendMessage(smartAns, "bot");
        }

    } else {
        // Built-in Smart Campus Assistant fallback
        setTimeout(function () {
            removeMessage(thinkingDiv);
            var answer = getSmartAnswer(text);
            appendMessage(answer, "bot");
        }, 350);
    }
}

// Built-in smart answer engine
function getSmartAnswer(message) {
    var lower = message.toLowerCase();

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("kaise")) {
        return "Hello Devanshi! 👋 Welcome to CampusAI. I can help you check your assignments, deadlines, class timetable, and college notices. How can I assist you right now?";
    }

    if (lower.includes("assignment") || lower.includes("homework") || lower.includes("task") || lower.includes("project")) {
        var pending = assignments.filter(function (a) { return !a.completed; });
        if (pending.length === 0) {
            return "🎉 Fantastic news! You have no pending assignments right now. All caught up!";
        }
        var list = pending.map(function (a) {
            var status = getDueStatus(a.date, false);
            return "• **" + a.name + "** (" + a.subject + ") — Due: " + a.date + " *" + status.text + "*";
        }).join("\n");
        return "Here are your currently pending assignments:\n\n" + list + "\n\nYou can also click on the **📝 Assignments** tab to mark them complete or add them directly to your Google Calendar!";
    }

    if (lower.includes("timetable") || lower.includes("class") || lower.includes("lecture") || lower.includes("schedule")) {
        var todayName = getTodayName();
        var todayClasses = timetable[todayName] || [];
        var classStr = todayClasses.map(function (c) {
            return "• **" + c.time + "**: " + c.subject + " (" + c.room + ")";
        }).join("\n");
        return "Here is your class schedule for today (" + todayName + "):\n\n" + classStr + "\n\nYou can view the full weekly schedule by heading over to the **⏱️ Timetable** section!";
    }

    if (lower.includes("notice") || lower.includes("announcement") || lower.includes("update") || lower.includes("news")) {
        var noticeStr = notices.map(function (n) {
            return "• **" + n.title + "** (" + n.date + ")\n  " + n.content;
        }).join("\n\n");
        return "Here are the latest college notices:\n\n" + noticeStr;
    }

    if (lower.includes("exam") || lower.includes("test") || lower.includes("midsem")) {
        return "📝 **Examination Notice:** The mid-semester internal examination datesheet has been announced starting 15th October. Please verify your subjects and seating arrangement on the college portal.";
    }

    if (lower.includes("hackathon") || lower.includes("event") || lower.includes("competition")) {
        return "🚀 **Hackathon Alert:** Registrations are officially open for the Annual Campus AI & Web Hackathon! Form teams of 2-4 and register via the Notices tab.";
    }

    if (lower.includes("cse") || lower.includes("computer science")) {
        return "CampusAI is tailored for Computer Science and Engineering students! You can track subjects like Data Structures, DBMS, Computer Networks, Operating Systems, and Web Development right here.";
    }

    return "I am here to help you with college info! You can ask me about:\n• Pending assignments and due dates\n• Today's classes and room numbers\n• Latest college notices and announcements\n• Mid-semester exams & hackathons\n\n*(💡 Tip: Click **⚙️ AI API** to connect your free Google Gemini API key for open-ended conversational intelligence!)*";
}

// Append a message to the chat
function appendMessage(text, type) {
    var chatBox = document.getElementById("chatMessages");
    if (!chatBox) return null;

    var div = document.createElement("div");
    div.className = "message " + type;

    var author = type === "bot" ? "CampusAI" : "You";
    var formattedText = formatChatMessage(text);

    div.innerHTML = "<b>" + author + "</b>" + formattedText;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

// Append animated thinking indicator
function appendThinkingMessage() {
    var chatBox = document.getElementById("chatMessages");
    if (!chatBox) return null;

    var div = document.createElement("div");
    div.className = "message bot thinking-msg";
    div.innerHTML = "<b>CampusAI</b><div class='thinking-dots'><span></span><span></span><span></span></div>";
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

// Remove element helper
function removeMessage(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

// Reset / Clear chat
function clearChat() {
    var chatBox = document.getElementById("chatMessages");
    if (!chatBox) return;

    chatBox.innerHTML = [
        '<div class="message bot">',
        '  <b>CampusAI</b>',
        '  <p>Hello Devanshi! 👋 Chat history cleared. How can I help you today?</p>',
        '</div>'
    ].join("");
    showToast("Chat cleared.", "info");
}

// Handle Enter key in chat input
function checkEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Convert markdown-like syntax to HTML safely
function formatChatMessage(text) {
    if (!text) return "";
    var lines = text.split("\n");
    var html = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) {
            html.push("<br>");
            continue;
        }

        // Bold formatting
        var formatted = escapeHtml(line)
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            .replace(/\*(.*?)\*/g, "<i>$1</i>");

        // Bullet point
        if (formatted.startsWith("• ") || formatted.startsWith("- ") || formatted.startsWith("* ")) {
            html.push("<p class='chat-bullet'>" + formatted + "</p>");
        } else {
            html.push("<p>" + formatted + "</p>");
        }
    }

    return html.join("");
}


/* --------------------------------------------------------------------------
   UTILITY & TOAST FUNCTIONS
   -------------------------------------------------------------------------- */

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Toast notification
var toastTimeout = null;
function showToast(message, type) {
    var toast = document.getElementById("toast");
    if (!toast) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    toast.innerText = message;
    toast.className = "toast show " + (type || "info");

    toastTimeout = setTimeout(function () {
        toast.className = "toast";
    }, 3200);
}


/* --------------------------------------------------------------------------
   APPLICATION BOOTSTRAP
   -------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
    // 1. Initial display
    displayAssignments();
    displayNotices();

    // 2. Timetable defaults to today
    var today = getTodayName();
    showDay(today);

    // 3. Update dashboard counters and notices
    updateDashboard();

    // 4. Update Gemini AI status
    updateAiStatusIndicator();

    // 5. Close popups on backdrop click
    window.onclick = function (event) {
        var asgnPopup = document.getElementById("assignmentPopup");
        var aiPopup = document.getElementById("aiSettingsPopup");
        if (event.target === asgnPopup) closeAssignmentPopup();
        if (event.target === aiPopup) closeAiSettings();
    };

    // 6. Close popup on Escape key
    window.onkeydown = function (event) {
        if (event.key === "Escape") {
            closeAssignmentPopup();
            closeAiSettings();
        }
    };
});
