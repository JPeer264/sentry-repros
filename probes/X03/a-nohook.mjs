import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

try {
  require('./req.cjs');
  console.log('RESULT a-nohook: ok');
} catch (e) {
  console.log(`RESULT a-nohook: FAIL ${e.name}: ${e.message}`);
}
