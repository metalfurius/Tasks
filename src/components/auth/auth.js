// src/components/auth/auth.js
import authService from '../../services/authService.js';
import NotificationMonitor from '../../services/notificationMonitor.js';
import ToastService from '../../services/toastService.js';
import MessageProvider from '../../services/messageProvider.js';

const AuthComponent = {
    // DOM elements
    authContainer: null,
    tasksContainer: null,
    signInButton: null,
    logoutButton: null,

    // Initialize auth component
    init() {
        // Get DOM elements
        this.authContainer = document.getElementById('auth-container');
        this.tasksContainer = document.getElementById('tasks-container');
        this.signInButton = document.getElementById('google-signin-btn');
        this.logoutButton = document.getElementById('logout-btn');

        if (!this.authContainer || !this.tasksContainer) {
            console.error('Auth containers not found');
            return;
        }

        // Setup event listeners
        this.setupListeners();

        // Listen for auth state changes
        authService.onAuthStateChanged(this.handleAuthStateChanged.bind(this));
    },

    // Setup event listeners
    setupListeners() {
        if (this.signInButton) {
            this.signInButton.addEventListener('click', this.handleSignIn.bind(this));
        }

        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
        }
    },

    // Handle auth state changes
    handleAuthStateChanged(user) {
        if (user) {
            this.showTasksView();
            ToastService.success(MessageProvider.getWelcomeBackMessage(user.displayName));
            // Handle initial checks properly
            setTimeout(async () => {
                try {
                    await NotificationMonitor.init();
                } catch (error) {
                    ToastService.error(MessageProvider.getErrorMessage('general'));
                }
            }, 1500);
        } else {
            this.showAuthView();
        }
    },

    // Show tasks view
    showTasksView() {
        if (this.authContainer) this.authContainer.classList.add('hidden');
        if (this.tasksContainer) this.tasksContainer.classList.remove('hidden');
    },

    // Show auth view
    showAuthView() {
        if (this.authContainer) this.authContainer.classList.remove('hidden');
        if (this.tasksContainer) this.tasksContainer.classList.add('hidden');
    },

    // Handle sign in
    async handleSignIn() {
        try {
            await authService.signInWithGoogle();
        } catch (error) {
            ToastService.error(MessageProvider.getErrorMessage('signIn'));
            console.error('Sign in error:', error);
        }
    },

    // Handle logout
    async handleLogout() {
        try {
            await authService.signOut();
        } catch (error) {
            ToastService.error(MessageProvider.getErrorMessage('logout'));
            console.error('Logout error:', error);
        }
    }
};

export default AuthComponent;