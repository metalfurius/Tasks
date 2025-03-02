// src/services/historyService.js
import { RateLimiter } from './rateLimiter.js';
import { Validator } from '../utils/validation.js';
import { db } from './firebase.js';
import authService from './authService.js';
import ToastService from './toastService.js';
import {
    collection, addDoc, query, where, onSnapshot,
    orderBy, writeBatch, getDocs, limit, startAfter
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const PAGE_SIZE = 20;
let lastDoc = null;
const MAX_HISTORY_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
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

    async cleanupOldHistory(clearAll = false) {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        try {
            // If clearAll is true, don't use the cutoff date
            const cutoffDate = clearAll ? new Date(Date.now() + 1000) : new Date(Date.now() - MAX_HISTORY_AGE);
            const batchSize = 500;
            let totalDeleted = 0;

            while (true) {
                const q = query(
                    collection(db, 'history'),
                    where('userId', '==', userId),
                    where('timestamp', '<=', cutoffDate),
                    limit(batchSize)
                );

                const snapshot = await getDocs(q);
                if (snapshot.empty) break;

                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    totalDeleted++;
                });

                await batch.commit();

                if (snapshot.docs.length < batchSize) break;
            }

            if (totalDeleted > 0) {
                ToastService.info(`Cleaned up ${totalDeleted} history items`);
            }

            // Refresh history after clearing
            this.loadHistory();
        } catch (error) {
            console.error('Error cleaning up history:', error);
            ToastService.error('Failed to cleanup history');
            throw error;
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
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const q = query(
                collection(db, 'history'),
                where('userId', '==', userId),
                where('timestamp', '>=', thirtyDaysAgo),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // Usar getDocsFromCache primero
            this.unsubscribe = onSnapshot(q, {
                includeMetadataChanges: true,
                source: 'cache' // Priorizar cache
            }, async (snapshot) => {
                if (snapshot.empty && !snapshot.metadata.fromCache) {
                    // Solo buscar en servidor si cache está vacío
                    const serverSnapshot = await getDocs(q);
                    this.historyItems = serverSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    this.notifyObservers();
                } else if (!snapshot.metadata.hasPendingWrites) {
                    this.historyItems = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    this.notifyObservers();
                }
            });
        } catch (error) {
            console.error('Error loading history:', error);
            ToastService.error('Failed to load history');
        }
    },
    async loadMoreHistory() {
        const userId = authService.getCurrentUserId();
        if (!userId || this.loading) return;

        this.loading = true;
        try {
            let q = query(
                collection(db, 'history'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            const newItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.historyItems = [...this.historyItems, ...newItems];
            this.notifyObservers();
        } catch (error) {
            console.error('Error loading more history:', error);
            ToastService.error('Failed to load more history');
        } finally {
            this.loading = false;
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