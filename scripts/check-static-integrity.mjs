import { access, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const index = await readFile(join(root, 'index.html'), 'utf8');
const staticReferences = [...index.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
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
        .map(match => match[2]);

    for (const specifier of imports) {
        const imported = resolve(dirname(absolutePath), specifier);
        const candidate = extname(imported) ? imported : `${imported}.js`;
        await access(candidate);
        await checkModule(candidate);
    }
}

await checkModule(join(root, 'src', 'index.js'));
console.log(`Static integrity passed for ${staticReferences.length} index references and ${checked.size} modules.`);
