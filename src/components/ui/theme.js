// src/components/ui/theme.js
const ThemeManager = {
    themes: {
        light: {
            name: 'Light',
            icon: '☀️',
            isDark: false
        },
        sepia: {
            name: 'Sepia',
            icon: '📜',
            isDark: false
        },
        dark: {
            name: 'Dark',
            icon: '🌙',
            isDark: true
        },
        midnight: {
            name: 'Midnight',
            icon: '🌃',
            isDark: true
        }
    },

    toggleButtons: [],
    themeSelector: null,

    init() {
        this.toggleButtons = document.querySelectorAll('.theme-toggle');
        this.createThemeSelector();
        this.loadTheme();
        this.setupListeners();
    },

    createThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'theme-selector hidden';

        selector.innerHTML = Object.entries(this.themes)
            .map(([id, theme]) => `
            <button class="theme-option" data-theme="${id}">
                <span class="theme-icon">${theme.icon}</span>
                <span class="theme-name">${theme.name}</span>
            </button>
        `).join('');

        document.body.appendChild(selector);
        this.themeSelector = selector;
    },

    setupListeners() {
        this.toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = btn.getBoundingClientRect();
                this.toggleThemeSelector(rect);
            });
        });

        this.themeSelector.addEventListener('click', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                const theme = themeOption.dataset.theme;
                this.setTheme(theme);
            }
        });

        document.addEventListener('click', () => {
            this.themeSelector.classList.add('hidden');
        });
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    },

    setTheme(themeName) {
        if (!this.themes[themeName]) return;

        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        this.updateButtons(themeName);
        this.themeSelector.classList.add('hidden');
    },

    toggleThemeSelector(buttonRect) {
        const isHidden = this.themeSelector.classList.contains('hidden');

        if (isHidden) {
            this.themeSelector.style.top = `${buttonRect.bottom + 10}px`;
            this.themeSelector.style.right = `${window.innerWidth - buttonRect.right}px`;
        }

        this.themeSelector.classList.toggle('hidden');
    },

    updateButtons(themeName) {
        const theme = this.themes[themeName];
        this.toggleButtons.forEach(btn => {
            btn.textContent = theme.icon;
        });
    }
};

export default ThemeManager;