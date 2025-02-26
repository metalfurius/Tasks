// src/services/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNEQqC00bAupyv6L_lDJDvvi8vDGU3rO0",
    authDomain: "tasks-dfce4.firebaseapp.com",
    projectId: "tasks-dfce4",
    storageBucket: "tasks-dfce4.firebasestorage.app",
    messagingSenderId: "1010889254813",
    appId: "1:1010889254813:web:"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };