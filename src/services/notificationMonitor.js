// src/services/notificationMonitor.js
import taskService from './taskService.js';
import ToastService from './toastService.js';
import MessageProvider from './messageProvider.js';
import authService from './authService.js';

const NotificationMonitor = {
    checkInterval: 5 * 60 * 1000, // 5 minutes
    intervalId: null,
    lastNotificationTime: null,

    async init() {
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Start monitoring if user is logged in
        if (authService.getCurrentUserId()) {
            this.startMonitoring();
        }
    },

    startMonitoring() {
        // Initial check
        this.checkTasks();

        // Set up interval for subsequent checks
        this.intervalId = setInterval(() => this.checkTasks(), this.checkInterval);
    },

    async checkTasks() {
        const pendingTasks = taskService.getPendingTasks();
        const now = new Date();
        const totalPendingCount = await taskService.getTotalPendingCount();

        // Count upcoming and overdue tasks
        const upcomingTasks = [];
        const overdueTasks = [];

        pendingTasks.forEach(task => {
            if (task.dueDate) {
                const dueDate = task.dueDate.toDate();
                const timeDiff = dueDate - now;
                const hoursUntilDue = timeDiff / (1000 * 60 * 60);

                if (timeDiff < 0) {
                    overdueTasks.push(task);
                } else if (hoursUntilDue <= 24) {
                    upcomingTasks.push(task);
                }
            }
        });

        // Show notifications if needed
        if (this.shouldShowNotification()) {
            this.showTaskNotifications(upcomingTasks, overdueTasks, totalPendingCount);
        }
    },

    shouldShowNotification() {
        const now = Date.now();
        if (!this.lastNotificationTime || (now - this.lastNotificationTime) > 30 * 60 * 1000) { // 30 minutes
            this.lastNotificationTime = now;
            return true;
        }
        return false;
    },

    showTaskNotifications(upcomingTasks, overdueTasks, totalPending) {
        // Show task-specific notifications
        if (upcomingTasks.length > 0 || overdueTasks.length > 0) {
            let message;
            let notificationType = 'info';

            if (overdueTasks.length > 0) {
                message = overdueTasks.length === 1
                    ? MessageProvider.getOverdueTaskMessage(overdueTasks[0])
                    : MessageProvider.getMultipleOverdueTasksMessage(overdueTasks.length);
                notificationType = 'error';

                // Show overdue tasks as persistent (won't auto-dismiss)
                ToastService.persistent(message, notificationType);
            } else if (upcomingTasks.length > 0) {
                message = upcomingTasks.length === 1
                    ? MessageProvider.getUpcomingTaskMessage(upcomingTasks[0])
                    : MessageProvider.getMultipleUpcomingTasksMessage(upcomingTasks.length);
                notificationType = 'warning';

                // Show upcoming tasks as persistent (won't auto-dismiss)
                ToastService.persistent(message, notificationType);
            }
        }

        // Always show the total pending tasks toast with short duration
        const message = MessageProvider.getTotalPendingMessage(totalPending);
        ToastService.info(message, 15000);
    }
};

export default NotificationMonitor;