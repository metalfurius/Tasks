import { access, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const deliveryRevision = 'v=tasks-untrusted-content-rendering-v1';
const index = await readFile(join(root, 'index.html'), 'utf8');
if (!index.includes(`src/index.js?${deliveryRevision}`)) {
    throw new Error(`Application entry is missing the ${deliveryRevision} delivery revision.`);
}
const staticReferences = [...index.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .map(reference => reference.split(/[?#]/, 1)[0])
    .filter(reference => !/^(?:https?:|data:|#)/.test(reference));

for (const reference of staticReferences) {
    await access(join(root, reference));
}

const checked = new Set();
async function checkModule(path) {
    const absolutePath = resolve(path);
    if (checked.has(absolutePath)) return;
    checked.add(absolutePath);

    const contents = await readFile(absolutePath, 'utf8');
    const imports = [...contents.matchAll(/(?:from\s*|import\s*\()(['"])(\.\.\/|\.\/[^'"]+)\1/g)]
        .map(match => match[2].split(/[?#]/, 1)[0]);

    for (const specifier of imports) {
        if (!specifier.includes(`?${deliveryRevision}`)) {
            throw new Error(`Local import ${specifier} in ${relative(root, absolutePath)} is missing ${deliveryRevision}.`);
        }
        const imported = resolve(dirname(absolutePath), specifier.split(/[?#]/, 1)[0]);
        const candidate = extname(imported) ? imported : `${imported}.js`;
        await access(candidate);
        await checkModule(candidate);
    }
}

await checkModule(join(root, 'src', 'index.js'));
console.log(`Static integrity passed for ${staticReferences.length} index references and ${checked.size} modules.`);
