/**
 * Validate all JSON files and that module.json references existing files.
 * Run with: node tests/validate-json.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);

const jsonFiles = [
    'module.json',
    'languages/en.json',
    'languages/zh-cn.json'
];

for (const file of jsonFiles) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    JSON.parse(text); // throws on invalid JSON
    console.log(`✓ ${file} is valid JSON`);
}

const manifest = JSON.parse(readFileSync(new URL('../module.json', import.meta.url), 'utf8'));

const required = [
    'id', 'title', 'description', 'version',
    'compatibility', 'esmodules', 'styles', 'languages'
];
for (const key of required) {
    if (!(key in manifest)) throw new Error(`module.json is missing required field: ${key}`);
}

const referenced = [
    ...(manifest.esmodules || []),
    ...(manifest.styles || []),
    ...(manifest.languages || []).map((l) => l.path)
];
for (const path of referenced) {
    if (!existsSync(new URL(`../${path}`, import.meta.url))) {
        throw new Error(`module.json references missing file: ${path}`);
    }
    console.log(`✓ referenced file exists: ${path}`);
}

const version = manifest.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`module.json version "${version}" is not semver x.y.z`);
}
console.log(`✓ version ${version} looks like semver`);

console.log('JSON validation passed ✓');
