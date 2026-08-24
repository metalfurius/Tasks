import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    applySnapshotChanges,
    cloneTaskList,
    mergeTaskList,
    removeTaskList,
    sortTaskList
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

test('pagination and live adds merge the same document only once', () => {
    const initialPage = [task('page-1', 10), task('page-2', 20)];
    const merged = mergeTaskList(initialPage, [
        task('page-2', 5, { text: 'Updated after pagination' }),
        task('page-3', 30),
        task('page-4', 40)
    ]);

    assert.deepEqual(merged.map(item => item.id), ['page-2', 'page-1', 'page-3', 'page-4']);
    assert.equal(merged.filter(item => item.id === 'page-2').length, 1);
    assert.equal(merged[0].text, 'Updated after pagination');
});

test('removals reconcile by id even when Firestore provides no removed payload', () => {
    const result = applySnapshotChanges(
        [task('owned', 10), task('other', 20)],
        [{ type: 'removed', id: 'owned', data: {} }],
        'synthetic-user-a'
    );

    assert.equal(result.changed, true);
    assert.deepEqual(result.tasks.map(item => item.id), ['other']);
});

test('equal orders remain stable by document id', () => {
    const sorted = sortTaskList([
        task('z', 10),
        task('a', 10),
        task('m', Number.NaN)
    ]);

    assert.deepEqual(sorted.map(item => item.id), ['a', 'z', 'm']);
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
