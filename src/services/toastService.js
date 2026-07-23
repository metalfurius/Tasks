// src/services/toastService.js
import { createTextElement } from '../utils/dom.js';

const TOAST_ICONS = {
    default: '\u{1F4DD}',
    success: '\u2705',
    error: '\u274C',
    warning: '\u26A0\uFE0F',
    info: '\u2139\uFE0F'
};

const ToastService = {
    container: null,
    defaultDuration: 8000,
    maxToasts: 5,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = this.defaultDuration, isPersistent = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = TOAST_ICONS[type] || TOAST_ICONS.default;
        const toastContent = createTextElement('div', message, 'toast-content');
        const closeButton = createTextElement('button', '\u00D7', 'toast-close');
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close');

        toast.appendChild(createTextElement('div', icon, 'toast-icon'));
        toast.appendChild(toastContent);
        toast.appendChild(closeButton);

        if (!isPersistent) {
            toast.appendChild(document.createElement('div'));
            toast.lastElementChild.className = 'toast-progress';
        }

        this.manageToastCount();
        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        closeButton.addEventListener('click', () => this.closeToast(toast));

        if (!isPersistent && duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }

            setTimeout(() => {
                if (toast.parentNode) {
                    this.closeToast(toast);
                }
            }, duration);
        }

        return toast;
    },

    closeToast(toast) {
        toast.classList.remove('show');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    manageToastCount() {
        const toasts = this.container.querySelectorAll('.toast');
        if (toasts.length >= this.maxToasts) {
            for (let i = 0; i < toasts.length - this.maxToasts + 1; i++) {
                this.closeToast(toasts[i]);
            }
        }
    },

    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    },

    persistent(message, type = 'info') {
        return this.show(message, type, 0, true);
    }
};

export default ToastService;
