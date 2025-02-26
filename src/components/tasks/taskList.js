// src/components/tasks/taskList.js
import taskService from '../../services/taskService.js';
import TabManager from '../ui/tabs.js';
import SortableManager from '../../utils/sortable.js';

const TaskList = {
    // DOM elements
    pendingTasksContainer: null,
    completedTasksContainer: null,

    // Initialize task list
    init() {
        // Get DOM elements
        this.pendingTasksContainer = document.getElementById('pending-tasks');
        this.completedTasksContainer = document.getElementById('completed-tasks');

        if (!this.pendingTasksContainer || !this.completedTasksContainer) {
            console.error('Task containers not found');
            return;
        }

        // Listen for tasks changes
        taskService.onTasksChanged(this.renderTasks.bind(this));

        // Listen for tab changes
        TabManager.onTabChange(this.handleTabChange.bind(this));
    },

    // Render tasks
    renderTasks() {
        this.renderPendingTasks();
        this.renderCompletedTasks();
    },

    // Render pending tasks
    renderPendingTasks() {
        const pendingTasks = taskService.getPendingTasks();

        if (pendingTasks.length === 0) {
            this.pendingTasksContainer.innerHTML = '<div class="empty-state">No pending tasks 🎉</div>';
            return;
        }

        this.pendingTasksContainer.innerHTML = pendingTasks
            .map((task) => this.createTaskHtml(task))
            .join('');

        // Initialize sortable if on pending tab
        if (TabManager.getActiveTab() === 'pending') {
            SortableManager.initSortable('pending-tasks');
        }
    },

    // Render completed tasks
    renderCompletedTasks() {
        const completedTasks = taskService.getCompletedTasks();

        if (completedTasks.length === 0) {
            this.completedTasksContainer.innerHTML = '<div class="empty-state">No completed tasks yet</div>';
            return;
        }

        this.completedTasksContainer.innerHTML = completedTasks
            .map((task) => this.createTaskHtml(task))
            .join('');
    },

    // Check if a date is overdue
    isOverdue(date) {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for comparison
        return date < today;
    },

    // Format the due date
    formatDueDate(dueDate) {
        if (!dueDate) return '';

        const date = dueDate.toDate();
        const isOverdue = this.isOverdue(date);
        const formattedDate = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });

        return `<div class="due-date ${isOverdue ? 'overdue' : ''}">${formattedDate}</div>`;
    },

    // Create task HTML
    createTaskHtml(task) {
        return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-item-main">
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <div class="task-content" contenteditable="true" data-id="${task.id}">${task.text}</div>
                <div class="task-actions">
                    <button class="delete-btn" data-id="${task.id}">🗑️</button>
                    ${task.dueDate ? this.formatDueDate(task.dueDate) : ''}
                </div>
            </div>
        </div>
    `;
    },

    // Handle tab change
    handleTabChange(tabName) {
        if (tabName === 'pending') {
            SortableManager.initSortable('pending-tasks');
        } else {
            // Destroy sortable instance when not on pending tab
            if (SortableManager.instances['pending-tasks']) {
                SortableManager.instances['pending-tasks'].destroy();
                SortableManager.instances['pending-tasks'] = null;
            }
        }
    }
};

export default TaskList;