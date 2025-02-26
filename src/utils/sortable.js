// src/utils/sortable.js
import taskService from '../services/taskService.js';

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
            handle: '.task-item',
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
        } catch (error) {
            console.error('Error updating task order:', error);
        }
    }
};

export default SortableManager;