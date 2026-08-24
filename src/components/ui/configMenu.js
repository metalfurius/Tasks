import historyService from '../../services/historyService.js?v=tasks-untrusted-content-rendering-v1';
import DataCleanupService from '../../services/dataCleanupService.js?v=tasks-untrusted-content-rendering-v1';
import DestructiveConfirmation from './destructiveConfirmation.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from '../../services/toastService.js?v=tasks-untrusted-content-rendering-v1';
import MessageProvider from '../../services/messageProvider.js?v=tasks-untrusted-content-rendering-v1';

const ConfigMenu = {
    configButton: null,
    configMenu: null,

    init() {
        this.configButton = document.getElementById('config-button');
        this.configMenu = document.getElementById('config-menu');

        if (!this.configButton || !this.configMenu) return;

        DestructiveConfirmation.init();
        this.configButton.textContent = '\u2699\uFE0F';
        this.configButton.setAttribute('aria-expanded', 'false');

        this.configButton.addEventListener('click', event => {
            event.stopPropagation();
            this.toggleMenu();
        });

        document.addEventListener('click', () => this.closeMenu());
        this.configMenu.addEventListener('click', event => event.stopPropagation());
        this.setupMenuActions();
    },

    toggleMenu() {
        const isOpen = this.configMenu.classList.toggle('show');
        this.configMenu.classList.toggle('hidden', !isOpen);
        this.configButton.setAttribute('aria-expanded', String(isOpen));
    },

    closeMenu() {
        this.configMenu.classList.remove('show');
        this.configMenu.classList.add('hidden');
        this.configButton?.setAttribute('aria-expanded', 'false');
    },

    async runCleanup({ title, message, confirmLabel, operation, successMessage }) {
        const confirmed = await DestructiveConfirmation.request({ title, message, confirmLabel });
        if (!confirmed) return null;

        this.closeMenu();
        const execute = async () => {
            const controller = new AbortController();
            DestructiveConfirmation.beginProgress(() => controller.abort());

            try {
                const result = await operation({
                    signal: controller.signal,
                    onProgress: details => DestructiveConfirmation.updateProgress(details)
                });

                if (result.status === 'complete' && successMessage) {
                    ToastService.success(successMessage);
                }

                DestructiveConfirmation.showResult(result, {
                    onRetry: (result.status === 'cancelled' || result.status === 'partial-failure') ? execute : null
                });
                return result;
            } catch (error) {
                const result = {
                    status: 'partial-failure',
                    deleted: 0,
                    completedCollections: 0,
                    error,
                    message: error.message
                };
                DestructiveConfirmation.showResult(result, { onRetry: execute });
                return result;
            }
        };

        return execute();
    },

    setupMenuActions() {
        const clearHistoryBtn = document.getElementById('clear-history');
        clearHistoryBtn?.addEventListener('click', () => this.runCleanup({
            title: 'Delete Taskify history?',
            message: 'This permanently deletes all Taskify history owned by the signed-in account. Tasks remain. Your Google/Firebase account remains active.',
            confirmLabel: 'Delete history',
            operation: ({ signal, onProgress }) => historyService.cleanupOldHistory(true, { signal, onProgress }),
            successMessage: MessageProvider.getHistoryCleanupMessage()
        }));

        const clearPendingBtn = document.getElementById('clear-pending-tasks');
        clearPendingBtn?.addEventListener('click', () => this.runCleanup({
            title: 'Delete pending Taskify tasks?',
            message: 'This permanently deletes all pending Taskify tasks owned by the signed-in account. Completed tasks and history remain. Your Google/Firebase account remains active.',
            confirmLabel: 'Delete pending tasks',
            operation: options => DataCleanupService.clearPendingTasks(options)
        }));

        const deleteAllBtn = document.getElementById('delete-all-data');
        deleteAllBtn?.addEventListener('click', () => this.runCleanup({
            title: 'Delete all Taskify data?',
            message: 'This permanently deletes all Taskify tasks and all Taskify history owned by the signed-in account. Your Google/Firebase authentication account remains active.',
            confirmLabel: 'Delete all Taskify data',
            operation: options => DataCleanupService.deleteAllUserData(options)
        }));
    }
};

export default ConfigMenu;
