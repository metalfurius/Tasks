// src/components/tasks/taskItem.js
import taskService from '../../services/taskService.js';
import historyService from '../../services/historyService.js';
import ToastService from '../../services/toastService.js';
import MessageProvider from "../../services/messageProvider.js";

const TaskItem = {
    updateTimeout: null,

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
        container.addEventListener('focus', (e) => {
            if (e.target.classList.contains('task-content')) {
                this.handleTaskEditFocus(e.target);
            }
        }, true);

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

            // Show success toast with appropriate message
            if (isCompleted) {
                // Check if this is a milestone
                const completedCount = taskService.getCompletedTasks().length;
                if (completedCount > 0 && completedCount % 5 === 0) {
                    // Show achievement toast for every 5 completed tasks
                    ToastService.success(MessageProvider.getToastAchievementMessage(completedCount));
                } else {
                    ToastService.success(MessageProvider.getTaskCompletionMessage(task));
                }
            } else {
                ToastService.info(MessageProvider.getTaskUnmarkingMessage(task));
            }

            // Remove animation class
            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';

        } catch (error) {
            console.error('Error updating task completion:', error);
            ToastService.error('Could not update task status. Please try again.');
            checkbox.checked = !isCompleted; // Revert UI if error
            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';
        }
    },

    createTaskHtml(task) {
        // Sanitize task text before rendering
        const sanitizedText = this.sanitizeHTML(task.text);

        return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-item-main">
                <div class="drag-handle">⋮⋮</div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <div class="task-content ${task.completed ? '' : 'editable'}" ${task.completed ? '' : 'contenteditable="true"'} data-id="${task.id}">${sanitizedText.replace(/\n/g, '<br>')}</div>
                <div class="task-actions">
                    <button class="delete-btn ${task.completed ? 'disabled' : ''}" data-id="${task.id}" ${task.completed ? 'disabled' : ''}>🗑️</button>
                    ${task.dueDate ? this.formatDueDate(task.dueDate) : ''}
                </div>
            </div>
            <div class="edit-indicator hidden">Editing...</div>
        </div>
    `;
    },

    // Helper function to sanitize HTML content
    sanitizeHTML(html) {
        if (!html) return '';

        // Create a temporary div element
        const tempDiv = document.createElement('div');

        // Set its content to the HTML we want to sanitize
        tempDiv.textContent = html;

        // Return the sanitized content
        return tempDiv.textContent;
    },

    // New method to handle focus on editable content
    handleTaskEditFocus(contentElement) {
        const taskElement = contentElement.closest('.task-item');
        const editIndicator = taskElement.querySelector('.edit-indicator');

        // Show edit indicator
        if (editIndicator) {
            editIndicator.classList.remove('hidden');
        }

        // Store original text for comparison later
        contentElement.dataset.originalText = contentElement.textContent;
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

                // Show confirmation toast
                ToastService.warning('Click again to confirm deletion', 3000);

                // Reset after 3 seconds if not clicked again
                setTimeout(() => {
                    if (button && button.classList.contains('confirm-delete')) {
                        this.resetDeleteButton(button);
                    }
                }, 3000);

                return;
            }

            const task = taskService.getTask(taskId);
            if (!task) {
                ToastService.error('Task not found');
                return;
            }

            button.disabled = true;
            await taskService.deleteTask(taskId);
            ToastService.warning(MessageProvider.getTaskDeletionMessage(task.text));
            await historyService.logAction('Task deleted', task.text);
            // Toast notification is already handled in taskService.deleteTask()

        } catch (error) {
            console.error('Error deleting task:', error);
            ToastService.error('Failed to delete task. Please try again.');
            this.resetDeleteButton(button);
        }
    },

    resetDeleteButton(button) {
        if (!button) return;
        button.classList.remove('confirm-delete');
        button.textContent = '🗑️';
        button.disabled = false;
    },

    async handleTaskEdit(contentElement) {
        const taskId = contentElement.dataset.id;
        const taskElement = contentElement.closest('.task-item');
        const editIndicator = taskElement.querySelector('.edit-indicator');

        // Get plain text content instead of innerHTML
        const newText = contentElement.textContent.trim();

        // Get original task
        const originalTask = taskService.getTask(taskId);
        if (!originalTask) {
            ToastService.error('Task not found');
            return;
        }

        // Compare with original text from dataset or task
        const originalText = contentElement.dataset.originalText || originalTask.text;
        const hasChanged = originalText !== newText;

        // Hide edit indicator if no changes
        if (!hasChanged) {
            if (editIndicator) {
                editIndicator.classList.add('hidden');
            }

            // Restore original content if no changes
            contentElement.innerHTML = this.sanitizeHTML(originalTask.text).replace(/\n/g, '<br>');
            return;
        }

        // Use debounce for updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        // Show saving indicator
        if (editIndicator) {
            editIndicator.textContent = 'Saving...';
        }

        this.updateTimeout = setTimeout(async () => {
            try {
                // Store text with newlines in database - already safely obtained as textContent
                await taskService.updateTask(taskId, { text: newText });
                await historyService.logAction('Task edited', `${originalTask.text} → ${newText}`);

                // Display with <br> tags in UI (after sanitizing)
                contentElement.innerHTML = this.sanitizeHTML(newText).replace(/\n/g, '<br>');

                // Show success toast
                ToastService.success(MessageProvider.getTaskEditMessage(originalTask));

                // Hide edit indicator after successful save
                if (editIndicator) {
                    editIndicator.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error updating task:', error);
                ToastService.error('Failed to save changes. Please try again.');

                // Restore original content on error
                contentElement.innerHTML = this.sanitizeHTML(originalTask.text).replace(/\n/g, '<br>');

                // Hide edit indicator
                if (editIndicator) {
                    editIndicator.classList.add('hidden');
                }
            }
        }, 1000);
    }
};

export default TaskItem;