// Optional Firebase Configuration for CampusAI
// If you want to sync assignments across multiple devices with Firebase Firestore:
// 1. Create a project at https://console.firebase.google.com/
// 2. Go to Project Settings -> General -> Your apps -> Web app
// 3. Paste your configuration details below.
// If you leave them as "YOUR_API_KEY", CampusAI will automatically and safely run
// using browser LocalStorage + Google Gemini REST API.

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};
