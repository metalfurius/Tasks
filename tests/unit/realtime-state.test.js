import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    applySnapshotChanges,
    cloneTaskList,
    mergeTaskList,
    removeTaskList
} from '../../src/utils/taskState.js';

const task = (id, order, overrides = {}) => ({
    id,
    text: `Task ${id}`,
    userId: 'synthetic-user-a',
    completed: false,
    order,
    timestamp: `timestamp-${id}`,
    ...overrides
});

test('realtime changes reconcile by document id and keep deterministic order', () => {
    const initial = [task('page-2', 20), task('page-1', 10)];
    const result = applySnapshotChanges(initial, [
        { type: 'added', id: 'remote-new', data: task('remote-new', 15) },
        { type: 'modified', id: 'page-1', data: task('page-1', 30, { text: 'Updated remotely' }) },
        { type: 'removed', id: 'page-2', data: task('page-2', 20) }
    ], 'synthetic-user-a');

    assert.equal(result.changed, true);
    assert.deepEqual(result.tasks.map(item => item.id), ['remote-new', 'page-1']);
    assert.equal(result.tasks[1].text, 'Updated remotely');
});

test('ownership filtering prevents another user from entering local state', () => {
    const initial = [task('owned', 10)];
    const result = applySnapshotChanges(initial, [
        { type: 'added', id: 'foreign', data: task('foreign', 1, { userId: 'synthetic-user-b' }) },
        { type: 'modified', id: 'owned', data: task('owned', 11, { userId: 'synthetic-user-b' }) },
        { type: 'removed', id: 'owned', data: task('owned', 10, { userId: 'synthetic-user-b' }) }
    ], 'synthetic-user-a');

    assert.equal(result.changed, false);
    assert.deepEqual(result.tasks, initial);
});

test('optimistic state can restore the exact previous snapshot after failure', () => {
    const before = [task('a', 10), task('b', 20)];
    const snapshot = cloneTaskList(before);
    const optimistic = mergeTaskList(before, [task('b', 0, { text: 'temporary update' })]);
    const removed = removeTaskList(optimistic, ['a']);
    const restored = cloneTaskList(snapshot);

    assert.deepEqual(restored, before);
    assert.notDeepEqual(removed, restored);
    assert.deepEqual(snapshot, before);
});
