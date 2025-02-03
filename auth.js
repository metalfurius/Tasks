import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const authContainer = document.getElementById('auth-container');
const tasksContainer = document.getElementById('tasks-container');
const googleSignInBtn = document.getElementById('google-signin-btn');
const logoutBtn = document.getElementById('logout-btn');

const provider = new GoogleAuthProvider();

// Handle auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.classList.add('hidden');
        tasksContainer.classList.remove('hidden');
    } else {
        authContainer.classList.remove('hidden');
        tasksContainer.classList.add('hidden');
    }
});

// Google Sign-In handler
googleSignInBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        alert(error.message);
    }
});

// Logout handler
logoutBtn.addEventListener('click', () => signOut(auth));