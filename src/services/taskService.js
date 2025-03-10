// src/services/taskService.js
import { db } from './firebase.js';
import authService from './authService.js';
import ToastService from './toastService.js';
import { RateLimiter } from './rateLimiter.js';
import { Validator } from '../utils/validation.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch, limit, startAfter, getDocs,
    serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const TASKS_PER_PAGE = 5;
let lastPendingDoc = null;
let lastCompletedDoc = null;
let hasMorePending = true;
let hasMoreCompleted = true;
let isLoading = false;
let loadingPromise = null;

// Task service object
const taskService = {
    tasks: [],
    unsubscribe: null,
    observers: [],

    init() {
        authService.onAuthStateChanged(async user => {
            // Cancel any previous loading
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }

            // Reset state
            this.tasks = [];
            isLoading = false;
            loadingPromise = null;
            lastPendingDoc = null;
            lastCompletedDoc = null;
            hasMorePending = true;
            hasMoreCompleted = true;

            if (user) {
                await this.loadTasks();
            }

            this.notifyObservers();
        });
    },
// Add task observer
    onTasksChanged(callback) {
        this.observers.push(callback);
        // Return unsubscribe function
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    // Notify all observers
    notifyObservers() {
        this.observers.forEach(callback => callback(this.tasks));
    },

    // Load tasks from Firebase
    async loadTasks() {
        if (isLoading) return loadingPromise;

        const userId = authService.getCurrentUserId();
        if (!userId) return;

        try {
            isLoading = true;
            loadingPromise = (async () => {
                // Load initial paginated tasks
                await Promise.all([
                    this.loadPendingTasks(),
                    this.loadCompletedTasks()
                ]);

                // Only listen for changes to tasks we've already loaded
                const taskIds = this.tasks.map(task => task.id);

                const q = query(
                    collection(db, 'tasks'),
                    where('userId', '==', userId),
                    where('__name__', 'in', taskIds.length ? taskIds : ['dummy-id'])
                );

                this.unsubscribe = onSnapshot(q, (snapshot) => {
                    this.handleSnapshotChanges(snapshot);
                });
            })();

            await loadingPromise;
        } catch (error) {
            console.error('Error loading tasks:', error);
            ToastService.error('Failed to load tasks');
        } finally {
            isLoading = false;
            loadingPromise = null;
        }
    },

    // New helper method to handle snapshot changes
    handleSnapshotChanges(snapshot) {
        snapshot.docChanges().forEach((change) => {
            const task = { id: change.doc.id, ...change.doc.data() };

            switch (change.type) {
                case 'removed':
                    this.tasks = this.tasks.filter(t => t.id !== change.doc.id);
                    break;
                case 'modified':
                    const index = this.tasks.findIndex(t => t.id === change.doc.id);
                    if (index !== -1) {
                        this.tasks[index] = task;
                    }
                    break;
                case 'added':
                    if (!this.tasks.some(t => t.id === change.doc.id)) {
                        this.tasks.push(task);
                    }
                    break;
            }
        });

        this.tasks.sort((a, b) => a.order - b.order);
        this.notifyObservers();
    },

    async loadPendingTasks() {
        if (!hasMorePending) return false;

        const userId = authService.getCurrentUserId();
        if (!userId) return false;

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

            // Get existing tasks, filtering out any that would be duplicates
            const existingCompletedTasks = this.tasks.filter(t => t.completed);
            const existingPendingTasks = this.tasks.filter(t => !t.completed);

            // Create a set of IDs for efficient duplicate checking
            const existingIds = new Set(existingPendingTasks.map(t => t.id));
            const uniqueNewTasks = newTasks.filter(task => !existingIds.has(task.id));

            // Merge tasks, preserving order
            this.tasks = [...existingPendingTasks, ...uniqueNewTasks, ...existingCompletedTasks];
            this.notifyObservers();

            return hasMorePending;
        } catch (error) {
            console.error('Error loading pending tasks:', error);
            ToastService.error('Failed to load more pending tasks');
            return false;
        }
    },

    async loadCompletedTasks() {
        if (!hasMoreCompleted) return false;

        const userId = authService.getCurrentUserId();
        if (!userId) return false;

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

            // Get existing tasks, filtering out any that would be duplicates
            const existingPendingTasks = this.tasks.filter(t => !t.completed);
            const existingCompletedTasks = this.tasks.filter(t => t.completed);

            // Create a set of IDs for efficient duplicate checking
            const existingIds = new Set(existingCompletedTasks.map(t => t.id));
            const uniqueNewTasks = newTasks.filter(task => !existingIds.has(task.id));

            // Merge tasks, preserving order
            this.tasks = [...existingPendingTasks, ...existingCompletedTasks, ...uniqueNewTasks];
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
            const docRef = await addDoc(collection(db, 'tasks'), taskData);

            const localTaskData = {
                ...taskData,
                id: docRef.id,
                timestamp: Timestamp.fromDate(new Date()) // Use local timestamp for immediate display
            };

            this.tasks.push(localTaskData);
            this.notifyObservers(); // Notify observers about the change

            return docRef.id;

        } catch (error) {
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

            // If completing/uncompleting task, update order
            if ('completed' in updates && updates.completed !== task.completed) {
                const tasksInTargetState = this.tasks.filter(t => t.completed === updates.completed);
                const minOrder = tasksInTargetState.length > 0
                    ? Math.min(...tasksInTargetState.map(t => t.order))
                    : 0;
                updates.order = minOrder - 1;
            }

            // Include the original timestamp in the validation
            const updatedTask = {
                ...task,
                ...updates,
                timestamp: task.timestamp.toDate()
            };

            Validator.task(updatedTask);
            await updateDoc(taskRef, updates);
        } catch (error) {
            console.error('Error updating task:', error);
            ToastService.error(error.message);
            throw error;
        }
    },
    // Delete task
    async deleteTask(taskId) {
        try {
            const task = this.getTask(taskId);
            if (!task) return false;

            // Remove from local array immediately
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.notifyObservers();

            // Delete from Firestore
            await deleteDoc(doc(db, 'tasks', taskId));
            return true;
        } catch (error) {
            // Revert local deletion if Firestore deletion fails
            const task = this.getTask(taskId);
            if (task) {
                this.tasks.push(task);
                this.notifyObservers();
            }
            ToastService.error('❌ Could not delete task. Please try again');
            throw error;
        }
    },

    async updateTaskOrder(orderedIds) {
        try {
            // Only update if order has actually changed
            const currentOrder = this.tasks
                .sort((a, b) => a.order - b.order)
                .map(task => task.id);

            if (JSON.stringify(currentOrder) === JSON.stringify(orderedIds)) {
                return true;
            }

            const batch = writeBatch(db);
            orderedIds.forEach((taskId, index) => {
                // Only update if position changed
                const task = this.tasks.find(t => t.id === taskId);
                if (task && task.order !== index) {
                    batch.update(doc(db, 'tasks', taskId), { order: index });
                }
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error updating task order:', error);
            throw error;
        }
    },

    // Get task by id
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    },

    getPendingTasks() {
        return Array.from(this.tasks.values())
            .filter(task => !task.completed)
            .sort((a, b) => a.order - b.order); // Sort by order ascending
    },

    getCompletedTasks() {
        return Array.from(this.tasks.values())
            .filter(task => task.completed)
            .sort((a, b) => a.order - b.order); // Sort by order ascending
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