// src/services/rateLimiter.js
export const RateLimiter = {
    operations: new Map(),
    limits: {
        addTask: { max: 15, window: 60000, message: 'Please wait before adding more tasks' },
        updateTask: { max: 15, window: 60000, message: 'Too many updates. Please wait' },
        deleteTask: { max: 15, window: 60000, message: 'Too many deletions. Please wait' },
        logHistory: { max: 25, window: 60000, message: 'Too many history entries' }
    },

    checkLimit(operationType, userId) {
        const now = Date.now();
        const limit = this.limits[operationType];
        if (!limit) return true;

        const key = `${operationType}_${userId}`;
        const userOps = this.operations.get(key) || [];
        const recentOps = userOps.filter(time => now - time < limit.window);

        if (recentOps.length >= limit.max) {
            throw new Error(limit.message);
        }

        recentOps.push(now);
        this.operations.set(key, recentOps);

        // Cleanup old operations
        setTimeout(() => {
            const ops = this.operations.get(key) || [];
            this.operations.set(key, ops.filter(time => now - time < limit.window));
        }, limit.window);
    }
};