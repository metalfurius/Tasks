// src/components/tasks/taskList.js
import taskService from '../../services/taskService.js?v=tasks-untrusted-content-rendering-v1';
import TabManager from '../ui/tabs.js?v=tasks-untrusted-content-rendering-v1';
import SortableManager from '../../utils/sortable.js?v=tasks-untrusted-content-rendering-v1';
import TaskItem from './taskItem.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from '../../services/toastService.js?v=tasks-untrusted-content-rendering-v1';
import searchService from '../../services/searchService.js?v=tasks-untrusted-content-rendering-v1';
import { createEmptyState, createSearchEmptyState } from '../../utils/dom.js?v=tasks-untrusted-content-rendering-v1';

const TaskList = {
    pendingTasksContainer: null,
    completedTasksContainer: null,

    init() {
        this.pendingTasksContainer = document.getElementById('pending-tasks');
        this.completedTasksContainer = document.getElementById('completed-tasks');

        if (!this.pendingTasksContainer || !this.completedTasksContainer) {
            console.error('Task containers not found');
            return;
        }

        taskService.onTasksChanged(this.renderTasks.bind(this));
        TabManager.onTabChange(this.handleTabChange.bind(this));
        searchService.onSearchChanged(this.renderTasks.bind(this));
    },

    async renderTasks(_tasks = null, announcement = null) {
        if (announcement) {
            this.announce(announcement);
        }

        const searchTerm = searchService.getSearchTerm();

        if (searchTerm) {
            const pendingLoading = document.createElement('div');
            pendingLoading.className = 'search-loading';
            pendingLoading.textContent = 'Searching...';

            const completedLoading = document.createElement('div');
            completedLoading.className = 'search-loading';
            completedLoading.textContent = 'Searching...';

            if (!this.pendingTasksContainer.querySelector('.search-loading')) {
                this.pendingTasksContainer.appendChild(pendingLoading);
            }

            if (!this.completedTasksContainer.querySelector('.search-loading')) {
                this.completedTasksContainer.appendChild(completedLoading);
            }

            const pendingItems = this.pendingTasksContainer.querySelectorAll('.task-item');
            const completedItems = this.completedTasksContainer.querySelectorAll('.task-item');

            pendingItems.forEach(item => item.style.opacity = '0.5');
            completedItems.forEach(item => item.style.opacity = '0.5');

            const searchResults = await searchService.performGlobalSearch();

            const loadingElements = document.querySelectorAll('.search-loading');
            loadingElements.forEach(el => el.remove());

            if (searchResults) {
                if (searchService.getSearchTerm() === searchTerm) {
                    this.renderPendingTasksFromSearch(searchResults.pending);
                    this.renderCompletedTasksFromSearch(searchResults.completed);
                }
            } else {
                this.renderPendingTasks();
                this.renderCompletedTasks();
            }
        } else {
            this.renderPendingTasks();
            this.renderCompletedTasks();
        }
    },

    renderPendingTasks() {
        let pendingTasks = taskService.getPendingTasks();
        pendingTasks = searchService.filterBySearchTerm(pendingTasks);

        if (pendingTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            this.pendingTasksContainer.replaceChildren(
                searchTerm
                    ? createSearchEmptyState('No pending tasks', searchTerm)
                    : createEmptyState('No pending tasks \u{1F389}')
            );
            return;
        }

        this.pendingTasksContainer.replaceChildren(
            ...pendingTasks.map(task => TaskItem.createTaskElement(task))
        );

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

        if (TabManager.getActiveTab() === 'pending') {
            SortableManager.initSortable('pending-tasks');
        }
    },

    renderCompletedTasks() {
        let completedTasks = taskService.getCompletedTasks();
        completedTasks = searchService.filterBySearchTerm(completedTasks);

        if (completedTasks.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            this.completedTasksContainer.replaceChildren(
                searchTerm
                    ? createSearchEmptyState('No completed tasks', searchTerm)
                    : createEmptyState('No completed tasks yet')
            );
            return;
        }

        this.completedTasksContainer.replaceChildren(
            ...completedTasks.map(task => TaskItem.createTaskElement(task))
        );

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

    handleTabChange(tabName) {
        if (tabName === 'pending') {
            SortableManager.initSortable('pending-tasks');
        } else if (SortableManager.instances['pending-tasks']) {
            SortableManager.instances['pending-tasks'].destroy();
            SortableManager.instances['pending-tasks'] = null;
        }
    },

    renderPendingTasksFromSearch(pendingTasks) {
        if (pendingTasks.length === 0) {
            this.pendingTasksContainer.replaceChildren(
                createSearchEmptyState('No pending tasks', searchService.getSearchTerm())
            );
            return;
        }

        this.pendingTasksContainer.replaceChildren(
            ...pendingTasks.map(task => TaskItem.createTaskElement(task))
        );
    },

    renderCompletedTasksFromSearch(completedTasks) {
        if (completedTasks.length === 0) {
            this.completedTasksContainer.replaceChildren(
                createSearchEmptyState('No completed tasks', searchService.getSearchTerm())
            );
            return;
        }

        this.completedTasksContainer.replaceChildren(
            ...completedTasks.map(task => TaskItem.createTaskElement(task))
        );
    },

    announce(message) {
        const liveStatus = document.getElementById('task-live-status');
        if (liveStatus) {
            liveStatus.textContent = message;
        }
    }
};

export default TaskList;
