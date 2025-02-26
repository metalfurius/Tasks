// src/services/historyService.js
import { db } from './firebase.js';
import authService from './authService.js';
import {
    collection, addDoc, query, where, onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// History service object
const historyService = {
    // History items
    historyItems: [],

    // Snapshot unsubscribe function
    unsubscribe: null,

    // History observers
    observers: [],

    // Initialize history
    init() {
        authService.onAuthStateChanged(user => {
            if (user) {
                this.loadHistory();
            } else {
                if (this.unsubscribe) {
                    this.unsubscribe();
                    this.unsubscribe = null;
                }
                this.historyItems = [];
                this.notifyObservers();
            }
        });
    },

    // Add history observer
    onHistoryChanged(callback) {
        this.observers.push(callback);
        // Return unsubscribe function
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    // Notify all observers
    notifyObservers() {
        this.observers.forEach(callback => callback(this.historyItems));
    },

    // Load history from Firebase
    loadHistory() {
        try {
            const userId = authService.getCurrentUserId();
            if (!userId) return;

            const q = query(
                collection(db, 'history'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            // Unsubscribe from previous listener
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // Set up new listener
            this.unsubscribe = onSnapshot(q, (snapshot) => {
                this.historyItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.notifyObservers();
            }, (error) => {
                console.error('History query error:', error);
            });
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    // Log action to history
    async logAction(action, taskText) {
        try {
            const userId = authService.getCurrentUserId();
            if (!userId) throw new Error("No authenticated user");

            await addDoc(collection(db, 'history'), {
                action,
                taskText,
                userId: userId,
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error logging history:', error);
            throw error;
        }
    }
};

// Initialize history service
historyService.init();

export default historyService;