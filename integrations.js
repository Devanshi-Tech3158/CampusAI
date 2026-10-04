// CampusAI integrations: Firebase (Auth + Firestore), Gemini (via Firebase AI Logic),
// Google Calendar. Loaded AFTER script.js, so it can wrap the existing global functions.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
  getAI, getGenerativeModel, GoogleAIBackend,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-ai.js";
import { firebaseConfig, GEMINI_MODEL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
let currentUser = null;
let calendarToken = null; // Google OAuth access token (lasts ~1 hour, kept in memory only)

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ------------------------------------------------------------------ */
/* 1. AUTH (Google sign-in via Firebase, also requests Calendar scope) */
/* ------------------------------------------------------------------ */
function makeProvider() {
  const p = new GoogleAuthProvider();
  p.addScope(CAL_SCOPE);
  return p;
}

async function login() {
  const result = await signInWithPopup(auth, makeProvider());
  calendarToken = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
}

// Calendar token is not persisted across reloads, so re-consent when needed.
async function ensureCalendarToken() {
  if (!calendarToken) await login();
  return calendarToken;
}

function injectAuthButton() {
  const sidebar = document.querySelector(".sidebar");
  const wrap = document.createElement("div");
  wrap.style.cssText = "margin-top:20px;font-size:13px;";
  wrap.innerHTML = `<p id="authStatus" class="small-text">Not signed in</p>
    <button id="authBtn" class="menu-btn">🔐 Sign in with Google</button>`;
  sidebar.appendChild(wrap);
  $("authBtn").onclick = () => (currentUser ? signOut(auth) : login().catch(showError));
}

function showError(e) {
  console.error(e);
  alert(e?.message || "Something went wrong. Check the browser console.");
}

/* ------------------------------------------------------------------ */
/* 2. ASSIGNMENTS <-> FIRESTORE                                        */
/* ------------------------------------------------------------------ */
// users/{uid}/assignments/{id} = { title, description, due: "YYYY-MM-DD" }
const assignmentsCol = () => collection(db, "users", currentUser.uid, "assignments");

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function readAssignment(el) {
  const ps = el.querySelectorAll("p");
  const dueText = (ps[1]?.textContent || "").replace(/^\s*Due:\s*/i, "").trim();
  const parsed = new Date(dueText + " 12:00");
  return {
    title: el.querySelector("h3")?.textContent.trim() || "",
    description: ps[0]?.textContent.trim() || "",
    due: isNaN(parsed) ? "" : toISO(parsed),
  };
}

function assignmentHTML(a, id) {
  return `<div class="assignment" data-id="${esc(id || "")}" data-due="${esc(a.due)}">
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.description)}</p>
    <p><b>Due:</b> ${esc(prettyDate(a.due))}</p>
    <button class="delete-btn" onclick="deleteAssignment(this)">Delete</button>
  </div>`;
}

// Adds the "Add to Google Calendar" button to an assignment card (once).
function decorate(el) {
  if (el.querySelector(".cal-btn")) return;
  const btn = document.createElement("button");
  btn.className = "cal-btn";
  btn.textContent = "📅 Add to Calendar";
  btn.style.cssText = "margin-left:8px;cursor:pointer;";
  btn.onclick = async () => {
    const a = readAssignment(el);
    try {
      btn.textContent = "Adding…";
      await createCalendarEvent(a);
      btn.textContent = "✅ Added";
    } catch (e) {
      btn.textContent = "📅 Add to Calendar";
      showError(e);
    }
  };
  el.appendChild(btn);
}
const decorateAll = () => document.querySelectorAll("#assignmentList .assignment").forEach(decorate);

async function syncAssignmentsOnLogin() {
  const snap = await getDocs(assignmentsCol());
  const list = $("assignmentList");
  if (snap.empty) {
    // First login: upload whatever is currently on the page.
    for (const el of list.querySelectorAll(".assignment")) {
      const a = readAssignment(el);
      if (!a.due) continue;
      const ref = await addDoc(assignmentsCol(), { ...a, createdAt: serverTimestamp() });
      el.dataset.id = ref.id;
    }
  } else {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.due.localeCompare(b.due));
    list.innerHTML = items.map((a) => assignmentHTML(a, a.id)).join("");
  }
  decorateAll();
}

