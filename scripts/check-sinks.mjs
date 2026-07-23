import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const sourceRoot = join(process.cwd(), 'src');
const forbidden = [
    /\binnerHTML\b/,
    /\bouterHTML\b/,
    /insertAdjacentHTML/,
    /document\.write\s*\(/,
    /createContextualFragment/,
    /\bjavascript\s*:/i,
    /\bon(?:error|load|click|mouseover|focus)\s*=/i
];

async function collect(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await collect(path));
        } else if (entry.name.endsWith('.js')) {
            files.push(path);
        }
    }
    return files;
}

const violations = [];
for (const file of await collect(sourceRoot)) {
    const contents = await readFile(file, 'utf8');
    contents.split(/\r?\n/).forEach((line, index) => {
        for (const pattern of forbidden) {
            if (pattern.test(line)) {
                violations.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
                break;
            }
        }
    });
}

if (violations.length) {
    console.error('Unsafe rendering sink(s) found outside the reviewed static HTML boundary:');
    console.error(violations.join('\n'));
    process.exit(1);
}

console.log('Source-to-sink ratchet passed: no unsafe HTML/script rendering APIs in src/.');
