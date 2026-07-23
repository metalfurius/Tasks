import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const roots = ['src', 'scripts', 'tests'];

async function collect(directory) {
    const files = [];
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await collect(path));
        } else if (/\.(?:js|mjs)$/.test(entry.name)) {
            files.push(path);
        }
    }
    return files;
}

const files = (await Promise.all(roots.map(collect))).flat();
for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) {
        throw new Error(`Syntax check failed for ${relative(root, file)}`);
    }
}

console.log(`Checked JavaScript syntax for ${files.length} files.`);
