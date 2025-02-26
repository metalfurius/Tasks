// src/services/authService.js
import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

// Auth service object
const authService = {
    // Current user
    currentUser: null,

    // Auth state observers
    observers: [],

    // Initialize auth
    init() {
        auth.onAuthStateChanged(user => {
            this.currentUser = user;
            this.notifyObservers(user);
        });
    },

    // Add observer
    onAuthStateChanged(callback) {
        this.observers.push(callback);
        // Return unsubscribe function
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    // Notify all observers
    notifyObservers(user) {
        this.observers.forEach(callback => callback(user));
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            return await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    },

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
            throw error;
        }
    },

    // Get current user id
    getCurrentUserId() {
        return this.currentUser?.uid;
    }
};

// Initialize auth service
authService.init();

export default authService;