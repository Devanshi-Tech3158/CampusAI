/* -------------------------------
   PAGE CHANGE
-------------------------------- */

function showPage(pageName) {

    var pages = document.querySelectorAll(".page");

    pages.forEach(function(page) {
        page.classList.add("hidden");
    });

    document.getElementById(pageName).classList.remove("hidden");

    var buttons = document.querySelectorAll(".menu-btn");

    buttons.forEach(function(button) {
        button.classList.remove("active");
    });

    if (pageName == "home") {
        buttons[0].classList.add("active");
    }

    if (pageName == "chat") {
        buttons[1].classList.add("active");
    }

    if (pageName == "notices") {
        buttons[2].classList.add("active");
    }

    if (pageName == "assignments") {
        buttons[3].classList.add("active");
    }

    if (pageName == "timetable") {
        buttons[4].classList.add("active");
    }
}


/* -------------------------------
   CAMPUS AI CHAT
-------------------------------- */

function sendMessage() {

    var input = document.getElementById("userMessage");
    var message = input.value.trim();

    if (message == "") {
        return;
    }

    addMessage(message, "user");

    var answer = getAnswer(message);

    setTimeout(function() {
        addMessage(answer, "bot");
    }, 400);

    input.value = "";
}


function addMessage(message, type) {

    var chat = document.getElementById("chatMessages");

    var div = document.createElement("div");

    div.className = "message " + type;

    if (type == "bot") {
        div.innerHTML = "<b>CampusAI</b><p>" + message + "</p>";
    } else {
        div.innerHTML = "<p>" + message + "</p>";
    }

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


function getAnswer(message) {

    message = message.toLowerCase();

    if (
        message.includes("hello") ||
        message.includes("hi") ||
        message.includes("hey")
    ) {
        return "Hello! How can I help you today?";
    }

    if (
        message.includes("assignment") ||
        message.includes("homework")
    ) {
        return "You can check your pending assignments from the Assignments section.";
    }

    if (
        message.includes("timetable") ||
        message.includes("class") ||
        message.includes("lecture")
    ) {
        return "You can check your weekly class timetable from the Timetable section.";
    }

    if (
        message.includes("notice") ||
        message.includes("announcement")
    ) {
        return "You can find the latest college announcements in the Notices section.";
    }

    if (
        message.includes("exam") ||
        message.includes("test")
    ) {
        return "The internal examination timetable will be announced by the college.";
    }

    if (
        message.includes("hackathon")
    ) {
        return "You can check the Notices section for hackathon registration and event updates.";
    }

    if (
        message.includes("cse") ||
        message.includes("computer")
    ) {
        return "CSE students can use CampusAI to check assignments, notices and their timetable.";
    }

    return "I am still learning. Try asking me about assignments, timetable, notices or exams.";
}


function checkEnter(event) {

    if (event.key == "Enter") {
        sendMessage();
    }
}


/* -------------------------------
   NOTICES SEARCH
-------------------------------- */

function searchNotice() {

    var input = document.getElementById("noticeSearch");
    var searchText = input.value.toLowerCase();

    var notices = document.querySelectorAll(".notice");

    notices.forEach(function(notice) {

        var text = notice.innerText.toLowerCase();

        if (text.includes(searchText)) {
            notice.style.display = "block";
        } else {
            notice.style.display = "none";
        }

    });
}


/* -------------------------------
   ASSIGNMENTS
-------------------------------- */

var assignments = JSON.parse(
    localStorage.getItem("campusAssignments")
) || [
    {
        subject: "Database Management",
        name: "ER Diagram Assignment",
        date: "2026-09-26"
    },
    {
        subject: "Data Structures",
        name: "Stack and Queue Questions",
        date: "2026-09-28"
    }
];


function displayAssignments() {

    var list = document.getElementById("assignmentList");

    list.innerHTML = "";

    assignments.forEach(function(assignment, index) {

        var div = document.createElement("div");

        div.className = "assignment";

        div.innerHTML =
            "<h3>" + assignment.name + "</h3>" +
            "<p><b>Subject:</b> " + assignment.subject + "</p>" +
            "<p><b>Due Date:</b> " + assignment.date + "</p>" +
            "<button class='delete-btn' onclick='deleteAssignment(" + index + ")'>Delete</button>";

        list.appendChild(div);
    });

    document.getElementById("assignmentCount").innerText =
        assignments.length;
}


function openAssignmentBox() {

    document.getElementById("assignmentPopup").style.display = "flex";
}


function closeAssignmentBox() {

    document.getElementById("assignmentPopup").style.display = "none";
}


function addAssignment() {

    var subject = document.getElementById("subject").value;
    var name = document.getElementById("assignmentName").value;
    var date = document.getElementById("dueDate").value;

    if (subject == "" || name == "" || date == "") {
        alert("Please fill all the details.");
        return;
    }

    assignments.push({
        subject: subject,
        name: name,
        date: date
    });

    localStorage.setItem(
        "campusAssignments",
        JSON.stringify(assignments)
    );

    document.getElementById("subject").value = "";
    document.getElementById("assignmentName").value = "";
    document.getElementById("dueDate").value = "";

    closeAssignmentBox();

    displayAssignments();
}


function deleteAssignment(index) {

    assignments.splice(index, 1);

    localStorage.setItem(
        "campusAssignments",
        JSON.stringify(assignments)
    );

    displayAssignments();
}


/* -------------------------------
   TIMETABLE
-------------------------------- */

var timetable = {

    Monday: [
        ["09:00 AM", "Data Structures"],
        ["10:00 AM", "Database Management"],
        ["11:00 AM", "Mathematics"],
        ["01:00 PM", "Computer Networks"]
    ],

    Tuesday: [
        ["09:00 AM", "Operating System"],
        ["10:00 AM", "Data Structures"],
        ["11:00 AM", "Web Development"],
        ["01:00 PM", "Database Management"]
    ],

    Wednesday: [
        ["09:00 AM", "Computer Networks"],
        ["10:00 AM", "Mathematics"],
        ["11:00 AM", "Operating System"],
        ["01:00 PM", "Web Development"]
    ],

    Thursday: [
        ["09:00 AM", "Database Management"],
        ["10:00 AM", "Data Structures"],
        ["11:00 AM", "Computer Networks"],
        ["01:00 PM", "Mathematics"]
    ],

    Friday: [
        ["09:00 AM", "Web Development"],
        ["10:00 AM", "Operating System"],
        ["11:00 AM", "Data Structures"],
        ["01:00 PM", "Computer Networks"]
    ]

};


function showDay(day) {

    document.getElementById("dayTitle").innerHTML =
        "<h2>" + day + "</h2>";

    var list = document.getElementById("classList");

    list.innerHTML = "";

    timetable[day].forEach(function(item) {

        var div = document.createElement("div");

        div.className = "class-item";

        div.innerHTML =
            "<h3>" + item[1] + "</h3>" +
            "<p>" + item[0] + "</p>";

        list.appendChild(div);
    });
}


/* -------------------------------
   START
-------------------------------- */

displayAssignments();

showDay("Monday");

var assignments = JSON.parse(
    localStorage.getItem("campusAssignments")
) || [
    {
        subject: "Database Management",
        name: "ER Diagram and SQL Queries",
        date: "2026-09-30"
    },
    {
        subject: "Data Structures",
        name: "Stack and Queue Implementation",
        date: "2026-10-02"
    },
    {
        subject: "Computer Networks",
        name: "OSI Model and Network Devices",
        date: "2026-10-05"
    }
];