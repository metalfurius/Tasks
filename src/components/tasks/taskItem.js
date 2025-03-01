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
        const taskElement = checkbox.closest('.task-item');

        try {
            const task = taskService.getTask(taskId);
            if (!task) return;

            // Add animation class
            taskElement.classList.add(isCompleted ? 'completing' : 'uncompleting');
            checkbox.style.animation = 'checkmark 0.5s ease';

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 500));

            await taskService.updateTask(taskId, { completed: isCompleted });
            await historyService.logAction(
                isCompleted ? 'Task completed' : 'Task marked incomplete',
                task.text
            );

            // Remove animation class
            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';

        } catch (error) {
            console.error('Error updating task completion:', error);
            checkbox.checked = !isCompleted; // Revert UI if error
            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';
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
    // Check if a date is overdue
    isOverdue(date) {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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
    },
    async handleTaskEdit(contentElement) {
        const taskId = contentElement.dataset.id;
        let newText = contentElement.innerHTML
            .replace(/<div>/g, '\n')
            .replace(/<\/div>/g, '')
            .replace(/<br>/g, '\n')
            .trim();

        // Skip update if text hasn't changed
        const originalTask = taskService.getTask(taskId);
        if (!originalTask || originalTask.text === newText) return;

        // Use debounce for updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(async () => {
            try {
                newText = newText.replace(/\n/g, '<br>');
                await taskService.updateTask(taskId, { text: newText });
                await historyService.logAction('Task edited', `${originalTask.text} → ${newText}`);
            } catch (error) {
                console.error('Error updating task:', error);
                if (originalTask) {
                    contentElement.innerHTML = originalTask.text;
                }
            }
        }, 1000); // Wait 1 second before updating
    }
};

export default TaskItem;