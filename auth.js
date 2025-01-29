// auth.js
import { auth } from './firebase.js';

export const initAuth = () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

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

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
};
// firebase.js
const db = firebase.firestore();
export { auth, db };
