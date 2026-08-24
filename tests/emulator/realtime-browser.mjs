import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const fixturePath = join(root, 'tests/browser/realtime-state.html');
const server = createServer(async (_request, response) => {
    try {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(await readFile(fixturePath));
    } catch {
        response.writeHead(404).end();
    }
});

const ownerId = 'synthetic-realtime-user';
const prefix = `realtime-${Date.now()}-`;
const task = (id, order, overrides = {}) => ({
    id: `${prefix}${id}`,
    text: `${prefix}${id}`,
    userId: ownerId,
    completed: false,
    order,
    ...overrides
});

async function waitForCount(page, count) {
    await page.waitForFunction(expected => window.__realtimeState.length === expected, count);
}

let browser;
let contextA;
let contextB;
const screenshotPaths = [
    join(root, 'realtime-state-desktop.png'),
    join(root, 'realtime-state-mobile.png')
];
try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const url = `http://127.0.0.1:${port}/?emulatorHost=${encodeURIComponent(emulatorHost)}`;

    browser = await chromium.launch({ headless: true });
    contextA = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    contextB = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    for (const page of [pageA, pageB]) {
        page.on('pageerror', error => console.error(`Realtime fixture page error: ${error.message}`));
        page.on('requestfailed', request => console.error(`Realtime fixture request failed: ${request.url()} ${request.failure()?.errorText || ''}`));
    }
    await Promise.all([pageA.goto(url), pageB.goto(url)]);
    await Promise.all([
        pageA.evaluate(userId => window.startListener(userId), ownerId),
        pageB.evaluate(userId => window.startListener(userId), ownerId)
    ]);

    const initialTasks = Array.from({ length: 7 }, (_, index) => task(`page-${index + 1}`, index + 1));
    await pageB.evaluate(async tasks => {
        for (const item of tasks) await window.writeTask(item);
    }, initialTasks);
    await Promise.all([waitForCount(pageA, 7), waitForCount(pageB, 7)]);

    await pageB.evaluate(taskItem => window.writeTask(taskItem), {
        ...task('foreign', 0),
        userId: 'synthetic-realtime-other-user'
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal((await pageA.evaluate(() => window.__realtimeState)).length, 7);
    assert.equal(
        await pageA.evaluate(() => window.__realtimeState.some(item => item.userId === 'synthetic-realtime-other-user')),
        false
    );

    await pageB.evaluate(async ({ id, text }) => window.updateTask(id, { text }), {
        id: `${prefix}page-2`,
        text: `${prefix}remote-edit`
    });
    await pageB.evaluate(id => window.updateTask(id, { completed: true, order: 0 }), `${prefix}page-3`);
    await pageB.evaluate(id => window.deleteTask(id), `${prefix}page-4`);
    await Promise.all([waitForCount(pageA, 6), waitForCount(pageB, 6)]);
    await Promise.all([
        pageA.waitForFunction(({ id, text }) => window.__realtimeState.find(item => item.id === id)?.text === text, {
            id: `${prefix}page-2`,
            text: `${prefix}remote-edit`
        }),
        pageB.waitForFunction(id => window.__realtimeState.find(item => item.id === id)?.completed === true, `${prefix}page-3`)
    ]);

    const statesAfterRemoteChanges = await Promise.all([
        pageA.evaluate(() => window.__realtimeState),
        pageB.evaluate(() => window.__realtimeState)
    ]);
    assert.deepEqual(statesAfterRemoteChanges[0], statesAfterRemoteChanges[1]);
    assert.equal(statesAfterRemoteChanges[0].find(item => item.id === `${prefix}page-2`).text, `${prefix}remote-edit`);
    assert.equal(statesAfterRemoteChanges[0].find(item => item.id === `${prefix}page-3`).completed, true);
    assert.equal(statesAfterRemoteChanges[0].some(item => item.id === `${prefix}page-4`), false);
    assert.equal(await pageA.locator('#live-status').getAttribute('aria-live'), 'polite');
    await pageA.screenshot({ path: screenshotPaths[0] });
    await pageB.screenshot({ path: screenshotPaths[1] });

    await pageA.evaluate(() => window.setOffline());
    await pageB.evaluate(taskItem => window.writeTask(taskItem), task('offline', 8));
    await waitForCount(pageB, 7);
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal((await pageA.evaluate(() => window.__realtimeState)).length, 6);
    await pageA.evaluate(() => window.setOnline());
    await waitForCount(pageA, 7);

    const idsForBulkDelete = await pageB.evaluate(() => window.__realtimeState.map(item => item.id));
    await pageB.evaluate(ids => window.bulkDelete(ids), idsForBulkDelete);
    await Promise.all([waitForCount(pageA, 0), waitForCount(pageB, 0)]);
    assert.match(await pageA.locator('#live-status').textContent(), /Tasks synchronized: 0/);

    await pageA.evaluate(() => window.stopListener());
    await pageB.evaluate(() => window.stopListener());
    const stateBeforeCleanupWrite = await pageA.evaluate(() => window.__realtimeState);
    await pageB.evaluate(taskItem => window.writeTask(taskItem), task('after-cleanup', 9));
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.deepEqual(await pageA.evaluate(() => window.__realtimeState), stateBeforeCleanupWrite);

    console.log('synthetic realtime two-context fixture passed.');
} finally {
    await Promise.all(screenshotPaths.map(path => unlink(path).catch(() => {})));
    await contextA?.close();
    await contextB?.close();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