// Wrap the existing functions from script.js (we don't replace them).
const origAdd = window.addAssignment;
window.addAssignment = function (...args) {
  const title = $("assignmentName")?.value.trim();
  const description = $("assignmentDescription")?.value.trim();
  const due = $("assignmentDate")?.value;
  const result = origAdd?.apply(this, args);
  if (!title || !due) return result;
  setTimeout(async () => {
    const el = [...document.querySelectorAll("#assignmentList .assignment")].find(
      (e) => !e.dataset.id && e.querySelector("h3")?.textContent.trim() === title
    );
    if (!el) return;
    el.dataset.due = due;
    decorate(el);
    if (!currentUser) return; // not signed in: stays in localStorage only
    try {
      const ref = await addDoc(assignmentsCol(), { title, description, due, createdAt: serverTimestamp() });
      el.dataset.id = ref.id;
    } catch (e) { console.error("Firestore save failed", e); }
  }, 0);
  return result;
};

const origDelete = window.deleteAssignment;
window.deleteAssignment = function (btn, ...rest) {
  const id = btn.closest(".assignment")?.dataset.id;
  const result = origDelete?.call(this, btn, ...rest);
  if (id && currentUser) deleteDoc(doc(db, "users", currentUser.uid, "assignments", id)).catch(console.error);
  return result;
};

/* ------------------------------------------------------------------ */
/* 3. GOOGLE CALENDAR (REST API, using the OAuth token from sign-in)    */
/* ------------------------------------------------------------------ */
async function createCalendarEvent({ title, description, due }) {
  if (!due) throw new Error("This assignment has no valid due date.");
  const token = await ensureCalendarToken();
  const [y, m, d] = due.split("-").map(Number);
  const endDate = toISO(new Date(y, m - 1, d + 1)); // all-day events end the next day (exclusive)
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: `📝 ${title} (due)`,
      description: description || "Added from CampusAI",
      start: { date: due },
      end: { date: endDate },
      // 900 min before midnight start = 9:00 AM the day before
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 900 }] },
    }),
  });
  if (res.status === 401) { calendarToken = null; throw new Error("Calendar session expired. Click again to re-authorize."); }
  if (!res.ok) throw new Error("Calendar error: " + (await res.text()));
  return res.json();
}

/* ------------------------------------------------------------------ */
/* 4. GEMINI CHAT (via Firebase AI Logic: no API key in your code)      */
/* ------------------------------------------------------------------ */
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, {
  model: GEMINI_MODEL,
  systemInstruction:
    "You are CampusAI, a friendly help desk assistant for a college student. " +
    "Answer using the campus data provided with each question. If the answer is not in the data, " +
    "say you don't have that information and suggest checking the college portal. Keep answers short.",
});
const chat = model.startChat();

// Build context from what's currently on the page.
function campusContext() {
  const notices = [...document.querySelectorAll("#noticeList .notice")].map((n) => {
    const t = n.querySelector("h3")?.textContent.trim();
    const b = n.querySelector("p")?.textContent.replace(/\s+/g, " ").trim();
    const s = n.querySelector("span")?.textContent.trim();
    return `- ${t}: ${b} (${s})`;
  });
  const assignments = [...document.querySelectorAll("#assignmentList .assignment")].map((e) => {
    const a = readAssignment(e);
    return `- ${a.title}: ${a.description} (due ${a.due})`;
  });
  const day = $("dayTitle")?.textContent.trim();
  const classes = [...document.querySelectorAll("#timetableList .class-item")].map(
    (c) => `- ${c.querySelector("h3")?.textContent.trim()}: ${c.querySelector("p")?.textContent.trim()}`
  );
  return `Today: ${new Date().toDateString()}\nNOTICES:\n${notices.join("\n")}\nASSIGNMENTS:\n${assignments.join("\n")}\nTIMETABLE (${day}):\n${classes.join("\n")}`;
}

function addMessage(who, text) {
  const box = $("chatMessages");
  const div = document.createElement("div");
  div.className = `message ${who === "bot" ? "bot" : "user"}`;
  div.innerHTML = `<b>${who === "bot" ? "CampusAI" : "You"}</b><p></p>`;
  div.querySelector("p").textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

const origSend = window.sendMessage; // your keyword-based replies stay as the fallback
window.sendMessage = async function () {
  const input = $("userInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  const userMsg = addMessage("user", text);
  const botMsg = addMessage("bot", "Thinking…");
  try {
    const result = await chat.sendMessage(`CAMPUS DATA:\n${campusContext()}\n\nSTUDENT QUESTION: ${text}`);
    botMsg.querySelector("p").textContent = result.response.text();
  } catch (e) {
    console.error("Gemini failed, using built-in replies", e);
    userMsg.remove(); botMsg.remove();
    input.value = text;
    origSend?.();
  }
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
};

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
injectAuthButton();
decorateAll();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  $("authStatus").textContent = user ? `Signed in: ${user.displayName || user.email}` : "Not signed in";
  $("authBtn").textContent = user ? "🚪 Sign out" : "🔐 Sign in with Google";
  if (!user) calendarToken = null;
  else await syncAssignmentsOnLogin().catch(console.error);
});
