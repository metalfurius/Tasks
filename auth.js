// auth.js
import { auth } from './firebase.js';

export const initAuth = () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    
    emailInput.value = localStorage.getItem('lastEmail') || '';
    if (emailInput.value) {
        passwordInput.focus();
    }
    // Si el usuario borra manualmente el email
    emailInput.addEventListener('input', () => {
        if (!emailInput.value) {
            localStorage.removeItem('lastEmail');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!emailInput.checkValidity()) {
            M.toast({html: 'Por favor ingresa un email válido', classes: 'orange'});
            return;
        }
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Guardar solo el email exitoso (nunca guardes contraseñas)
            localStorage.setItem('lastEmail', email);
        } catch (error) {
            let message = '';
            switch (error.code) {
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/user-not-found':
                    message = 'Usuario no registrado';
                    localStorage.removeItem('lastEmail'); // Limpia email obsoleto
                    break;
                case 'auth/wrong-password':
                    message = 'Contraseña incorrecta';
                    break;
                default:
                    message = error.message;
            }
            M.toast({html: `Error: ${message}`, classes: 'red'});
            passwordInput.value = '';
        }
    });

    // Login con Google
    googleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const provider = new firebase.auth.GoogleAuthProvider();

        try {
            await auth.signInWithPopup(provider);
            localStorage.setItem('lastEmail', auth.currentUser.email);
        } catch (error) {
            M.toast({html: `Error: ${error.message}`, classes: 'red'});
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
        document.getElementById('password').value = '';
    });
};