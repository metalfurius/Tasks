import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const authContainer = document.getElementById('auth-container');
const tasksContainer = document.getElementById('tasks-container');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

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

// Login handler
authForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    } catch (error) {
        alert(error.message);
    }
});

// Signup handler
signupBtn.addEventListener('click', async () => {
    try {
        await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    } catch (error) {
        alert(error.message);
    }
});

// Logout handler
logoutBtn.addEventListener('click', () => auth.signOut());