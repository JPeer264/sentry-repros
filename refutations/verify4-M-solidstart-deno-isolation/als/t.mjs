import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();

let cachedImport;
const loadImport = () => (cachedImport ??= import('./mod.mjs'));

let cachedPromise;
const loadPromise = () => (cachedPromise ??= new Promise(r => setTimeout(() => r(1), 20)));

async function run(label, load) {
  await als.run(label, async () => {
    console.log(`  [${label}] before:`, als.getStore());
    await load();
    console.log(`  [${label}] after :`, als.getStore());
  });
}

console.log('--- dynamic import (cached promise)');
await run('A', loadImport);
await run('B', loadImport);
await run('C', loadImport);

console.log('--- plain cached promise');
await run('A', loadPromise);
await run('B', loadPromise);

console.log('--- fresh import each time (already-evaluated module)');
await run('A', () => import('./mod.mjs'));
await run('B', () => import('./mod.mjs'));
console.log('outside store:', als.getStore());
