// auth.js
import { auth } from './firebase.js';

export const initAuth = () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    // Login con email/password
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            M.toast({html: `Error: ${error.message}`, classes: 'red'});
        }
    });

    // Login con Google
    googleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const provider = new firebase.auth.GoogleAuthProvider();

        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            M.toast({html: `Error: ${error.message}`, classes: 'red'});
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
};