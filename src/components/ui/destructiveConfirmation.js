const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

const DestructiveConfirmation = {
    modal: null,
    title: null,
    message: null,
    progress: null,
    error: null,
    confirmButton: null,
    cancelButton: null,
    closeButton: null,
    retryButton: null,
    pendingResolve: null,
    cancelOperation: null,
    retryHandler: null,
    previousFocus: null,
    busy: false,
    initialized: false,

    init() {
        if (this.initialized) return;

        this.modal = document.getElementById('destructive-confirmation');
        if (!this.modal) return;

        this.title = document.getElementById('destructive-confirmation-title');
        this.message = document.getElementById('destructive-confirmation-message');
        this.progress = document.getElementById('cleanup-progress');
        this.error = document.getElementById('cleanup-error');
        this.confirmButton = document.getElementById('cleanup-confirm');
        this.cancelButton = document.getElementById('cleanup-cancel');
        this.closeButton = document.getElementById('cleanup-close');
        this.retryButton = document.getElementById('cleanup-retry');
        this.initialized = true;

        this.confirmButton?.addEventListener('click', () => this.resolveConfirmation(true));
        this.cancelButton?.addEventListener('click', () => {
            if (this.busy) {
                this.cancelOperation?.();
            } else {
                this.resolveConfirmation(false);
                this.close();
            }
        });
        this.closeButton?.addEventListener('click', () => this.close());
        this.retryButton?.addEventListener('click', () => this.retryHandler?.());
        this.modal.addEventListener('keydown', event => this.handleKeydown(event));
    },

    async request({ title, message, confirmLabel }) {
        this.init();
        if (!this.modal) return false;

        this.previousFocus = document.activeElement;
        this.title.textContent = title;
        this.message.textContent = message;
        this.confirmButton.textContent = confirmLabel;
        this.progress.textContent = '';
        this.error.textContent = '';
        this.error.classList.add('hidden');
        this.confirmButton.classList.remove('hidden');
        this.cancelButton.classList.remove('hidden');
        this.closeButton.classList.add('hidden');
        this.retryButton.classList.add('hidden');
        this.busy = false;
        this.cancelOperation = null;
        this.open();

        return new Promise(resolve => {
            this.pendingResolve = resolve;
        });
    },

    resolveConfirmation(confirmed) {
        if (!this.pendingResolve) return;
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        resolve(confirmed);
    },

    open() {
        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        queueMicrotask(() => this.confirmButton?.focus());
    },

    beginProgress(cancelOperation) {
        this.busy = true;
        this.cancelOperation = cancelOperation;
        this.confirmButton.classList.add('hidden');
        this.cancelButton.classList.remove('hidden');
        this.cancelButton.textContent = 'Cancel deletion';
        this.closeButton.classList.add('hidden');
        this.retryButton.classList.add('hidden');
        this.progress.textContent = 'Starting verified deletion…';
        this.progress.classList.remove('hidden');
        this.error.classList.add('hidden');
        this.cancelButton.focus();
    },

    updateProgress(details = {}) {
        const collection = details.collection === 'history' ? 'history' : 'tasks';
        if (details.phase === 'retry') {
            this.progress.textContent = `Retrying ${collection} deletion (attempt ${details.retryCount} of the bounded retry limit)…`;
        } else if (details.phase === 'deleted') {
            this.progress.textContent = `Deleted ${details.deleted} Taskify document${details.deleted === 1 ? '' : 's'}; ${collection} batch ${details.batches} verified for commit.`;
        } else if (details.phase === 'verified') {
            this.progress.textContent = `${collection} deletion verified. ${details.deleted} Taskify document${details.deleted === 1 ? '' : 's'} deleted so far.`;
        } else if (details.phase === 'cancelled') {
            this.progress.textContent = `Deletion cancelled after ${details.deleted} Taskify documents. The account remains active.`;
        } else if (details.phase === 'partial-failure') {
            this.progress.textContent = `Deletion stopped after ${details.deleted} Taskify documents; server verification is incomplete.`;
        } else if (details.phase === 'complete') {
            this.progress.textContent = 'All Taskify tasks and history are deleted and verified.';
        } else if (details.phase === 'delete') {
            this.progress.textContent = `Deleting a ${details.batchSize}-document ${collection} batch… ${details.deleted} documents already deleted.`;
        } else if (details.phase === 'query') {
            this.progress.textContent = `Finding remaining ${collection} documents… ${details.deleted} documents already deleted.`;
        }
    },

    showResult(result, { onRetry } = {}) {
        this.busy = false;
        this.cancelOperation = null;
        this.cancelButton.classList.add('hidden');
        this.closeButton.classList.remove('hidden');
        this.closeButton.textContent = 'Close';
        this.confirmButton.classList.add('hidden');
        this.retryButton.classList.add('hidden');

        if (result.status === 'complete') {
            this.title.textContent = 'Taskify data deleted';
            this.message.textContent = 'All tasks and history owned by this account were deleted. Your Google/Firebase account remains active.';
            this.error.classList.add('hidden');
            this.progress.textContent = `Complete and verified: ${result.deleted} Taskify documents deleted.`;
            this.closeButton.focus();
            return;
        }

        this.title.textContent = result.status === 'cancelled' ? 'Deletion cancelled' : 'Deletion partially failed';
        this.message.textContent = 'No account was deleted. Retry to resume from the server-verified remaining data.';
        this.error.textContent = result.error?.message || result.message || `Deletion ${result.status}.`;
        this.error.classList.remove('hidden');
        this.progress.textContent = `${result.status === 'cancelled' ? 'Cancelled' : 'Partial failure'} after ${result.deleted} Taskify documents; ${result.completedCollections} collection(s) verified.`;

        if (typeof onRetry === 'function') {
            this.retryButton.classList.remove('hidden');
            this.retryHandler = onRetry;
            this.retryButton.focus();
        } else {
            this.retryHandler = null;
            this.closeButton.focus();
        }
    },

    close() {
        if (!this.modal || this.busy) return;
        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        this.retryHandler = null;
        this.cancelOperation = null;
        this.resolveConfirmation(false);
        this.previousFocus?.focus?.();
        this.previousFocus = null;
    },

    handleKeydown(event) {
        if (event.key === 'Escape' && !this.busy) {
            event.preventDefault();
            this.close();
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = [...this.modal.querySelectorAll(FOCUSABLE_SELECTOR)]
            .filter(element => !element.classList.contains('hidden'));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
};

export default DestructiveConfirmation;
