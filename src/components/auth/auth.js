// src/components/auth/auth.js
import authService from '../../services/authService.js';
import NotificationMonitor from '../../services/notificationMonitor.js';
import ToastService from '../../services/toastService.js';
import MessageProvider from '../../services/messageProvider.js';
import SidebarManager from "../ui/sidebar.js";

const AuthComponent = {
    // DOM elements
    authContainer: null,
    tasksContainer: null,
    signInButton: null,
    logoutButton: null,
    lastLoginTime: null,

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
    async handleAuthStateChanged(user) {
        if (user) {
            this.showTasksView();
            // Show sidebar when user is logged in
            SidebarManager.setVisible(true);
            await NotificationMonitor.init();

            // Check if this is a return visit
            const now = new Date();
            const storedTime = localStorage.getItem('lastLoginTime');
            if (storedTime) {
                const lastTime = new Date(parseInt(storedTime));
                const hoursSinceLastVisit = (now - lastTime) / (1000 * 60 * 60);

                if (hoursSinceLastVisit > 2) {
                    // Format time as "2 hours ago" or "Yesterday at 2 PM"
                    const timeString = this.formatTimeSince(lastTime);
                    ToastService.info(MessageProvider.getToastWelcomeBackMessage(timeString));
                } else {
                    // Regular greeting based on time of day
                    const hour = new Date().getHours();
                    if (hour >= 5 && hour < 12) {
                        ToastService.success(MessageProvider.getMorningGreeting(user.displayName));
                    } else if (hour >= 17 || hour < 5) {
                        ToastService.success(MessageProvider.getEveningGreeting(user.displayName));
                    } else {
                        ToastService.success(MessageProvider.getWelcomeBackMessage(user.displayName));
                    }
                }
            }

            // Update last login time
            localStorage.setItem('lastLoginTime', now.getTime().toString());

            // Rest of your code...
        } else {
            // Hide sidebar when user is logged out
            SidebarManager.setVisible(false);
            this.showAuthView();
        }
    },

    formatTimeSince(date) {
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${date.toLocaleDateString(undefined, { 
                weekday: 'long'
            })} at ${date.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit'
            })}`;
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