// CampusAI Integrations (Optional Cloud Sync & Google Auth)
// Runs alongside script.js. Safely uses LocalStorage if Firebase is not yet configured.

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

async function initOptionalFirebase() {
  if (!isFirebaseConfigured()) {
    console.info("ℹ️ CampusAI: Running in client-side LocalStorage mode. To enable multi-device Firebase cloud sync, add your credentials in firebase-config.js.");
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
      await import("https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js");
    const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let currentUser = null;

    // Inject Firebase Sign-in Button into sidebar
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      const authWrap = document.createElement("div");
      authWrap.style.cssText = "margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 13px;";
      authWrap.innerHTML = `
        <p id="cloudAuthStatus" class="small-text" style="margin-bottom:8px;">Cloud Sync: Not signed in</p>
        <button id="cloudAuthBtn" class="menu-btn" style="border: 1px solid rgba(255,255,255,0.25); text-align: center;">
          🔐 Sign in with Google
        </button>
      `;
      sidebar.appendChild(authWrap);

      const authBtn = document.getElementById("cloudAuthBtn");
      const authStatus = document.getElementById("cloudAuthStatus");

      authBtn.onclick = async () => {
        if (currentUser) {
          await signOut(auth);
        } else {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        }
      };

      onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
          authStatus.textContent = `Sync: ${user.displayName || user.email}`;
          authBtn.textContent = "🚪 Sign out";
          // Sync with Firestore
          await syncWithFirestore(db, user);
        } else {
          authStatus.textContent = "Cloud Sync: Not signed in";
          authBtn.textContent = "🔐 Sign in with Google";
        }
      });
    }

    async function syncWithFirestore(firestore, user) {
      try {
        const colRef = collection(firestore, "users", user.uid, "assignments");
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const cloudItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (cloudItems.length > 0 && typeof window.assignments !== "undefined") {
            window.assignments = cloudItems;
            if (typeof window.saveAssignments === "function") window.saveAssignments();
            if (typeof window.displayAssignments === "function") window.displayAssignments();
          }
        }
      } catch (err) {
        console.warn("Firestore sync warning:", err);
      }
    }

  } catch (error) {
    console.warn("Firebase initialization skipped:", error.message);
  }
}

// Initialize safely
initOptionalFirebase();
