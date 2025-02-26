// src/components/ui/theme.js

const ThemeManager = {
    // Theme toggle buttons
    toggleButtons: [],

    // Initialize theme
    init() {
        this.toggleButtons = document.querySelectorAll('.theme-toggle');
        this.loadTheme();
        this.setupListeners();
    },

    // Setup event listeners
    setupListeners() {
        this.toggleButtons.forEach(btn =>
            btn.addEventListener('click', () => this.toggleTheme())
        );
    },

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateButtons(savedTheme);
    },

    // Toggle theme
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateButtons(newTheme);
    },

    // Update button icons
    updateButtons(theme) {
        this.toggleButtons.forEach(btn => {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        });
    }
};

export default ThemeManager;