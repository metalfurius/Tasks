import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize, relative } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = process.cwd();
const screenshotDirectory = join(root, 'tests', 'browser', 'screenshots');
mkdirSync(screenshotDirectory, { recursive: true });
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8'
};

const server = createServer((request, response) => {
    try {
        const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
        const relativePath = normalize(requestPath).replace(/^[/\\]+/, '');
        const filePath = join(root, relativePath || 'tests/browser/data-erasure.html');
        if (relative(root, filePath).startsWith('..')) {
            response.writeHead(403).end();
            return;
        }
        response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
        response.end(readFileSync(filePath));
    } catch {
        response.writeHead(404).end();
    }
});

async function waitForResult(page, expectedStatus) {
    await page.waitForFunction(status => window.__lastResult?.status === status, expectedStatus);
}

async function openAndConfirm(page, scenario) {
    await page.evaluate(name => { void window.__startScenario(name); }, scenario);
    await page.waitForSelector('#destructive-confirmation:not(.hidden)');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cleanup-confirm');
    assert.match(await page.locator('#destructive-confirmation-message').textContent(), /all Taskify tasks and all Taskify history/);
    assert.match(await page.locator('#destructive-confirmation-message').textContent(), /account remains active/);
    await page.screenshot({ path: join(screenshotDirectory, `${scenario}-confirmation-${page.viewportSize().width}.png`), fullPage: true });
    await page.click('#cleanup-confirm');
}

let url;
try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    url = `http://127.0.0.1:${port}/tests/browser/data-erasure.html`;

    for (const [name, browserType] of [['webkit', webkit], ['chromium', chromium]]) {
        const browser = await browserType.launch({ headless: true });
        try {
            const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
            const page = await desktop.newPage();
            await page.goto(url, { waitUntil: 'networkidle' });

            await openAndConfirm(page, 'complete');
            await page.waitForSelector('#cleanup-progress');
            await page.screenshot({ path: join(screenshotDirectory, `${name}-complete-progress-desktop.png`), fullPage: true });
            await waitForResult(page, 'complete');
            assert.match(await page.locator('#cleanup-progress').textContent(), /Complete and verified/);
            await page.screenshot({ path: join(screenshotDirectory, `${name}-complete-success-desktop.png`), fullPage: true });
            await page.click('#cleanup-close');
            assert.deepEqual(await page.evaluate(() => window.__reloadState()), { hidden: true });

            await page.reload({ waitUntil: 'networkidle' });
            assert.deepEqual(await page.evaluate(() => window.__reloadState()), { hidden: true });
            const ownership = await page.evaluate(() => window.__runOwnershipScenario());
            assert.equal(ownership.result.status, 'complete');
            assert.deepEqual(ownership.remainingOwners, ['user-b']);

            await openAndConfirm(page, 'cancelled');
            await page.click('#cleanup-cancel');
            await waitForResult(page, 'cancelled');
            assert.match(await page.locator('#cleanup-progress').textContent(), /cancelled/i);
            await page.screenshot({ path: join(screenshotDirectory, `${name}-cancelled-desktop.png`), fullPage: true });
            await page.click('#cleanup-close');

            await openAndConfirm(page, 'partial-failure');
            await waitForResult(page, 'partial-failure');
            assert.equal(await page.locator('#cleanup-error').getAttribute('role'), 'alert');
            assert.match(await page.locator('#cleanup-error').textContent(), /Synthetic permission failure/);
            await page.screenshot({ path: join(screenshotDirectory, `${name}-partial-failure-desktop.png`), fullPage: true });
            await page.click('#cleanup-retry');
            await waitForResult(page, 'complete');
            await page.click('#cleanup-close');
            await desktop.close();

            const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
            const mobilePage = await mobile.newPage();
            await mobilePage.goto(url, { waitUntil: 'networkidle' });
            await openAndConfirm(mobilePage, 'complete');
            await mobilePage.screenshot({ path: join(screenshotDirectory, `${name}-confirmation-mobile.png`), fullPage: true });
            await mobilePage.click('#cleanup-close');
            await mobile.close();
        } finally {
            await browser.close();
        }
        console.log(`${name} data erasure confirmation, progress, cancellation, retry, reload, ownership, and responsive fixture passed.`);
    }
} finally {
    await new Promise(resolve => server.close(resolve));
}
