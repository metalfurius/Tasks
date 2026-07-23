import { test } from 'node:test';
import { execFileSync } from 'node:child_process';

test('source-to-sink ratchet passes', () => {
    execFileSync(process.execPath, ['scripts/check-sinks.mjs'], { stdio: 'inherit' });
});
