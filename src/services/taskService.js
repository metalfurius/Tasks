// src/services/taskService.js
import { db } from './firebase.js';
import authService from './authService.js';
import ToastService from './toastService.js';
import { RateLimiter } from './rateLimiter.js';
import { Validator } from '../utils/validation.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Task service object
const taskService = {
    // Tasks array
    tasks: [],

    // Snapshot unsubscribe function
    unsubscribe: null,

    // Task observers
    observers: [],

    // Initialize tasks
    init() {
        authService.onAuthStateChanged(user => {
            if (user) {
                this.loadTasks();
            } else {
                if (this.unsubscribe) {
                    this.unsubscribe();
                    this.unsubscribe = null;
                }
                this.tasks = [];
                this.notifyObservers();
            }
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
    loadTasks() {
        try {
            const userId = authService.getCurrentUserId();
            if (!userId) return;

            const q = query(
                collection(db, 'tasks'),
                where('userId', '==', userId),
                orderBy('order', 'asc')
            );

            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // Use cache-first strategy
            this.unsubscribe = onSnapshot(q, {
                includeMetadataChanges: true
            }, (snapshot) => {
                if (!snapshot.metadata.hasPendingWrites) {
                    this.tasks = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    this.notifyObservers();
                }
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    },

    // Add new task
    async addTask(text, dueDate = null) {
        const userId = authService.getCurrentUserId();
        if (!userId) throw new Error("Authentication required");

        try {
            RateLimiter.checkLimit('addTask', userId);

            // Find minimum order value for uncompleted tasks
            const uncompletedTasks = this.tasks.filter(t => !t.completed);
            const minOrder = uncompletedTasks.length > 0
                ? Math.min(...uncompletedTasks.map(t => t.order))
                : 0;

            // Convert dueDate string to Firestore timestamp if provided
            const taskData = {
                text: text.trim(),
                userId,
                completed: false,
                timestamp: new Date(),
                order: minOrder - 1
            };

            if (dueDate) {
                taskData.dueDate = new Date(dueDate);
            }

            // Validate task data
            Validator.task(taskData);

            // Add task to Firestore
            await addDoc(collection(db, 'tasks'), taskData);

        } catch (error) {
            console.error('Error adding task:', error);
            ToastService.error(error.message);
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

    truncateText(text, maxLength = 20) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Delete task
    async deleteTask(taskId) {
        try {
            const task = this.getTask(taskId);
            if (!task) return false;

            await deleteDoc(doc(db, 'tasks', taskId));
            ToastService.warning(`🗑️ "${this.truncateText(task.text)}" has been deleted`);
            return true;
        } catch (error) {
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

    // Get pending tasks
    getPendingTasks() {
        return this.tasks
            .filter(task => !task.completed)
            .sort((a, b) => a.order - b.order);
    },

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks
            .filter(task => task.completed)
            .sort((a, b) => a.order - b.order);
    },
};

// Initialize task service
taskService.init();

export default taskService;