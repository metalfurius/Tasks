// src/services/taskService.js
import { db } from './firebase.js';
import authService from './authService.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch
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

            // Unsubscribe from previous listener
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // Set up new listener
            this.unsubscribe = onSnapshot(q, (snapshot) => {
                this.tasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.notifyObservers();
            }, (error) => {
                console.error('Tasks query error:', error);
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    },

    // Add new task
    async addTask(taskText, dueDate = null) {
        try {
            const userId = authService.getCurrentUserId();
            if (!userId) throw new Error("No authenticated user");

            const newOrder = this.tasks.length ? Math.max(...this.tasks.map(t => t.order)) + 1 : 0;

            await addDoc(collection(db, 'tasks'), {
                text: taskText,
                completed: false,
                userId: userId,
                timestamp: new Date(),
                order: newOrder,
                dueDate: dueDate ? new Date(dueDate) : null
            });

            return true;
        } catch (error) {
            console.error('Error adding task:', error);
            throw error; // Simply re-throw the original error
        }
    },

    // Update task
    async updateTask(taskId, updates) {
        try {
            await updateDoc(doc(db, 'tasks', taskId), updates);
            return true;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Delete task
    async deleteTask(taskId) {
        try {
            await deleteDoc(doc(db, 'tasks', taskId));
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    },

    // Update task order (batch)
    async updateTaskOrder(orderedIds) {
        try {
            const batch = writeBatch(db);

            orderedIds.forEach((taskId, index) => {
                batch.update(doc(db, 'tasks', taskId), { order: index });
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
        return this.tasks.filter(task => !task.completed);
    },

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks.filter(task => task.completed);
    }
};

// Initialize task service
taskService.init();

export default taskService;