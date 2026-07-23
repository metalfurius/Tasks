// src/utils/sortable.js
import taskService from '../services/taskService.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from '../services/toastService.js?v=tasks-untrusted-content-rendering-v1';

const SortableManager = {
    instances: {},

    initSortable(containerId, options = {}) {
        if (this.instances[containerId]) {
            this.instances[containerId].destroy();
            this.instances[containerId] = null;
        }

        const container = document.getElementById(containerId);
        if (!container) return null;

        const defaultOptions = {
            animation: 150,
            handle: '.drag-handle', // Update this to use the drag handle
            onEnd: this.handleSortEnd.bind(this, containerId)
        };

        this.instances[containerId] = Sortable.create(
            container,
            { ...defaultOptions, ...options }
        );

        return this.instances[containerId];
    },

    async handleSortEnd(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;

            const orderedIds = Array.from(container.children)
                .filter(el => el.dataset.id)
                .map(el => el.dataset.id);

            await taskService.updateTaskOrder(orderedIds);
            ToastService.info('📋 Task order updated');
        } catch (error) {
            console.error('Error updating task order:', error);
            ToastService.error('😕 Could not save the new task order');
        }
    }
};

export default SortableManager;
