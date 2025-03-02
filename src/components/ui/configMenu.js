// src/components/ui/configMenu.js
import historyService from '../../services/historyService.js';
import ToastService from '../../services/toastService.js';
import MessageProvider from '../../services/messageProvider.js';

const ConfigMenu = {
    configButton: null,
    configMenu: null,

    init() {
        this.configButton = document.getElementById('config-button');
        this.configMenu = document.getElementById('config-menu');

        if (!this.configButton || !this.configMenu) return;

        // Set the gear emoji as content
        this.configButton.textContent = '⚙️';

        // Toggle menu on button click
        this.configButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            this.closeMenu();
        });

        // Prevent menu from closing when clicking inside it
        this.configMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Set up menu item actions
        this.setupMenuActions();
    },

    toggleMenu() {
        this.configMenu.classList.toggle('show');
        this.configMenu.classList.toggle('hidden');
    },

    closeMenu() {
        this.configMenu.classList.remove('show');
        this.configMenu.classList.add('hidden');
    },

    setupMenuActions() {
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                try {
                    await historyService.cleanupOldHistory(true); // Pass true to clear all history
                    ToastService.success(MessageProvider.getHistoryCleanupMessage());
                    this.closeMenu();
                } catch (error) {
                    console.error('Failed to clear history:', error);
                    ToastService.error(MessageProvider.getErrorMessage('general'));
                }
            });
        }
    }
};

export default ConfigMenu;