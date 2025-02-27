// src/services/notificationMonitor.js
import taskService from './taskService.js';
import ToastService from './toastService.js';
import authService from './authService.js';

const NotificationMonitor = {
    CHECK_INTERVAL: 600000, // Check every 10 minutes
    intervalId: null,

    init() {
        // Listen for auth changes
        authService.onAuthStateChanged(user => {
            if (user) {
                this.startMonitoring();
            } else {
                this.stopMonitoring();
            }
        });
    },

    startMonitoring() {
        // Initial check
        this.checkTasks();

        // Set up periodic checks
        this.intervalId = setInterval(() => {
            this.checkTasks();
        }, this.CHECK_INTERVAL);
    },

    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    checkTasks() {
        const tasks = taskService.getPendingTasks();
        if (!tasks.length) return;

        this.checkOverdueTasks(tasks);
        this.checkUpcomingTasks(tasks);
        this.checkTaskLoad(tasks);
    },

    checkOverdueTasks(tasks) {
        const now = new Date();
        const overdueTasks = tasks.filter(task =>
            task.dueDate && task.dueDate.toDate() < now
        );

        if (overdueTasks.length > 0) {
            const message = overdueTasks.length === 1
                ? '⚠️ You have 1 overdue task'
                : `⚠️ You have ${overdueTasks.length} overdue tasks`;
            ToastService.warning(message);
        }
    },

    checkUpcomingTasks(tasks) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59);

        const upcomingTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = task.dueDate.toDate();
            return dueDate > now && dueDate <= tomorrow;
        });

        if (upcomingTasks.length > 0) {
            const message = upcomingTasks.length === 1
                ? '📅 You have 1 task due today/tomorrow'
                : `📅 You have ${upcomingTasks.length} tasks due today/tomorrow`;
            ToastService.info(message);
        }
    },

    checkTaskLoad(tasks) {
        if (tasks.length >= 10) {
            ToastService.warning(`📊 High task load: ${tasks.length} pending tasks`);
        }
    },

    // Call this when user logs in
    async initialCheck() {
        const tasks = taskService.getPendingTasks();
        if (!tasks.length) {
            ToastService.info('👋 Welcome! Your task list is empty');
            return;
        }

        // Delay notifications to not overwhelm the user
        setTimeout(() => {
            this.checkOverdueTasks(tasks);
        }, 1000);

        setTimeout(() => {
            this.checkUpcomingTasks(tasks);
        }, 2000);

        setTimeout(() => {
            this.checkTaskLoad(tasks);
        }, 3000);
    }
};

export default NotificationMonitor;