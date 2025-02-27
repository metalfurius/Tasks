// src/services/toastService.js
const ToastService = {
    container: null,
    toastTypes: {
        success: {
            icon: '✅',
            color: 'var(--success-green)'
        },
        error: {
            icon: '❌',
            color: 'var(--delete-red)'
        },
        warning: {
            icon: '⚠️',
            color: 'var(--google-blue)'
        },
        info: {
            icon: 'ℹ️',
            color: 'var(--primary)'
        }
    },

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'success') {
        const toast = document.createElement('div');
        const typeConfig = this.toastTypes[type];

        toast.className = `toast ${type}`;
        toast.style.borderLeftColor = typeConfig.color;

        toast.innerHTML = `
            <span class="toast-icon">${typeConfig.icon}</span>
            <div class="toast-content">${message}</div>
        `;

        // Add toast to container
        this.container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.style.animation = 'slideIn 0.3s ease forwards';
        });

        // Set up removal
        const removeToast = () => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            }, { once: true });
        };

        // Remove after delay
        const timeout = setTimeout(removeToast, 3000);

        // Clear timeout if toast is removed early
        toast.addEventListener('click', () => {
            clearTimeout(timeout);
            removeToast();
        });
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

export default ToastService;