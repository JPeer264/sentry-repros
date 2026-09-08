import '@sentry/deno/import';
import { sentinel } from './init.mjs';

let result;
try {
  const m = await import('express');
  result = `ok typeof=${typeof (m.default ?? m)}`;
} catch (e) {
  result = `FAIL ${e.name}: ${e.message}`;
}
console.log(`RESULT d-express: ${result}`);
await sentinel(`sentinel d-express ${result}`);
