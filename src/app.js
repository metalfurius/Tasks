// src/app.js
import AuthComponent from './components/auth/auth.js';
import TaskForm from './components/tasks/taskForm.js';
import TaskList from './components/tasks/taskList.js';
import TaskItem from './components/tasks/taskItem.js';
import TabManager from './components/ui/tabs.js';
import ThemeManager from './components/ui/theme.js';
import HistoryView from './components/history/history.js';
import ToastService from './services/toastService.js';

// App initialization
const App = {
    init() {
        // Initialize UI components
        ThemeManager.init();
        TabManager.init();
        ToastService.init();

        // Initialize auth
        AuthComponent.init();

        // Initialize task components
        TaskForm.init();
        TaskList.init();

        // Setup task item event listeners
        this.setupTaskItemListeners();

        // Initialize history view
        HistoryView.init();

        console.log('App initialized successfully');
    },

    setupTaskItemListeners() {
        const pendingContainer = document.getElementById('pending-tasks');
        const completedContainer = document.getElementById('completed-tasks');

        // Set up task item listeners for both containers
        TaskItem.setupListeners(pendingContainer);
        TaskItem.setupListeners(completedContainer);
    }
};

// Initialize app when document is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

export default App;