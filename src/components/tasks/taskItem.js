// src/components/tasks/taskItem.js
import taskService from '../../services/taskService.js?v=tasks-untrusted-content-rendering-v1';
import historyService from '../../services/historyService.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from '../../services/toastService.js?v=tasks-untrusted-content-rendering-v1';
import MessageProvider from '../../services/messageProvider.js?v=tasks-untrusted-content-rendering-v1';
import { getTextWithLineBreaks, setTextWithLineBreaks } from '../../utils/dom.js?v=tasks-untrusted-content-rendering-v1';
import {
    createDueDateElement,
    createTaskElement as renderTaskElement,
    formatDueDate as formatTaskDueDate,
    isOverdue as isTaskOverdue
} from './taskRenderer.js?v=tasks-untrusted-content-rendering-v1';

const DELETE_ICON = '\u{1F5D1}\uFE0F';
const CONFIRM_DELETE_ICON = '\u2713';

const TaskItem = {
    updateTimeout: null,

    setupListeners(container) {
        if (!container) return;

        container.addEventListener('change', async (e) => {
            if (e.target.type === 'checkbox') {
                await this.handleTaskCompletion(e.target);
            }
        });

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

        container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                await this.handleTaskDelete(e.target);
            }
        });
    },

    async handleTaskCompletion(checkbox) {
        const taskId = checkbox.dataset.id;
        const isCompleted = checkbox.checked;
        const taskElement = checkbox.closest('.task-item');

        try {
            const task = taskService.getTask(taskId);
            if (!task) return;

            taskElement.classList.add(isCompleted ? 'completing' : 'uncompleting');
            checkbox.style.animation = 'checkmark 0.5s ease';

            await new Promise(resolve => setTimeout(resolve, 500));

            await taskService.updateTask(taskId, { completed: isCompleted });

            const taskIndex = taskService.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                taskService.tasks[taskIndex].completed = isCompleted;

                if (isCompleted) {
                    const completedTasks = taskService.tasks.filter(t => t.completed === isCompleted);
                    const minOrder = completedTasks.length > 0
                        ? Math.min(...completedTasks.map(t => t.order))
                        : 0;
                    taskService.tasks[taskIndex].order = minOrder - 1;
                }

                taskService.notifyObservers();
            }

            await historyService.logAction(
                isCompleted ? 'Task completed' : 'Task marked incomplete',
                task.text
            );

            if (isCompleted) {
                const completedCount = taskService.getCompletedTasks().length;
                if (completedCount > 0 && completedCount % 5 === 0) {
                    ToastService.success(MessageProvider.getToastAchievementMessage(completedCount));
                } else {
                    ToastService.success(MessageProvider.getTaskCompletionMessage(task));
                }
            } else {
                ToastService.info(MessageProvider.getTaskUnmarkingMessage(task));
            }

            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';
        } catch (error) {
            console.error('Error updating task completion:', error);
            ToastService.error('Could not update task status. Please try again.');
            checkbox.checked = !isCompleted;
            taskElement.classList.remove('completing', 'uncompleting');
            checkbox.style.animation = '';
        }
    },

    // Build task markup with DOM APIs so stored task text is always a text node.
    createTaskElement(task) {
        return renderTaskElement(task);
    },

    // Compatibility alias for callers that used the old name; this returns a node, not HTML.
    createTaskHtml(task) {
        return this.createTaskElement(task);
    },

    handleTaskEditFocus(contentElement) {
        const taskElement = contentElement.closest('.task-item');
        const editIndicator = taskElement.querySelector('.edit-indicator');

        if (editIndicator) {
            editIndicator.classList.remove('hidden');
        }

        contentElement.dataset.originalText = getTextWithLineBreaks(contentElement);
    },

    isOverdue(date) {
        return isTaskOverdue(date);
    },

    formatDueDate(dueDate) {
        return formatTaskDueDate(dueDate);
    },

    createDueDateElement(dueDate) {
        return createDueDateElement(dueDate);
    },

    async handleTaskDelete(button) {
        const taskId = button.dataset.id;

        try {
            if (!button.classList.contains('confirm-delete')) {
                button.classList.add('confirm-delete');
                button.textContent = CONFIRM_DELETE_ICON;

                ToastService.warning('Click again to confirm deletion', 3000);

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
        } catch (error) {
            console.error('Error deleting task:', error);
            ToastService.error('Failed to delete task. Please try again.');
            this.resetDeleteButton(button);
        }
    },

    resetDeleteButton(button) {
        if (!button) return;
        button.classList.remove('confirm-delete');
        button.textContent = DELETE_ICON;
        button.disabled = false;
    },

    async handleTaskEdit(contentElement) {
        const taskId = contentElement.dataset.id;
        const taskElement = contentElement.closest('.task-item');
        const editIndicator = taskElement.querySelector('.edit-indicator');
        const newText = getTextWithLineBreaks(contentElement).trim();

        const originalTask = taskService.getTask(taskId);
        if (!originalTask) {
            ToastService.error('Task not found');
            return;
        }

        const originalText = contentElement.dataset.originalText || originalTask.text;
        const hasChanged = originalText !== newText;

        if (!hasChanged) {
            if (editIndicator) {
                editIndicator.classList.add('hidden');
            }
            setTextWithLineBreaks(contentElement, originalTask.text);
            return;
        }

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        if (editIndicator) {
            editIndicator.textContent = 'Saving...';
        }

        this.updateTimeout = setTimeout(async () => {
            try {
                await taskService.updateTask(taskId, { text: newText });
                await historyService.logAction('Task edited', `${originalTask.text} \u2192 ${newText}`);

                setTextWithLineBreaks(contentElement, newText);
                ToastService.success(MessageProvider.getTaskEditMessage(originalTask));

                if (editIndicator) {
                    editIndicator.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error updating task:', error);
                ToastService.error('Failed to save changes. Please try again.');
                setTextWithLineBreaks(contentElement, originalTask.text);

                if (editIndicator) {
                    editIndicator.classList.add('hidden');
                }
            }
        }, 1000);
    }
};

export default TaskItem;
