import taskService from './taskService.js?v=tasks-untrusted-content-rendering-v1';
import historyService from './historyService.js?v=tasks-untrusted-content-rendering-v1';
import ToastService from './toastService.js?v=tasks-untrusted-content-rendering-v1';
import authService from './authService.js?v=tasks-untrusted-content-rendering-v1';
import { runOwnedDeletion } from './dataDeletion.js?v=tasks-untrusted-content-rendering-v1';
import {
    collection,
    getDocs,
    limit,
    query,
    where,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebase.js?v=tasks-untrusted-content-rendering-v1';

function ownedCollection(name, userId, filters = []) {
    return {
        name,
        queryPage: async batchSize => {
            const snapshot = await getDocs(query(
                collection(db, name),
                where('userId', '==', userId),
                ...filters,
                limit(batchSize)
            ));
            return { docs: snapshot.docs };
        },
        deleteBatch: async docs => {
            const batch = writeBatch(db);
            docs.forEach(documentSnapshot => batch.delete(documentSnapshot.ref));
            await batch.commit();
        },
        verifyRemaining: async () => {
            const snapshot = await getDocs(query(
                collection(db, name),
                where('userId', '==', userId),
                ...filters,
                limit(1)
            ));
            return snapshot.size;
        }
    };
}

function authRequiredResult(totalCollections = 2) {
    const error = new Error('Authentication is required before deleting Taskify data.');
    return {
        status: 'partial-failure',
        deleted: 0,
        completedCollections: 0,
        totalCollections,
        error,
        message: error.message
    };
}

const DataCleanupService = {
    async reconcileLocalState() {
        await Promise.all([
            taskService.refresh(),
            historyService.refresh()
        ]);
    },

    async deleteAllUserData({ signal, onProgress } = {}) {
        const userId = authService.getCurrentUserId();
        if (!userId) return authRequiredResult();

        const result = await runOwnedDeletion({
            collections: [
                ownedCollection('tasks', userId),
                ownedCollection('history', userId)
            ],
            shouldCancel: () => Boolean(signal?.aborted),
            onProgress
        });

        try {
            await this.reconcileLocalState();
        } catch (error) {
            return {
                ...result,
                status: 'partial-failure',
                error,
                message: `Server deletion result was ${result.status}, but local state could not be refreshed: ${error.message}`
            };
        }

        if (result.status === 'complete') {
            ToastService.success('All Taskify tasks and history were deleted. Your Google/Firebase account remains active.');
        } else if (result.status === 'cancelled') {
            ToastService.warning(`Deletion cancelled after ${result.deleted} documents. Retry to resume safely.`);
        } else {
            const detail = result.error?.message || 'server verification did not pass';
            ToastService.error(`Deletion incomplete after ${result.deleted} documents: ${detail}`);
        }

        return result;
    },

    async deleteAllTasks(options = {}) {
        const userId = authService.getCurrentUserId();
        if (!userId) return authRequiredResult(1);

        const result = await runOwnedDeletion({
            collections: [ownedCollection('tasks', userId)],
            shouldCancel: () => Boolean(options.signal?.aborted),
            onProgress: options.onProgress
        });
        await taskService.refresh();
        return result;
    },

    async clearPendingTasks({ signal, onProgress } = {}) {
        const userId = authService.getCurrentUserId();
        if (!userId) return authRequiredResult(1);

        const result = await runOwnedDeletion({
            collections: [ownedCollection('tasks', userId, [where('completed', '==', false)])],
            shouldCancel: () => Boolean(signal?.aborted),
            onProgress
        });

        try {
            await this.reconcileLocalState();
        } catch (error) {
            return {
                ...result,
                status: 'partial-failure',
                error,
                message: `Pending-task deletion finished with ${result.status}, but local state could not be refreshed: ${error.message}`
            };
        }

        if (result.status === 'complete') {
            if (result.deleted > 0) {
                try {
                    await historyService.logAction('Cleared all pending tasks', `${result.deleted} tasks deleted`);
                    await historyService.refresh();
                } catch (error) {
                    // The task deletion and its verification are still complete;
                    // surface the audit-log issue without claiming task failure.
                    ToastService.error(`Pending tasks were deleted, but the audit entry failed: ${error.message}`);
                }
            }
            ToastService.warning(`${result.deleted} pending tasks were deleted and verified.`);
        } else if (result.status === 'cancelled') {
            ToastService.warning(`Pending-task deletion cancelled after ${result.deleted} documents. Retry to resume.`);
        } else {
            const detail = result.error?.message || 'server verification did not pass';
            ToastService.error(`Pending-task deletion incomplete after ${result.deleted} documents: ${detail}`);
        }

        return result;
    }
};

export default DataCleanupService;
