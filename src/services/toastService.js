// src/services/toastService.js
const ToastService = {
    container: null,
    defaultDuration: 8000, // 8 seconds default duration
    maxToasts: 5, // Maximum number of toasts shown at once

    init() {
        // Create toast container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    // Create and show a toast notification
    show(message, type = 'info', duration = this.defaultDuration, isPersistent = false) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Add icon based on type
        let icon = '📝';
        switch (type) {
            case 'success': icon = '✅'; break;
            case 'error': icon = '❌'; break;
            case 'warning': icon = '⚠️'; break;
            case 'info': icon = 'ℹ️'; break;
        }

        // Create toast content
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">${message}</div>
            <button class="toast-close" aria-label="Close">×</button>
            ${!isPersistent ? `<div class="toast-progress"></div>` : ''}
        `;

        // Manage max toasts
        this.manageToastCount();

        // Add to container
        this.container.appendChild(toast);

        // Show toast with animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Set up close button
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => this.closeToast(toast));

        // Set auto-dismiss if not persistent
        if (!isPersistent && duration > 0) {
            // Animate progress bar
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }

            // Set timeout to remove toast
            setTimeout(() => {
                if (toast.parentNode) {
                    this.closeToast(toast);
                }
            }, duration);
        }

        return toast;
    },

    // Close a toast
    closeToast(toast) {
        toast.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // match the CSS transition time
    },

    // Manage the maximum number of toasts
    manageToastCount() {
        const toasts = this.container.querySelectorAll('.toast');
        if (toasts.length >= this.maxToasts) {
            // Remove the oldest toasts if we exceed the maximum
            for (let i = 0; i < toasts.length - this.maxToasts + 1; i++) {
                this.closeToast(toasts[i]);
            }
        }
    },

    // Show success toast
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    },

    // Show error toast
    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    },

    // Show warning toast
    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    },

    // Show info toast
    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    },

    // Show persistent toast that doesn't auto-dismiss
    persistent(message, type = 'info') {
        return this.show(message, type, 0, true);
    }
};

export default ToastService;