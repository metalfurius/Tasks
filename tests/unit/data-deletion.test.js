import assert from 'node:assert/strict';
import test from 'node:test';
import { runOwnedDeletion } from '../../src/services/dataDeletion.js';

function memoryCollection(name, size, options = {}) {
    const documents = Array.from({ length: size }, (_, id) => ({ id: `${name}-${id}` }));
    const state = {
        queryCalls: 0,
        deleteCalls: 0,
        deleteAttempts: 0,
        verifyCalls: 0,
        documents,
        ...options
    };

    return {
        state,
        name,
        queryPage: async batchSize => {
            state.queryCalls += 1;
            return { docs: state.documents.slice(0, batchSize) };
        },
        deleteBatch: async docs => {
            state.deleteCalls += 1;
            state.deleteAttempts += 1;
            if (state.failDeleteAttempts?.includes(state.deleteAttempts)) {
                const error = new Error(`synthetic delete failure ${state.deleteAttempts}`);
                error.retryable = state.retryable !== false;
                throw error;
            }
            const ids = new Set(docs.map(document => document.id));
            state.documents = state.documents.filter(document => !ids.has(document.id));
        },
        verifyRemaining: async () => {
            state.verifyCalls += 1;
            return state.verifyOverride ?? state.documents.length;
        }
    };
}

test('empty, small, and 501-document datasets complete in bounded batches', async () => {
    const progress = [];
    const empty = memoryCollection('empty', 0);
    const small = memoryCollection('small', 10);
    const large = memoryCollection('large', 501);

    const result = await runOwnedDeletion({
        collections: [empty, small, large],
        batchSize: 450,
        delay: async () => {},
        onProgress: event => progress.push(event)
    });

    assert.equal(result.status, 'complete');
    assert.equal(result.deleted, 511);
    assert.equal(empty.state.deleteCalls, 0);
    assert.equal(small.state.deleteCalls, 1);
    assert.equal(large.state.deleteCalls, 2);
    assert.equal(large.state.documents.length, 0);
    assert.equal(large.state.verifyCalls, 1);
    assert.ok(progress.some(event => event.phase === 'verified' && event.collection === 'large'));
});

test('retryable batch failures are bounded and reported in progress', async () => {
    const collection = memoryCollection('retry', 10, { failDeleteAttempts: [1] });
    const retries = [];

    const result = await runOwnedDeletion({
        collections: [collection],
        batchSize: 10,
        maxRetries: 2,
        delay: async () => {},
        onProgress: event => {
            if (event.phase === 'retry') retries.push(event);
        }
    });

    assert.equal(result.status, 'complete');
    assert.equal(collection.state.deleteAttempts, 2);
    assert.equal(retries.length, 1);
    assert.equal(retries[0].retryCount, 1);
});

test('cancellation stops before the next query and returns a resumable result', async () => {
    const collection = memoryCollection('cancelled', 10);
    let cancelled = false;

    const result = await runOwnedDeletion({
        collections: [collection],
        batchSize: 5,
        shouldCancel: () => cancelled,
        delay: async () => {},
        onProgress: event => {
            if (event.phase === 'deleted') cancelled = true;
        }
    });

    assert.equal(result.status, 'cancelled');
    assert.equal(result.deleted, 5);
    assert.equal(collection.state.documents.length, 5);
});

test('non-retryable failures and failed verification never report success', async () => {
    const failed = memoryCollection('failed', 10, { failDeleteAttempts: [1], retryable: false });
    const result = await runOwnedDeletion({
        collections: [failed],
        batchSize: 10,
        delay: async () => {}
    });
    assert.equal(result.status, 'partial-failure');
    assert.equal(result.deleted, 0);
    assert.equal(failed.state.documents.length, 10);

    const unverifiable = memoryCollection('unverifiable', 0, { verifyOverride: 1 });
    const verificationResult = await runOwnedDeletion({
        collections: [unverifiable],
        delay: async () => {}
    });
    assert.equal(verificationResult.status, 'partial-failure');
    assert.equal(verificationResult.remaining, 1);
});
