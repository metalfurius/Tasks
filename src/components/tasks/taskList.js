// src/components/tasks/taskList.js
import taskService from '../../services/taskService.js';
import TabManager from '../ui/tabs.js';
import SortableManager from '../../utils/sortable.js';
import TaskItem from './taskItem.js';
import ToastService from "../../services/toastService.js";
import searchService from '../../services/searchService.js';

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

        // Add search subscription
        searchService.onSearchChanged(this.renderTasks.bind(this));
    },

    // Render tasks
    async renderTasks() {
        const searchTerm = searchService.getSearchTerm();

        if (searchTerm) {
            // Add a loading indicator that doesn't replace content
            const pendingLoading = document.createElement('div');
            pendingLoading.className = 'search-loading';
            pendingLoading.textContent = 'Searching...';

            const completedLoading = document.createElement('div');
            completedLoading.className = 'search-loading';
            completedLoading.textContent = 'Searching...';

            // Append loading indicators without removing content
            if (!this.pendingTasksContainer.querySelector('.search-loading')) {
                this.pendingTasksContainer.appendChild(pendingLoading);
            }

            if (!this.completedTasksContainer.querySelector('.search-loading')) {
                this.completedTasksContainer.appendChild(completedLoading);
            }

            // Apply subtle opacity to existing content to show it's being refreshed
            const pendingItems = this.pendingTasksContainer.querySelectorAll('.task-item');
            const completedItems = this.completedTasksContainer.querySelectorAll('.task-item');

            pendingItems.forEach(item => item.style.opacity = '0.5');
            completedItems.forEach(item => item.style.opacity = '0.5');

            // Perform global search
            const searchResults = await searchService.performGlobalSearch();

            // Remove loading indicators
            const loadingElements = document.querySelectorAll('.search-loading');
            loadingElements.forEach(el => el.remove());

            if (searchResults) {
                // Render search results only if search term is still active
                if (searchService.getSearchTerm() === searchTerm) {
                    this.renderPendingTasksFromSearch(searchResults.pending);
                    this.renderCompletedTasksFromSearch(searchResults.completed);
                }
            } else {
                // Fallback to local filtering if global search failed
                this.renderPendingTasks();
                this.renderCompletedTasks();
            }
        } else {
            // Normal pagination rendering
            this.renderPendingTasks();
            this.renderCompletedTasks();
        }
    },

    // Render pending tasks
    renderPendingTasks() {
        let pendingTasks = taskService.getPendingTasks();

        // Filter by search term if present
        pendingTasks = searchService.filterBySearchTerm(pendingTasks);

        if (pendingTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            if (searchTerm) {
                this.pendingTasksContainer.innerHTML = `<div class="empty-state">No pending tasks matching "${searchTerm}" 🔍</div>`;
            } else {
                // Original empty state code...
                this.pendingTasksContainer.innerHTML = '<div class="empty-state">No pending tasks 🎉</div>';
                // Rest of your existing empty state code...
            }
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
                try {
                    const hasMore = await taskService.loadPendingTasks();
                    if (!hasMore) {
                        loadMoreBtn.remove();
                        ToastService.info('All tasks loaded');
                    } else {
                        loadMoreBtn.disabled = false;
                        loadMoreBtn.textContent = 'Load More Tasks';
                    }
                } catch (error) {
                    ToastService.error('Failed to load tasks');
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Retry Loading';
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
        let completedTasks = taskService.getCompletedTasks();

        // Filter by search term if present
        completedTasks = searchService.filterBySearchTerm(completedTasks);

        if (completedTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            if (searchTerm) {
                this.completedTasksContainer.innerHTML = `<div class="empty-state">No completed tasks matching "${searchTerm}" 🔍</div>`;
            } else {
                this.completedTasksContainer.innerHTML = '<div class="empty-state">No completed tasks yet</div>';
            }
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
    },

    renderPendingTasksFromSearch(pendingTasks) {
        if (pendingTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            this.pendingTasksContainer.innerHTML = `<div class="empty-state">No pending tasks matching "${searchTerm}" 🔍</div>`;
            return;
        }

        this.pendingTasksContainer.innerHTML = pendingTasks
            .map((task) => TaskItem.createTaskHtml(task))
            .join('');

        // No "Load More" button for search results
    },

    renderCompletedTasksFromSearch(completedTasks) {
        if (completedTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            this.completedTasksContainer.innerHTML = `<div class="empty-state">No completed tasks matching "${searchTerm}" 🔍</div>`;
            return;
        }

        this.completedTasksContainer.innerHTML = completedTasks
            .map((task) => TaskItem.createTaskHtml(task))
            .join('');

        // No "Load More" button for search results
    }
};

export default TaskList;