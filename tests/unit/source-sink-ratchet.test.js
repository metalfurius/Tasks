import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const revision = '?v=tasks-untrusted-content-rendering-v1';

test('source-to-sink ratchet passes', () => {
    execFileSync(process.execPath, ['scripts/check-sinks.mjs'], { stdio: 'inherit' });
});

test('application entry uses the revisioned safe module graph', () => {
    const index = readFileSync('index.html', 'utf8');
    const entry = readFileSync('src/index.js', 'utf8');
    const app = readFileSync('src/app.js', 'utf8');

    assert.ok(index.includes(`src/index.js${revision}`));
    assert.ok(entry.includes(`./app.js${revision}`));
    assert.ok(app.includes(`./components/tasks/taskList.js${revision}`));
    assert.ok(app.includes(`./services/toastService.js${revision}`));
});
