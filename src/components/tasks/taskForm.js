// src/components/tasks/taskForm.js
import taskService from '../../services/taskService.js';
import historyService from '../../services/historyService.js';
import ToastService from "../../services/toastService.js";

const TaskForm = {
    // DOM elements
    form: null,
    taskInput: null,
    dueDateInput: null,

    // Initialize task form
    init() {
        // Get DOM elements
        this.form = document.getElementById('task-form');
        this.taskInput = document.getElementById('task-input');
        this.dueDateInput = document.getElementById('due-date-input');

        if (!this.form || !this.taskInput) {
            console.error('Task form elements not found');
            return;
        }

        // Setup event listeners
        this.setupListeners();
    },

    // Setup event listeners
    setupListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    },

    // Handle form submission
    async handleSubmit(e) {
        e.preventDefault();

        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        const dueDate = this.dueDateInput.value || null;

        try {
            // Add task
            await taskService.addTask(taskText, dueDate);

            // Log to history
            await historyService.logAction('Task created', taskText);

            // Reset form
            this.resetForm();
        } catch (error) {
            ToastService.error(`Error adding task: ${error.message}`);
        }
    },

    // Reset form
    resetForm() {
        this.taskInput.value = '';
        this.dueDateInput.value = '';
        this.taskInput.focus();
    }
};

export default TaskForm;