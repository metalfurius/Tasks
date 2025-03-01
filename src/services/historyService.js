// src/services/historyService.js
import { RateLimiter } from './rateLimiter.js';
import { Validator } from '../utils/validation.js';
import { db } from './firebase.js';
import authService from './authService.js';
import ToastService from './toastService.js';
import {
    collection, addDoc, query, where, onSnapshot,
    orderBy, writeBatch, getDocs, limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const MAX_HISTORY_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_HISTORY_ITEMS = 1000;

const historyService = {
    historyItems: [],
    unsubscribe: null,
    observers: [],

    init() {
        authService.onAuthStateChanged(async user => {
            if (user) {
                this.loadHistory();
                try {
                    await this.scheduleCleanup();
                } catch (error) {
                    console.error('Failed to schedule cleanup:', error);
                    ToastService.error('Failed to schedule history cleanup');
                }
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
    async scheduleCleanup() {
        // Run cleanup once a day
        setInterval(async () => {
            try {
                await this.cleanupOldHistory();
            } catch (error) {
                console.error('Scheduled history cleanup failed:', error);
                ToastService.error('Scheduled history cleanup failed');
            }
        }, 24 * 60 * 60 * 1000);
    },

    async cleanupOldHistory() {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        try {
            const cutoffDate = new Date(Date.now() - MAX_HISTORY_AGE);
            const q = query(
                collection(db, 'history'),
                where('userId', '==', userId),
                where('timestamp', '<=', cutoffDate)
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            ToastService.info('History cleanup completed');
        } catch (error) {
            console.error('Error cleaning up history:', error);
            ToastService.error('Failed to cleanup history');
        }
    },

    async logAction(action, taskText) {
        const userId = authService.getCurrentUserId();
        if (!userId) throw new Error("Authentication required");

        try {
            RateLimiter.checkLimit('logHistory', userId);

            const historyData = {
                action,
                taskText,
                userId,
                timestamp: new Date()
            };

            Validator.history(historyData);
            await addDoc(collection(db, 'history'), historyData);
        } catch (error) {
            console.error('Error logging action:', error);
            ToastService.error('Failed to log action');
            throw error;
        }
    },

    loadHistory() {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        try {
            const q = query(
                collection(db, 'history'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(MAX_HISTORY_ITEMS)
            );

            if (this.unsubscribe) {
                this.unsubscribe();
            }

            this.unsubscribe = onSnapshot(q, (snapshot) => {
                this.historyItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.notifyObservers();
            }, (error) => {
                console.error('History query error:', error);
                ToastService.error('Failed to load history');
            });
        } catch (error) {
            console.error('Error loading history:', error);
            ToastService.error('Failed to load history');
        }
    },

    onHistoryChanged(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    notifyObservers() {
        this.observers.forEach(callback => callback(this.historyItems));
    }
};

historyService.init();
export default historyService;