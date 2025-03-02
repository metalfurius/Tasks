// src/services/dataCleanupService.js
import taskService from './taskService.js';
import historyService from './historyService.js';
import ToastService from './toastService.js';

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
            ToastService.info("Deleting all your data. Please wait...", 0, true);

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
    }
};

export default DataCleanupService;