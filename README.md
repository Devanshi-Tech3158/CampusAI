# 🎓 CampusAI - Student Help Desk & College Portal

CampusAI is an intelligent web-based student help desk and academic productivity portal designed to keep important college information, coursework deadlines, notices, and timetables in one unified place.

It combines an **Assignments Tracker** with **Google Calendar integration**, an **AI Help Desk powered by Google Gemini**, **College Notices**, and a **Weekly Class Timetable**.

---

## ✨ Features

- 🏠 **Smart Student Dashboard**: Real-time counter cards for pending assignments, notices, and today's classes with instant deadline updates.
- 📝 **Assignments Tracker**:
  - Add new assignments with subject, title, notes, and due dates.
  - Due status badges: 🔴 *Overdue*, 🟠 *Due Today / Tomorrow*, 🟢 *Due in X days*, ✅ *Completed*.
  - Filter tabs: **All**, **Pending**, and **Completed**.
  - **Mark as Done / Pending** toggle.
  - **📅 One-Click Google Calendar Sync**: Automatically prepares a calendar event with assignment title and deadline.
  - **📥 .ics File Download**: Works offline with Apple Calendar, Outlook, and Google Calendar.
  - LocalStorage persistence (works seamlessly offline and across reloads).
- 💬 **Ask CampusAI (Gemini AI & Smart Campus Mode)**:
  - **Google Gemini API Integration** (Gemini 2.0 Flash / 1.5 Flash): Real-time conversational AI answering college questions using live campus context.
  - In-browser **⚙️ AI API Settings** modal to enter, test, and save your free Gemini API key.
  - **Smart Campus Assistant Fallback**: Works out-of-the-box even without an API key!
- 📢 **College Notices**:
  - Live search filter to find announcements by keyword or category.
  - Tagged categories (Academic, Events, Exams).
- ⏱️ **Class Timetable**:
  - Monday to Friday schedule with subject, timings, and classroom/lab locations.
  - Auto-selects today's day of the week on page load.
- 📱 **Modern & Responsive UI**: Clean navy-blue theme, accessible cards, modal popups, and smooth toast notifications.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic layout, accessible inputs, and modal dialogs.
- **CSS3**: Modern Flexbox, CSS Grid, custom properties, animations, and responsive media queries.
- **JavaScript (ES6+)**: DOM manipulation, LocalStorage persistence, asynchronous REST fetch, calendar web intents, and dynamic .ics file generation.
- **Google Gemini REST API**: Real-time generative AI assistance.
- **Google Calendar Web Intent API**: One-click calendar event scheduling.

---

## 📂 Project Structure

```text
CampusAI/
├── index.html          # Main HTML5 application structure & modals
├── style.css           # Modern styles, animations, responsive design
├── script.js           # Core application logic, assignments, timetable, Gemini AI
├── integrations.js     # Cloud sync and Firebase integrations
├── firebase-config.js  # Optional Firebase project configuration
├── CampusAI-Preview.png# Application screenshot preview
└── README.md           # Project documentation
```

---

## 🚀 How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/devanshi-tech3158/CampusAI.git
   ```
2. Open the `CampusAI` directory in Visual Studio Code.
3. Open `index.html` in your browser (or use the VS Code *Live Server* extension).

---

## ⚙️ How to Connect Google Gemini API

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open CampusAI in your browser.
3. Click on **⚙️ AI API** (in the chat header or sidebar).
4. Paste your API key, select **Gemini 2.0 Flash**, and click **Save & Test Connection**.
5. Your status will switch to `🟢 Gemini 2.0 Connected`!

---

## 🌐 Live Demo

👉 [**Click here to visit CampusAI Live**](https://devanshi-tech3158.github.io/CampusAI/)

---

## 👩‍💻 Developed By

**Devanshi Goyal**  
GitHub: [@Devanshi-Tech3158](https://github.com/devanshi-tech3158)

⭐ If you find this project useful, feel free to star the repository!
