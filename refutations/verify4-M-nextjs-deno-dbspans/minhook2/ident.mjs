import { createRequire } from 'node:module';
import * as ModNs from 'node:module';
const req = createRequire(import.meta.url);
const cjs = req('node:module');
const g = process.getBuiltinModule('node:module');
console.log('cjs===g', cjs === g);
g.registerHooks = function patched(h) { console.log('PATCHED CALLED'); };
console.log('after patch: cjs.registerHooks name =', cjs.registerHooks.name, '| ns =', ModNs.registerHooks.name, '| default =', (ModNs.default && ModNs.default.registerHooks && ModNs.default.registerHooks.name));
cjs.registerHooks({});
