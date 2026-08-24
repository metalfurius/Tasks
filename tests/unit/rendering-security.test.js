import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createEmptyState, createSearchEmptyState, getTextWithLineBreaks, setTextWithLineBreaks } from '../../src/utils/dom.js';
import { createTaskElement } from '../../src/components/tasks/taskRenderer.js';
import { createHistoryItemElement } from '../../src/components/history/historyRenderer.js';
import ToastService from '../../src/services/toastService.js';

const payloads = [
    '<img src=x onerror="window.__executed=1">',
    '<svg/onload="window.__executed=1">',
    '" autofocus onfocus="window.__executed=1',
    '&lt;script&gt;window.__executed=1&lt;/script&gt;',
    '<div><span><img src=x onerror="window.__executed=1"></span></div>'
];

let dom;

beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
});

afterEach(() => {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    ToastService.container = null;
});

test('task cards render representative payloads as inert text', () => {
    for (const payload of payloads) {
        const task = createTaskElement({ id: payload, text: payload, completed: false });
        const content = task.querySelector('.task-content');

        assert.equal(getTextWithLineBreaks(content), payload);
        assert.equal(content.querySelector('img,svg,script,iframe'), null);
        assert.equal(content.querySelector('[onerror],[onload],[onfocus]'), null);
        assert.equal(content.childNodes[0].nodeType, dom.window.Node.TEXT_NODE);
        assert.equal(task.dataset.id, payload);
    }
});

test('edit text survives line-break rendering and a reload round trip', () => {
    const text = 'Unicode: café — 中文\npunctuation: <img src=x onerror="window.__executed=1">';
    const content = document.createElement('div');
    setTextWithLineBreaks(content, text);
    document.body.appendChild(content);

    assert.equal(getTextWithLineBreaks(content), text);
    assert.equal(content.querySelector('img'), null);

    const reloaded = new JSDOM(`<body>${content.innerHTML}</body>`);
    const reloadedContent = reloaded.window.document.body;
    assert.equal(getTextWithLineBreaks(reloadedContent), text);
    assert.equal(reloadedContent.querySelector('img,svg,script'), null);
    reloaded.window.close();
});

test('history entries and search empty states keep payloads as text', () => {
    const payload = payloads[4];
    const history = createHistoryItemElement({
        action: 'Task edited',
        taskText: payload,
        timestamp: new Date('2026-01-01T00:00:00Z')
    });
    const empty = createSearchEmptyState('No history', payload);

    assert.equal(history.querySelector('img,svg,script'), null);
    assert.equal(history.querySelector('.history-item > div:nth-child(2)').textContent, payload);
    assert.match(empty.textContent, new RegExp(payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(empty.querySelector('img,svg,script'), null);
});

test('toast messages are text and cannot create event attributes or elements', () => {
    ToastService.init();
    const toast = ToastService.persistent(payloads[0], 'warning');
    const content = toast.querySelector('.toast-content');

    assert.equal(content.textContent, payloads[0]);
    assert.equal(content.querySelector('img,svg,script'), null);
    assert.equal(toast.querySelector('[onerror],[onload]'), null);
    assert.equal(toast.getAttribute('role'), 'status');
    assert.equal(toast.getAttribute('aria-live'), 'polite');

    const errorToast = ToastService.error(payloads[0]);
    assert.equal(errorToast.getAttribute('role'), 'alert');
    assert.equal(errorToast.getAttribute('aria-live'), 'assertive');
});

test('empty states use a text node for encoded and quoted search terms', () => {
    const search = '" <svg onload=alert(1)> & café';
    const empty = createEmptyState(`No tasks matching "${search}"`);

    assert.equal(empty.textContent, `No tasks matching "${search}"`);
    assert.equal(empty.querySelector('svg,script,img'), null);
});
