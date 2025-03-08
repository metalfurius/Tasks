// src/components/ui/sidebar.js
const SidebarManager = {
    sidebar: null,
    toggleBtn: null,
    navItems: null,
    languageBtn: null,
    languageOptions: null,
    currentMode: 'home',

    init() {
        this.sidebar = document.getElementById('app-sidebar');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        this.navItems = document.querySelectorAll('.nav-item');
        this.languageBtn = document.querySelector('.language-btn');
        this.languageOptions = document.querySelector('.language-options');

        if (!this.sidebar || !this.toggleBtn) return;

        this.setupListeners();
        this.loadSidebarState();

        // Set initial mode
        this.setActiveMode(this.currentMode);
    },

    setupListeners() {
        // Sidebar toggle
        this.toggleBtn.addEventListener('click', () => this.toggleSidebar());

        // Navigation items
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = item.dataset.mode;
                this.setActiveMode(mode);
            });
        });

        // Language selector
        if (this.languageBtn) {
            this.languageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.languageOptions.classList.toggle('hidden');
            });

            // Hide language options when clicking elsewhere
            document.addEventListener('click', () => {
                this.languageOptions.classList.add('hidden');
            });

            // Language selection
            const langButtons = document.querySelectorAll('.language-options button');
            langButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.dataset.lang;
                    this.setLanguage(lang);
                    this.languageOptions.classList.add('hidden');
                });
            });
        }

        // Handle responsive behavior
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.sidebar.classList.add('collapsed');
                if (this.isSidebarExpanded()) {
                    this.sidebar.classList.add('expanded');
                }
            } else {
                this.sidebar.classList.remove('expanded');
            }
        });

        // Initial check for mobile view
        if (window.innerWidth <= 768) {
            this.sidebar.classList.add('collapsed');
        }
    },

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('expanded');
        } else {
            this.sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
        }
    },

    loadSidebarState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.classList.remove('collapsed');
        }
    },

    isSidebarExpanded() {
        return this.sidebar.classList.contains('expanded');
    },

    setActiveMode(mode) {
        if (mode === this.currentMode) return;

        // Update active state in navigation
        this.navItems.forEach(item => {
            if (item.dataset.mode === mode) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Here you would handle the mode change in your application
        // For example, showing/hiding different views
        console.log(`Changing mode to: ${mode}`);

        // For the first version, just log the mode change
        // Later you'll implement the actual view switching

        this.currentMode = mode;

        // On mobile, collapse sidebar after selection
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('expanded');
        }
    },

    setLanguage(lang) {
        console.log(`Language changed to: ${lang}`);
        // You'll implement actual language switching later
        // For now, just store the preference
        localStorage.setItem('language', lang);
    }
};

export default SidebarManager;