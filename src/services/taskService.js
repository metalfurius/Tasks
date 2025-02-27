// src/services/taskService.js
import { db } from './firebase.js';
import authService from './authService.js';
import ToastService from './toastService.js';
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

            // Get minimum order of pending tasks and subtract 1
            const pendingTasks = this.getPendingTasks();
            const newOrder = pendingTasks.length > 0 ?
                Math.min(...pendingTasks.map(t => t.order)) - 1 : 0;

            await addDoc(collection(db, 'tasks'), {
                text: taskText,
                completed: false,
                userId: userId,
                timestamp: new Date(),
                order: newOrder,
                dueDate: dueDate ? new Date(dueDate) : null
            });
            ToastService.success('Task added successfully');
            return true;
        } catch (error) {
            ToastService.error('Failed to add task');
            console.error('Error adding task:', error);
            throw error;
        }
    },

    // Update task
    async updateTask(taskId, updates) {
        try {
            const task = this.getTask(taskId);
            if (!task) return false;

            // If completing/uncompleting a task, update its order
            if ('completed' in updates && updates.completed !== task.completed) {
                const tasksInTargetState = updates.completed ?
                    this.getCompletedTasks() :
                    this.getPendingTasks();

                // Get minimum order of target state tasks and subtract 1
                updates.order = tasksInTargetState.length > 0 ?
                    Math.min(...tasksInTargetState.map(t => t.order)) - 1 : 0;
            }

            await updateDoc(doc(db, 'tasks', taskId), updates);
            if ('completed' in updates) {
                ToastService.success(updates.completed ?
                    `🎉 Great job! "${this.truncateText(task.text)}" completed` :
                    `↩️ "${this.truncateText(task.text)}" moved back to pending`
                );
            } else if ('text' in updates) {
                ToastService.info(`📝 Task text updated successfully`);
            } else {
                ToastService.success('✅ Task updated successfully');
            }
            return true;
        } catch (error) {
            ToastService.error('❌ Failed to update task. Please try again');
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
        return this.tasks
            .filter(task => !task.completed)
            .sort((a, b) => a.order - b.order);
    },

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks
            .filter(task => task.completed)
            .sort((a, b) => a.order - b.order);
    }
};

// Initialize task service
taskService.init();

export default taskService;