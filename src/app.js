// src/app.js
import AuthComponent from './components/auth/auth.js';
import TaskForm from './components/tasks/taskForm.js';
import TaskList from './components/tasks/taskList.js';
import TaskItem from './components/tasks/taskItem.js';
import TabManager from './components/ui/tabs.js';
import ThemeManager from './components/ui/theme.js';
import HistoryView from './components/history/history.js';
import ToastService from './services/toastService.js';
import NotificationMonitor from './services/notificationMonitor.js';
import ConfigMenu from './components/ui/configMenu.js';
import DataCleanupService from "./services/dataCleanupService.js";
import SearchComponent from './components/search/search.js';

// App initialization
const App = {
    async init() {
        // Initialize UI components
        ToastService.init();
        ThemeManager.init();
        TabManager.init();
        SearchComponent.init();
        await NotificationMonitor.init();

        // Initialize auth
        AuthComponent.init();

        // Initialize task components
        TaskForm.init();
        TaskList.init();
        ConfigMenu.init();

        // Setup task item event listeners
        this.setupTaskItemListeners();

        // Initialize history view
        HistoryView.init();

        // Add event listener for the delete all data button
        document.getElementById('delete-all-data').addEventListener('click', async () => {
            await DataCleanupService.deleteAllUserData();
            document.getElementById('config-menu').classList.remove('show');
        });

        document.getElementById('clear-pending-tasks').addEventListener('click', async () => {
            // Show confirmation dialog
            if (confirm('Are you sure you want to delete all pending tasks? This cannot be undone.')) {
                await DataCleanupService.clearPendingTasks();
                document.getElementById('config-menu').classList.remove('show');
            }
        });

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
    App.init().catch(error => console.error('App initialization failed:', error));
});

export default App;