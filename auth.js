// auth.js
import { auth } from './firebase.js';
import * as firebase from "./firebase";

export const initAuth = () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const authActionBtn = document.getElementById('authActionBtn');
    const authActionText = document.getElementById('authActionText');
    const toggleAuthMode = document.getElementById('toggleAuthMode');

    let isRegisterMode = false;

    const updateAuthUI = () => {
        if (isRegisterMode) {
            authActionText.textContent = 'Register';
            toggleAuthMode.innerHTML = '<strong>Login</strong>';
            document.querySelector('label[for="password"]').textContent = 'Create Password';
        } else {
            authActionText.textContent = 'Login';
            toggleAuthMode.innerHTML = '<strong>Register</strong>';
            document.querySelector('label[for="password"]').textContent = 'Password';
        }
        M.updateTextFields();
    };


    // Manejar el cambio de modo
    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        updateAuthUI();
        passwordInput.value = '';
    });
    
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
            M.toast({html: 'Please enter a valid email', classes: 'orange'});
            return;
        }
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            if (isRegisterMode) {
                // Registrar usuario
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.sendEmailVerification();
                M.toast({html: 'A verification email has been sent! Check your tray.', classes: 'green'});

            }
            else {
                await auth.signInWithEmailAndPassword(email, password);
            }
            // Save only the successful email (never save passwords)
            localStorage.setItem('lastEmail', email);
        } catch (error) {
            let message = '';
            switch (error.code) {
                case 'auth/invalid-email':
                    message = 'Invalid email';
                    break;
                case 'auth/user-not-found':
                    message = 'User not found';
                    localStorage.removeItem('lastEmail'); // Clear obsolete email
                    break;
                case 'auth/wrong-password':
                    message = 'Wrong password';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Email already in use';
                    break;
                case 'auth/weak-password':
                    message = 'Weak password (6 characters or more)';
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
        emailInput.value = '';  // <-- Clear email
        passwordInput.value = ''; // <-- Clear password
    });

    const resendVerificationBtn = document.getElementById('resendVerificationBtn');
    const cancelVerificationBtn = document.getElementById('cancelVerificationBtn');

    resendVerificationBtn.addEventListener('click', async () => {
        try {
            await auth.currentUser.sendEmailVerification();
            M.toast({html: 'Email sent! Check your inbox.', classes: 'green'});
        } catch (error) {
            M.toast({html: `Error: ${error.message}`, classes: 'red'});
        }
    });

    cancelVerificationBtn.addEventListener('click', () => {
        auth.signOut();
        verificationMessage.style.display = 'none';
        loginForm.style.display = 'block';
    });
};