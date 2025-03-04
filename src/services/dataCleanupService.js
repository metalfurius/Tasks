// src/services/dataCleanupService.js
import taskService from './taskService.js';
import historyService from './historyService.js';
import ToastService from './toastService.js';
import authService from "./authService.js";
import {
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {db} from "./firebase.js";

const DataCleanupService = {
    async deleteAllUserData() {
        if (!confirm("WARNING: This will permanently delete ALL your tasks and history. This action cannot be undone. Continue?")) {
            return false;
        }

        // Double-check with another confirmation
        if (!confirm("Are you absolutely sure? All your data will be permanently deleted.")) {
            return false;
        }

        try {
            ToastService.info("Deleting all your data. Please wait...", 0);

            // Delete all tasks first
            await this.deleteAllTasks();

            // Then delete all history
            await historyService.cleanupOldHistory(true);

            ToastService.success("All your data has been successfully deleted.");
            return true;
        } catch (error) {
            console.error("Error deleting user data:", error);
            ToastService.error("Failed to delete all data. Please try again.");
            return false;
        }
    },

    async deleteAllTasks() {
        const allTasks = taskService.tasks;
        const deletePromises = [];

        for (const task of allTasks) {
            deletePromises.push(taskService.deleteTask(task.id));
        }

        await Promise.all(deletePromises);
    },

    async clearPendingTasks() {
        try {
            const userId = authService.getCurrentUserId();
            if (!userId) return;

            // Show loading toast
            ToastService.info("Clearing all pending tasks. Please wait...", 0);

            // Query all pending tasks directly from Firestore
            const pendingTasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', userId),
                where('completed', '==', false)
            );

            // Get all pending tasks
            const snapshot = await getDocs(pendingTasksQuery);

            if (snapshot.empty) {
                ToastService.info("No pending tasks to clear.");
                return;
            }

            // Count the number of tasks to delete
            const taskCount = snapshot.size;

            // Create batch delete operation
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Execute batch delete
            await batch.commit();

            // Log action in history
            await historyService.logAction('Cleared all pending tasks', `${taskCount} tasks deleted`);

            // Show success message
            ToastService.warning(`${taskCount} pending tasks have been deleted.`);

            // Force refresh of tasks list
            taskService.notifyObservers();

            return true;
        } catch (error) {
            console.error('Error clearing pending tasks:', error);
            ToastService.error('Failed to clear pending tasks');
            throw error;
        }
    }
};

export default DataCleanupService;