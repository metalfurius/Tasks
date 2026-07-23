import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createTaskElement } from '../../src/components/tasks/taskRenderer.js';
import { createHistoryItemElement } from '../../src/components/history/historyRenderer.js';
import { createSearchEmptyState, getTextWithLineBreaks } from '../../src/utils/dom.js';
import ToastService from '../../src/services/toastService.js';

const projectId = 'tasks-untrusted-test';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const documentsBase = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`;
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

function readStringField(document, name) {
    return document.fields?.[name]?.stringValue;
}

let dom;
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

    console.log('Firestore emulator round trip and inert rendering passed.');
} finally {
    await deleteDocument(historyDocument);
    await deleteDocument(taskDocument);
    if (dom) dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    ToastService.container = null;
}
