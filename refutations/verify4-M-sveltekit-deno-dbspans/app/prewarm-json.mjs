import { createRequire } from 'node:module';
// Deno bug denoland/deno#36240: once Module.registerHooks() is active, require('*.json') is
// compiled as JS. Loading mysql2's package.json into the CJS cache before the app starts
// keeps mysql2 importable.
createRequire(import.meta.url)('mysql2/package.json');
