// src/components/tasks/taskItem.js
import taskService from '../../services/taskService.js';
import historyService from '../../services/historyService.js';

const TaskItem = {
    // Event listeners setup
    setupListeners(container) {
        if (!container) return;

        // Handle checkbox changes (task completion)
        container.addEventListener('change', async (e) => {
            if (e.target.type === 'checkbox') {
                await this.handleTaskCompletion(e.target);
            }
        });

        // Handle task editing
        container.addEventListener('blur', async (e) => {
            if (e.target.classList.contains('task-content')) {
                await this.handleTaskEdit(e.target);
            }
        }, true);

        // Handle delete button clicks
        container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                await this.handleTaskDelete(e.target);
            }
        });
    },

    // Handle task completion toggle
    async handleTaskCompletion(checkbox) {
        const taskId = checkbox.dataset.id;
        const isCompleted = checkbox.checked;

        try {
            const task = taskService.getTask(taskId);
            if (!task) return;

            await taskService.updateTask(taskId, { completed: isCompleted });
            await historyService.logAction(
                isCompleted ? 'Task completed' : 'Task marked incomplete',
                task.text
            );
        } catch (error) {
            console.error('Error updating task completion:', error);
            checkbox.checked = !isCompleted; // Revert UI if error
        }
    },

    createTaskHtml(task) {
        return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-item-main">
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <div class="task-content" ${task.completed ? '' : 'contenteditable="true"'} data-id="${task.id}">${task.text}</div>
                <div class="task-actions">
                    <button class="delete-btn ${task.completed ? 'disabled' : ''}" data-id="${task.id}" ${task.completed ? 'disabled' : ''}>🗑️</button>
                    ${task.dueDate ? this.formatDueDate(task.dueDate) : ''}
                </div>
            </div>
        </div>
    `;
    },

    // Handle task deletion
    async handleTaskDelete(button) {
        const taskId = button.dataset.id;

        try {
            // Add confirmation state
            if (!button.classList.contains('confirm-delete')) {
                button.classList.add('confirm-delete');
                button.textContent = '✓';

                // Reset after 3 seconds
                setTimeout(() => {
                    if (button.parentNode) { // Check if button still exists in DOM
                        button.classList.remove('confirm-delete');
                        button.textContent = '🗑️';
                    }
                }, 3000);

                return;
            }

            const task = taskService.getTask(taskId);
            if (!task) return;

            await taskService.deleteTask(taskId);
            await historyService.logAction('Task deleted', task.text);
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    }
};

export default TaskItem;