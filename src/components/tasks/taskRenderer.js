// DOM-only task renderer. Stored task values are written as text nodes.
import {
    appendTextWithLineBreaks,
    createTextElement
} from '../../utils/dom.js?v=tasks-untrusted-content-rendering-v1';

const DRAG_HANDLE_ICON = '\u22ee\u22ee';
const DELETE_ICON = '\u{1F5D1}\uFE0F';

export function isOverdue(date) {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

export function formatDueDate(dueDate) {
    if (!dueDate) return '';

    const date = typeof dueDate.toDate === 'function' ? dueDate.toDate() : new Date(dueDate);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}

export function createDueDateElement(dueDate) {
    const date = typeof dueDate.toDate === 'function' ? dueDate.toDate() : new Date(dueDate);
    const dueDateElement = createTextElement('div', formatDueDate(date), 'due-date');
    dueDateElement.classList.toggle('overdue', isOverdue(date));
    return dueDateElement;
}

export function createTaskElement(task) {
    const taskId = task.id == null ? '' : String(task.id);
    const isCompleted = Boolean(task.completed);

    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.classList.toggle('completed', isCompleted);
    taskElement.dataset.id = taskId;

    const main = document.createElement('div');
    main.className = 'task-item-main';

    const dragHandle = createTextElement('div', DRAG_HANDLE_ICON, 'drag-handle');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isCompleted;
    checkbox.dataset.id = taskId;

    const content = document.createElement('div');
    content.className = 'task-content';
    content.classList.toggle('editable', !isCompleted);
    content.contentEditable = isCompleted ? 'false' : 'true';
    content.dataset.id = taskId;
    appendTextWithLineBreaks(content, task.text);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const deleteButton = createTextElement('button', DELETE_ICON, 'delete-btn');
    deleteButton.type = 'button';
    deleteButton.classList.toggle('disabled', isCompleted);
    deleteButton.disabled = isCompleted;
    deleteButton.dataset.id = taskId;

    actions.appendChild(deleteButton);
    if (task.dueDate) {
        actions.appendChild(createDueDateElement(task.dueDate));
    }

    main.append(dragHandle, checkbox, content, actions);
    taskElement.append(main, createTextElement('div', 'Editing...', 'edit-indicator hidden'));

    return taskElement;
}
