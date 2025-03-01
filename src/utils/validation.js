// src/utils/validation.js
export const Validator = {
    task(data) {
        // Existing validations
        if (!data.text || typeof data.text !== 'string') {
            throw new Error('Invalid task text');
        }
        if (data.text.length < 3) {
            throw new Error('Task text too short (minimum 3 characters)');
        }
        if (data.text.length > 500) {
            throw new Error('Task text too long (maximum 500 characters)');
        }
        if (typeof data.completed !== 'boolean') {
            throw new Error('Task completion status must be boolean');
        }
        if (typeof data.order !== 'number' || !Number.isFinite(data.order)) {
            throw new Error('Invalid task order');
        }
        if (!data.timestamp || !(data.timestamp instanceof Date)) {
            throw new Error('Invalid timestamp');
        }

        // Enhanced due date validation
        if (data.dueDate) {
            const date = data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid due date');
            }
            if (date < new Date().setHours(0, 0, 0, 0)) {
                throw new Error('Due date cannot be in the past');
            }
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            if (date > oneYearFromNow) {
                throw new Error('Due date cannot be more than 1 year in the future');
            }
        }
    },

    history(data) {
        if (!data.action || !data.taskText || !data.userId) {
            throw new Error('Missing required history fields');
        }
        if (data.taskText.length > 500) {
            throw new Error('History text too long');
        }
        const validActions = ['Task created', 'Task completed', 'Task edited', 'Task deleted', 'Task marked incomplete'];
        if (!validActions.includes(data.action)) {
            throw new Error('Invalid history action');
        }
    }
};