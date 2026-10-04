// Paste your Firebase web app config here.
// Firebase Console -> Project settings -> Your apps -> Web app -> SDK setup and configuration.
// These values are NOT secrets (they identify your project). Security comes from
// Firestore rules + Authorized domains + App Check, not from hiding this file.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Gemini model used through Firebase AI Logic. Change if a newer one is available.
export const GEMINI_MODEL = "gemini-2.5-flash";
