import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createTaskElement } from '../../src/components/tasks/taskRenderer.js';
import { createHistoryItemElement } from '../../src/components/history/historyRenderer.js';
import { createSearchEmptyState, getTextWithLineBreaks } from '../../src/utils/dom.js';
import ToastService from '../../src/services/toastService.js';
import { runOwnedDeletion } from '../../src/services/dataDeletion.js';

const projectId = 'tasks-untrusted-test';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const documentsBase = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`;
const resourceDocumentsBase = `projects/${projectId}/databases/(default)/documents`;
const taskDocument = `${documentsBase}/tasks/synthetic-untrusted-rendering-task`;
const historyDocument = `${documentsBase}/history/synthetic-untrusted-rendering-history`;

const payload = 'Unicode: caf\u00e9 \u2014 \u4e2d\u6587\n<img src=x onerror="window.__executed=1"><svg/onload="window.__executed=1">';

function stringField(value) {
    return { stringValue: value };
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const body = await response.text();
    if (!response.ok) {
        throw new Error(`${options.method || 'GET'} ${url} failed (${response.status}): ${body}`);
    }
    return body ? JSON.parse(body) : null;
}

async function writeDocument(url, fields) {
    await request(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields })
    });
}

async function deleteDocument(url) {
    try {
        await request(url, { method: 'DELETE' });
    } catch (error) {
        if (!String(error.message).includes('(404)')) throw error;
    }
}

async function commitWrites(writes) {
    if (writes.length === 0) return;
    for (let offset = 0; offset < writes.length; offset += 400) {
        await request(`${documentsBase}:commit`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ writes: writes.slice(offset, offset + 400) })
        });
    }
}

function fieldFilter(fieldPath, value) {
    return {
        fieldFilter: {
            field: { fieldPath },
            op: 'EQUAL',
            value
        }
    };
}

async function queryDocuments(collectionName, userId, batchSize, completed) {
    const filters = [fieldFilter('userId', stringField(userId))];
    if (typeof completed === 'boolean') filters.push(fieldFilter('completed', { booleanValue: completed }));
    const where = filters.length === 1
        ? filters[0]
        : { compositeFilter: { op: 'AND', filters } };
    const results = await request(`${documentsBase}:runQuery`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: collectionName }],
                where,
                limit: batchSize
            }
        })
    });
    return results.filter(result => result.document).map(result => result.document);
}

function ownedSpec(collectionName, userId, completed) {
    return {
        name: collectionName,
        queryPage: async batchSize => ({ docs: await queryDocuments(collectionName, userId, batchSize, completed) }),
        deleteBatch: async documents => commitWrites(documents.map(document => ({ delete: document.name }))),
        verifyRemaining: async () => (await queryDocuments(collectionName, userId, 1, completed)).length
    };
}

function updateDocument(name, fields) {
    return { update: { name, fields } };
}

function documentName(collectionName, id) {
    return `${resourceDocumentsBase}/${collectionName}/${id}`;
}

function readStringField(document, name) {
    return document.fields?.[name]?.stringValue;
}

let dom;
const createdDataNames = [];
try {
    await writeDocument(taskDocument, {
        text: stringField(payload),
        userId: stringField('synthetic-emulator-user'),
        completed: { booleanValue: false }
    });
    await writeDocument(historyDocument, {
        action: stringField('Task created'),
        taskText: stringField(payload),
        userId: stringField('synthetic-emulator-user')
    });

    const taskSnapshot = await request(taskDocument);
    const historySnapshot = await request(historyDocument);
    assert.equal(readStringField(taskSnapshot, 'text'), payload);
    assert.equal(readStringField(historySnapshot, 'taskText'), payload);

    dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;

    const task = createTaskElement({ id: 'synthetic-untrusted-rendering-task', text: readStringField(taskSnapshot, 'text'), completed: false });
    const history = createHistoryItemElement({
        action: readStringField(historySnapshot, 'action'),
        taskText: readStringField(historySnapshot, 'taskText'),
        timestamp: new Date('2026-01-01T00:00:00Z')
    });
    const empty = createSearchEmptyState('No history', payload);
    ToastService.init();
    const toast = ToastService.persistent(payload, 'warning');

    assert.equal(getTextWithLineBreaks(task.querySelector('.task-content')), payload);
    assert.equal(task.querySelector('img,svg,script,iframe'), null);
    assert.equal(history.querySelector('.history-item > div:nth-child(2)').textContent, payload);
    assert.equal(history.querySelector('img,svg,script,iframe'), null);
    assert.match(empty.textContent, /<img src=x onerror=/);
    assert.equal(empty.querySelector('img,svg,script,iframe'), null);
    assert.equal(toast.querySelector('.toast-content').textContent, payload);
    assert.equal(toast.querySelector('img,svg,script,iframe'), null);
    assert.equal(window.__executed || 0, 0);

    for (const [label, count] of [['zero', 0], ['ten', 10], ['five-hundred-one', 501]]) {
        const userId = `erasure-${label}`;
        const otherUserId = `${userId}-other`;
        const writes = [];
        for (let index = 0; index < count; index += 1) {
            const taskName = documentName('tasks', `${label}-task-${index}`);
            const historyName = documentName('history', `${label}-history-${index}`);
            createdDataNames.push(taskName, historyName);
            writes.push(updateDocument(taskName, {
                userId: stringField(userId),
                completed: { booleanValue: index % 2 === 0 },
                text: stringField(`Task ${index}`)
            }));
            writes.push(updateDocument(historyName, {
                userId: stringField(userId),
                action: stringField('Task created'),
                taskText: stringField(`Task ${index}`)
            }));
        }

        const otherTaskName = documentName('tasks', `${label}-other-task`);
        const otherHistoryName = documentName('history', `${label}-other-history`);
        createdDataNames.push(otherTaskName, otherHistoryName);
        writes.push(updateDocument(otherTaskName, {
            userId: stringField(otherUserId),
            completed: { booleanValue: false },
            text: stringField('Other user task')
        }));
        writes.push(updateDocument(otherHistoryName, {
            userId: stringField(otherUserId),
            action: stringField('Other user action'),
            taskText: stringField('Other user task')
        }));
        await commitWrites(writes);

        const result = await runOwnedDeletion({
            collections: [ownedSpec('tasks', userId), ownedSpec('history', userId)],
            batchSize: 450,
            delay: async () => {}
        });
        assert.equal(result.status, 'complete', `${label} dataset did not complete`);
        assert.equal(result.deleted, count * 2);
        assert.equal((await queryDocuments('tasks', userId, 1)).length, 0);
        assert.equal((await queryDocuments('history', userId, 1)).length, 0);
        assert.equal((await queryDocuments('tasks', otherUserId, 10)).length, 1);
        assert.equal((await queryDocuments('history', otherUserId, 10)).length, 1);
    }

    const cancelUser = 'erasure-cancel';
    const cancelWrites = Array.from({ length: 10 }, (_, index) => {
        const name = documentName('tasks', `cancel-task-${index}`);
        createdDataNames.push(name);
        return updateDocument(name, {
            userId: stringField(cancelUser),
            completed: { booleanValue: false },
            text: stringField(`Cancel ${index}`)
        });
    });
    await commitWrites(cancelWrites);
    let cancelled = false;
    const cancelledResult = await runOwnedDeletion({
        collections: [ownedSpec('tasks', cancelUser)],
        batchSize: 5,
        shouldCancel: () => cancelled,
        onProgress: event => {
            if (event.phase === 'deleted') cancelled = true;
        },
        delay: async () => {}
    });
    assert.equal(cancelledResult.status, 'cancelled');
    assert.equal((await queryDocuments('tasks', cancelUser, 20)).length, 5);
    const resumedResult = await runOwnedDeletion({
        collections: [ownedSpec('tasks', cancelUser)],
        batchSize: 450,
        delay: async () => {}
    });
    assert.equal(resumedResult.status, 'complete');
    assert.equal((await queryDocuments('tasks', cancelUser, 1)).length, 0);

    const failureUser = 'erasure-failure';
    const failureName = documentName('tasks', 'failure-task');
    createdDataNames.push(failureName);
    await commitWrites([updateDocument(failureName, {
        userId: stringField(failureUser),
        completed: { booleanValue: false },
        text: stringField('Failure')
    })]);
    const failingSpec = ownedSpec('tasks', failureUser);
    const originalDeleteBatch = failingSpec.deleteBatch;
    failingSpec.deleteBatch = async () => {
        const error = new Error('synthetic emulator failure');
        error.retryable = false;
        throw error;
    };
    const failureResult = await runOwnedDeletion({
        collections: [failingSpec],
        delay: async () => {}
    });
    assert.equal(failureResult.status, 'partial-failure');
    assert.equal((await queryDocuments('tasks', failureUser, 1)).length, 1);
    failingSpec.deleteBatch = originalDeleteBatch;
    const repairedResult = await runOwnedDeletion({ collections: [failingSpec], delay: async () => {} });
    assert.equal(repairedResult.status, 'complete');

    console.log('Firestore emulator ownership, 0/10/501 batching, cancellation, failure, and verification passed.');

    console.log('Firestore emulator round trip and inert rendering passed.');
} finally {
    await commitWrites(createdDataNames.map(name => ({ delete: name })));
    await deleteDocument(historyDocument);
    await deleteDocument(taskDocument);
    if (dom) dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    ToastService.container = null;
}
