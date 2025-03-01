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

    show(message, type = 'success', duration = 3000) {
        this.init(); // Ensure container exists

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

        // Set up removal function
        const removeToast = () => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            }, { once: true });
        };

        // Add close button for all toasts
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', removeToast);
        toast.appendChild(closeBtn);

        // Set timeout for auto-dismissal if duration is provided
        if (duration > 0) {
            const timeout = setTimeout(removeToast, duration);

            // Clear timeout if toast is removed early
            toast.addEventListener('click', (e) => {
                if (e.target !== closeBtn) { // Don't trigger on close button click
                    clearTimeout(timeout);
                    removeToast();
                }
            });
        }

        return toast; // Return toast element for possible further manipulation
    },

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 5000) { // Longer duration for errors
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 4000) { // Medium duration for warnings
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },

    // New method for persistent toasts
    persistent(message, type = 'info') {
        return this.show(message, type, 0); // 0 means persistent
    }
};

export default ToastService;