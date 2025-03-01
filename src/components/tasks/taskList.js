// src/components/tasks/taskList.js
import taskService from '../../services/taskService.js';
import TabManager from '../ui/tabs.js';
import SortableManager from '../../utils/sortable.js';
import TaskItem from './taskItem.js';


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
            .map((task) => TaskItem.createTaskHtml(task))
            .join('');

        // Add load more button if needed
        if (taskService.hasMorePendingTasks()) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = 'Load More Tasks';
            loadMoreBtn.addEventListener('click', async () => {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
                const hasMore = await taskService.loadPendingTasks();
                if (!hasMore) {
                    loadMoreBtn.remove();
                } else {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load More Tasks';
                }
            });
            this.pendingTasksContainer.appendChild(loadMoreBtn);
        }

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
            .map((task) => TaskItem.createTaskHtml(task))
            .join('');

        // Add load more button if needed
        if (taskService.hasMoreCompletedTasks()) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = 'Load More Tasks';
            loadMoreBtn.addEventListener('click', async () => {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
                const hasMore = await taskService.loadCompletedTasks();
                if (!hasMore) {
                    loadMoreBtn.remove();
                } else {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load More Tasks';
                }
            });
            this.completedTasksContainer.appendChild(loadMoreBtn);
        }
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