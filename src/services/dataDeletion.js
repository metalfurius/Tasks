export const DELETION_BATCH_SIZE = 450;
export const DELETION_MAX_RETRIES = 3;

const RETRYABLE_CODES = new Set([
    'aborted',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
    'unavailable'
]);

export class DeletionCancelledError extends Error {
    constructor() {
        super('Data deletion was cancelled.');
        this.name = 'DeletionCancelledError';
    }
}

export function isRetryableDeletionError(error) {
    if (error?.retryable === true) return true;
    const code = String(error?.code || '').replace(/^firebase\//, '');
    return RETRYABLE_CODES.has(code);
}

function defaultDelay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

async function withBoundedRetries(operation, {
    maxRetries,
    isRetryableError,
    shouldCancel,
    delay,
    onRetry
}) {
    let retryCount = 0;

    while (true) {
        if (shouldCancel()) throw new DeletionCancelledError();

        try {
            return await operation();
        } catch (error) {
            if (
                retryCount >= maxRetries ||
                !isRetryableError(error) ||
                shouldCancel()
            ) {
                throw error;
            }

            retryCount += 1;
            const waitMilliseconds = Math.min(1000 * (2 ** (retryCount - 1)), 4000);
            onRetry({ retryCount, waitMilliseconds, error });
            await delay(waitMilliseconds);
        }
    }
}

function normalizePage(page) {
    if (Array.isArray(page)) return { docs: page };
    return { docs: Array.isArray(page?.docs) ? page.docs : [] };
}

/**
 * Deletes documents returned by collection specs until every postcondition is
 * verified. A deleteBatch implementation must be atomic for its page.
 */
export async function runOwnedDeletion({
    collections,
    batchSize = DELETION_BATCH_SIZE,
    maxRetries = DELETION_MAX_RETRIES,
    isRetryableError = isRetryableDeletionError,
    shouldCancel = () => false,
    delay = defaultDelay,
    onProgress = () => {}
}) {
    if (!Array.isArray(collections) || collections.length === 0) {
        throw new Error('At least one deletion collection is required.');
    }

    let deleted = 0;
    let completedCollections = 0;
    let lastCollection = null;

    const progress = (details = {}) => {
        onProgress({
            status: 'running',
            deleted,
            completedCollections,
            totalCollections: collections.length,
            ...details
        });
    };

    try {
        for (const collection of collections) {
            if (!collection?.name || typeof collection.queryPage !== 'function' || typeof collection.deleteBatch !== 'function' || typeof collection.verifyRemaining !== 'function') {
                throw new Error('Deletion collection is missing a required operation.');
            }

            lastCollection = collection.name;
            let batches = 0;

            while (true) {
                if (shouldCancel()) throw new DeletionCancelledError();

                progress({
                    phase: 'query',
                    collection: collection.name,
                    batches
                });

                const page = normalizePage(await withBoundedRetries(
                    () => collection.queryPage(batchSize),
                    { maxRetries, isRetryableError, shouldCancel, delay, onRetry: details => progress({
                        phase: 'retry',
                        collection: collection.name,
                        batches,
                        ...details
                    }) }
                ));

                if (page.docs.length === 0) break;

                progress({
                    phase: 'delete',
                    collection: collection.name,
                    batchSize: page.docs.length,
                    batches
                });

                await withBoundedRetries(
                    () => collection.deleteBatch(page.docs),
                    { maxRetries, isRetryableError, shouldCancel, delay, onRetry: details => progress({
                        phase: 'retry',
                        collection: collection.name,
                        batches,
                        ...details
                    }) }
                );

                deleted += page.docs.length;
                batches += 1;
                progress({
                    phase: 'deleted',
                    collection: collection.name,
                    batchSize: page.docs.length,
                    batches
                });
            }

            if (shouldCancel()) throw new DeletionCancelledError();

            const remaining = await withBoundedRetries(
                () => collection.verifyRemaining(),
                { maxRetries, isRetryableError, shouldCancel, delay, onRetry: details => progress({
                    phase: 'retry',
                    collection: collection.name,
                    batches,
                    ...details
                }) }
            );

            if (Number(remaining) > 0) {
                return {
                    status: 'partial-failure',
                    deleted,
                    completedCollections,
                    collection: collection.name,
                    remaining: Number(remaining),
                    error: new Error(`Verification found ${Number(remaining)} remaining ${collection.name} document(s).`)
                };
            }

            completedCollections += 1;
            progress({ phase: 'verified', collection: collection.name, batches });
        }

        const result = {
            status: 'complete',
            deleted,
            completedCollections,
            totalCollections: collections.length
        };
        onProgress({ ...result, phase: 'complete' });
        return result;
    } catch (error) {
        if (error instanceof DeletionCancelledError) {
            const result = {
                status: 'cancelled',
                deleted,
                completedCollections,
                totalCollections: collections.length,
                collection: lastCollection
            };
            onProgress({ ...result, phase: 'cancelled' });
            return result;
        }

        const result = {
            status: 'partial-failure',
            deleted,
            completedCollections,
            totalCollections: collections.length,
            collection: lastCollection,
            error,
            message: getErrorMessage(error)
        };
        onProgress({ ...result, phase: 'partial-failure' });
        return result;
    }
}
