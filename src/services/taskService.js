// src/services/taskService.js
import { db } from './firebase.js?v=tasks-untrusted-content-rendering-v1';
import authService from './authService.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from './toastService.js?v=tasks-untrusted-content-rendering-v1';
import { RateLimiter } from './rateLimiter.js?v=tasks-untrusted-content-rendering-v1';
import { Validator } from '../utils/validation.js?v=tasks-untrusted-content-rendering-v1';
import {
    cloneTaskList, sortTaskList, mergeTaskList, removeTaskList, applySnapshotChanges
} from '../utils/taskState.js?v=tasks-untrusted-content-rendering-v1';
import {
    collection, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch, limit, startAfter, getDocs,
    serverTimestamp, Timestamp, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const TASKS_PER_PAGE = 5;
let lastPendingDoc = null;
let lastCompletedDoc = null;
let hasMorePending = true;
let hasMoreCompleted = true;
let isLoading = false;
let loadingPromise = null;
let authUnsubscribe = null;
let sessionId = 0;

// Task service object
const taskService = {
    tasks: [],
    unsubscribe: null,
    observers: [],
    activeUserId: null,

    init() {
        if (authUnsubscribe) return;

        authUnsubscribe = authService.onAuthStateChanged(user => {
            this.handleAuthStateChanged(user);
        });
    },

    async handleAuthStateChanged(user) {
        const currentSessionId = ++sessionId;
        this.activeUserId = user?.uid || null;
        this.stopListening();
        this.resetState();

        if (user) {
            await this.loadTasks(user.uid, currentSessionId);
        }

        if (currentSessionId === sessionId) {
            this.notifyObservers();
        }
    },

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    },

    resetState() {
        this.tasks = [];
        isLoading = false;
        loadingPromise = null;
        lastPendingDoc = null;
        lastCompletedDoc = null;
        hasMorePending = true;
        hasMoreCompleted = true;
    },

    isCurrentSession(userId, currentSessionId = sessionId) {
        return currentSessionId === sessionId && this.activeUserId === userId;
    },
// Add task observer
    onTasksChanged(callback) {
        this.observers.push(callback);
        // Return unsubscribe function
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    resetLocalState() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        this.tasks = [];
        isLoading = false;
        loadingPromise = null;
        lastPendingDoc = null;
        lastCompletedDoc = null;
        hasMorePending = true;
        hasMoreCompleted = true;
        this.notifyObservers();
    },

    async refresh() {
        this.resetLocalState();
        if (authService.getCurrentUserId()) {
            await this.loadTasks();
        }
        this.notifyObservers();
    },

    // Notify all observers
    notifyObservers(announcement = null) {
        this.observers.forEach(callback => callback(this.tasks, announcement));
    },

    snapshotState() {
        return cloneTaskList(this.tasks);
    },

    restoreState(snapshot, announcement = 'Task list restored after a failed save') {
        this.tasks = cloneTaskList(snapshot);
        this.notifyObservers(announcement);
    },

    sortTasks() {
        this.tasks = sortTaskList(this.tasks);
    },

    mergeTasks(incomingTasks) {
        this.tasks = mergeTaskList(this.tasks, incomingTasks);
    },

    removeTasks(taskIds) {
        this.tasks = removeTaskList(this.tasks, taskIds);
        this.notifyObservers();
    },

    // Load tasks from Firebase
    async loadTasks(userId = authService.getCurrentUserId(), currentSessionId = sessionId) {
        if (isLoading) return loadingPromise;

        if (!userId || !this.isCurrentSession(userId, currentSessionId)) return;

        let currentLoadingPromise = null;
        try {
            isLoading = true;
            currentLoadingPromise = (async () => {
                // Load initial paginated tasks
                await Promise.all([
                    this.loadPendingTasks(userId, currentSessionId),
                    this.loadCompletedTasks(userId, currentSessionId)
                ]);

                if (!this.isCurrentSession(userId, currentSessionId)) return;

                const q = query(
                    collection(db, 'tasks'),
                    where('userId', '==', userId)
                );

                this.unsubscribe = onSnapshot(
                    q,
                    snapshot => this.handleSnapshotChanges(snapshot, userId, currentSessionId),
                    error => {
                        if (!this.isCurrentSession(userId, currentSessionId)) return;
                        console.error('Error listening for task changes:', error);
                        ToastService.error('Live task updates are temporarily unavailable');
                    }
                );
            })();
            loadingPromise = currentLoadingPromise;

            await currentLoadingPromise;
        } catch (error) {
            console.error('Error loading tasks:', error);
            ToastService.error('Failed to load tasks');
        } finally {
            if (loadingPromise === currentLoadingPromise) {
                isLoading = false;
                loadingPromise = null;
            }
        }
    },

    // New helper method to handle snapshot changes
    handleSnapshotChanges(snapshot, userId = this.activeUserId, currentSessionId = sessionId) {
        if (!this.isCurrentSession(userId, currentSessionId)) return;

        const changes = snapshot.docChanges().map(change => ({
            type: change.type,
            id: change.doc.id,
            data: change.doc.data() || {}
        }));
        const result = applySnapshotChanges(this.tasks, changes, userId);
        this.tasks = result.tasks;

        if (result.changed) {
            this.notifyObservers();
        }
    },

    async loadPendingTasks(userId = authService.getCurrentUserId(), currentSessionId = sessionId) {
        if (!hasMorePending) return false;

        if (!userId || !this.isCurrentSession(userId, currentSessionId)) return false;

        try {
            let q = query(
                collection(db, 'tasks'),
                where('userId', '==', userId),
                where('completed', '==', false),
                orderBy('order', 'asc'),
                limit(TASKS_PER_PAGE)
            );

            if (lastPendingDoc) {
                q = query(q, startAfter(lastPendingDoc));
            }

            const snapshot = await getDocs(q);

            if (!this.isCurrentSession(userId, currentSessionId)) return false;

            // No more results
            if (snapshot.empty) {
                hasMorePending = false;
                return false;
            }

            lastPendingDoc = snapshot.docs[snapshot.docs.length - 1];
            hasMorePending = snapshot.docs.length === TASKS_PER_PAGE;

            // Extract new tasks and ensure no duplicates
            const newTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.mergeTasks(newTasks);
            this.notifyObservers();

            return hasMorePending;
        } catch (error) {
            console.error('Error loading pending tasks:', error);
            ToastService.error('Failed to load more pending tasks');
            return false;
        }
    },

    async loadCompletedTasks(userId = authService.getCurrentUserId(), currentSessionId = sessionId) {
        if (!hasMoreCompleted) return false;

        if (!userId || !this.isCurrentSession(userId, currentSessionId)) return false;

        try {
            let q = query(
                collection(db, 'tasks'),
                where('userId', '==', userId),
                where('completed', '==', true),
                orderBy('order', 'asc'),
                limit(TASKS_PER_PAGE)
            );

            if (lastCompletedDoc) {
                q = query(q, startAfter(lastCompletedDoc));
            }

            const snapshot = await getDocs(q);

            if (!this.isCurrentSession(userId, currentSessionId)) return false;

            // No more results
            if (snapshot.empty) {
                hasMoreCompleted = false;
                return false;
            }

            lastCompletedDoc = snapshot.docs[snapshot.docs.length - 1];
            hasMoreCompleted = snapshot.docs.length === TASKS_PER_PAGE;

            // Extract new tasks and ensure no duplicates
            const newTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.mergeTasks(newTasks);
            this.notifyObservers();

            return hasMoreCompleted;
        } catch (error) {
            console.error('Error loading completed tasks:', error);
            ToastService.error('Failed to load more completed tasks');
            return false;
        }
    },
    hasMorePendingTasks() {
        return hasMorePending;
    },

    hasMoreCompletedTasks() {
        return hasMoreCompleted;
    },

    // Add new task
    async addTask(text, dueDate = null) {
        const userId = authService.getCurrentUserId();
        if (!userId) throw new Error("Authentication required");

        const previousState = this.snapshotState();

        try {
            RateLimiter.checkLimit('addTask', userId);

            const lastTask = Array.from(this.tasks.values())
                .reduce((max, task) => (!task.completed && task.order > max.order) ? task : max, { order: 0 });

            const taskData = {
                text,
                completed: false,
                userId,
                order: lastTask.order + 1000,
                timestamp: serverTimestamp(), // Use serverTimestamp instead of new Date()
                dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null, // Convert to Firestore Timestamp
                priority: 'none'
            };

            Validator.task(taskData);
            const docRef = doc(collection(db, 'tasks'));

            const localTaskData = {
                ...taskData,
                id: docRef.id,
                timestamp: Timestamp.fromDate(new Date()) // Use local timestamp for immediate display
            };

            this.mergeTasks([localTaskData]);
            this.notifyObservers();

            await setDoc(docRef, taskData);

            return docRef.id;

        } catch (error) {
            this.restoreState(previousState, 'Task creation restored after the save failed');
            console.error('Error adding task:', error);
            ToastService.error(`Error adding task: ${error.message}`);
            throw error;
        }
    },

    async updateTask(taskId, updates) {
        const userId = authService.getCurrentUserId();
        if (!userId) throw new Error("Authentication required");

        try {
            RateLimiter.checkLimit('updateTask', userId);

            const taskRef = doc(db, 'tasks', taskId);
            const task = this.tasks.find(t => t.id === taskId);

            if (!task) throw new Error('Task not found');

            const previousState = this.snapshotState();
            const nextUpdates = { ...updates };

            // If completing/uncompleting task, update order
            if ('completed' in nextUpdates && nextUpdates.completed !== task.completed) {
                const tasksInTargetState = this.tasks.filter(t => t.completed === nextUpdates.completed);
                const minOrder = tasksInTargetState.length > 0
                    ? Math.min(...tasksInTargetState.map(t => t.order))
                    : 0;
                nextUpdates.order = minOrder - 1;
            }

            // Include the original timestamp in the validation
            const updatedTask = {
                ...task,
                ...nextUpdates,
                timestamp: task.timestamp?.toDate ? task.timestamp.toDate() : task.timestamp
            };

            Validator.task(updatedTask);
            this.mergeTasks([{ ...task, ...nextUpdates }]);
            this.notifyObservers();

            try {
                await updateDoc(taskRef, nextUpdates);
            } catch (error) {
                this.restoreState(previousState, 'Task update restored after the save failed');
                throw error;
            }
        } catch (error) {
            console.error('Error updating task:', error);
            ToastService.error(error.message);
            throw error;
        }
    },
    // Delete task
    async deleteTask(taskId) {
        const previousState = this.snapshotState();

        try {
            const task = this.getTask(taskId);
            if (!task) return false;

            this.removeTasks([taskId]);

            // Delete from Firestore
            await deleteDoc(doc(db, 'tasks', taskId));
            return true;
        } catch (error) {
            this.restoreState(previousState, 'Task restored after deletion failed');
            ToastService.error('❌ Could not delete task. Please try again');
            throw error;
        }
    },

    async updateTaskOrder(orderedIds) {
        const userId = authService.getCurrentUserId();
        if (!userId) throw new Error("Authentication required");

        const previousState = this.snapshotState();

        try {
            const taskById = new Map(this.tasks.map(task => [task.id, task]));
            const uniqueOrderedIds = [...new Set(orderedIds)].filter(taskId => taskById.has(taskId));
            const currentOrder = this.tasks
                .filter(task => uniqueOrderedIds.includes(task.id))
                .sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)))
                .map(task => task.id);

            if (JSON.stringify(currentOrder) === JSON.stringify(uniqueOrderedIds)) {
                return true;
            }

            const batch = writeBatch(db);
            uniqueOrderedIds.forEach((taskId, index) => {
                // Only update if position changed
                const task = taskById.get(taskId);
                if (task && task.order !== index) {
                    batch.update(doc(db, 'tasks', taskId), { order: index });
                }
            });

            this.mergeTasks(uniqueOrderedIds.map((taskId, index) => ({
                ...taskById.get(taskId),
                order: index
            })));
            this.notifyObservers();

            try {
                await batch.commit();
            } catch (error) {
                this.restoreState(previousState, 'Task order restored after the save failed');
                throw error;
            }
            return true;
        } catch (error) {
            console.error('Error updating task order:', error);
            ToastService.error('Could not save the new task order');
            throw error;
        }
    },

    // Get task by id
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    },

    getPendingTasks() {
        return sortTaskList(this.tasks.filter(task => !task.completed));
    },

    getCompletedTasks() {
        return sortTaskList(this.tasks.filter(task => task.completed));
    },

    async getTotalPendingCount() {
        const userId = authService.getCurrentUserId();
        if (!userId) return 0;

        try {
            const q = query(
                collection(db, 'tasks'),
                where('userId', '==', userId),
                where('completed', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting total pending count:', error);
            return 0;
        }
    },

    async searchAllTasks(searchTerm) {
        const userId = authService.getCurrentUserId();
        if (!userId) return { pending: [], completed: [] };

        try {
            // Get all tasks for the user
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(tasksQuery);
            const allTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter tasks that contain the search term (case-insensitive)
            const term = searchTerm.toLowerCase();
            const matchingTasks = allTasks.filter(task =>
                task.text.toLowerCase().includes(term)
            );

            // Split into pending and completed
            const pendingTasks = matchingTasks
                .filter(task => !task.completed)
                .sort((a, b) => a.order - b.order);

            const completedTasks = matchingTasks
                .filter(task => task.completed)
                .sort((a, b) => a.order - b.order);

            return { pending: pendingTasks, completed: completedTasks };
        } catch (error) {
            console.error('Error searching all tasks:', error);
            ToastService.error('Failed to search tasks');
            return { pending: [], completed: [] };
        }
    }
};

// Initialize task service
taskService.init();

export default taskService;
