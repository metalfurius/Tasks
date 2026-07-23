// src/app.js
import AuthComponent from './components/auth/auth.js?v=tasks-untrusted-content-rendering-v1';
import TaskForm from './components/tasks/taskForm.js?v=tasks-untrusted-content-rendering-v1';
import TaskList from './components/tasks/taskList.js?v=tasks-untrusted-content-rendering-v1';
import TaskItem from './components/tasks/taskItem.js?v=tasks-untrusted-content-rendering-v1';
import TabManager from './components/ui/tabs.js?v=tasks-untrusted-content-rendering-v1';
import ThemeManager from './components/ui/theme.js?v=tasks-untrusted-content-rendering-v1';
import HistoryView from './components/history/history.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from './services/toastService.js?v=tasks-untrusted-content-rendering-v1';
import NotificationMonitor from './services/notificationMonitor.js?v=tasks-untrusted-content-rendering-v1';
import ConfigMenu from './components/ui/configMenu.js?v=tasks-untrusted-content-rendering-v1';
import DataCleanupService from "./services/dataCleanupService.js?v=tasks-untrusted-content-rendering-v1";
import SearchComponent from './components/search/search.js?v=tasks-untrusted-content-rendering-v1';
import SidebarManager from './components/ui/sidebar.js?v=tasks-untrusted-content-rendering-v1';

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

        SidebarManager.init();

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
