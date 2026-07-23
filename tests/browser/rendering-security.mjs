import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, relative } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = process.cwd();
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8'
};

const server = createServer(async (request, response) => {
    try {
        const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
        const relativePath = normalize(requestPath).replace(/^[/\\]+/, '');
        const filePath = join(root, relativePath || 'tests/browser/rendering-security.html');
        if (relative(root, filePath).startsWith('..')) {
            response.writeHead(403).end();
            return;
        }
        const body = await readFile(filePath);
        response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
        response.end(body);
    } catch {
        response.writeHead(404).end();
    }
});

let url;

try {
    for (const [name, browserType] of [['webkit', webkit], ['chromium', chromium]]) {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            if (!url) {
                await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
                const { port } = server.address();
                url = `http://127.0.0.1:${port}/tests/browser/rendering-security.html`;
            }
            const dialogs = [];
            const consoleErrors = [];
            const payloadRequests = [];
            page.on('dialog', dialog => {
                dialogs.push(dialog.type());
                void dialog.dismiss();
            });
            page.on('console', message => {
                if (message.type() === 'error') {
                    consoleErrors.push(message.text());
                }
            });
            page.on('request', request => {
                if (/\/x(?:\?|$)/.test(request.url())) {
                    payloadRequests.push(request.url());
                }
            });
            await page.goto(url, { waitUntil: 'networkidle' });
            const results = await page.evaluate(() => window.__securityResults);
            assert.equal(results.executed, 0, `${name}: payload executed`);
            assert.equal(results.historyText, '<div><span><img src=x onerror="window.__executed=1"></span></div>');
            assert.equal(results.toastText, '<img src=x onerror="window.__executed=1">');
            assert.equal(results.hasToastElement, false);
            assert.deepEqual(dialogs, [], `${name}: payload opened a dialog`);
            assert.deepEqual(consoleErrors, [], `${name}: page emitted a console error`);
            assert.deepEqual(payloadRequests, [], `${name}: payload initiated a request`);
            for (const result of results.taskResults) {
                assert.equal(result.hasElement, false, `${name}: payload became an element`);
                assert.equal(result.hasHandler, false, `${name}: payload created an event handler`);
                assert.equal(result.text, result.id, `${name}: payload text was not preserved`);
            }
        } finally {
            await context.close();
            await browser.close();
        }
        console.log(`${name} rendering security fixture passed.`);
    }
} finally {
    await new Promise(resolve => server.close(resolve));
}
