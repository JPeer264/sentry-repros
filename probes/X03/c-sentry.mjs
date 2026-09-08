import '@sentry/deno/import';
import { createRequire } from 'node:module';
import { sentinel } from './init.mjs';

const require = createRequire(import.meta.url);

let result;
try {
  require('./req.cjs');
  result = 'ok';
} catch (e) {
  result = `FAIL ${e.name}: ${e.message}`;
}
console.log(`RESULT c-sentry: ${result}`);
await sentinel(`sentinel c-sentry ${result}`);
