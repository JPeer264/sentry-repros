import * as Module from 'node:module';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
Module.registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
      const src = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'commonjs', source: `module.exports = ${src}`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
Module.registerHooks({ resolve(s, c, n) { return n(s, c); }, load(u, c, n) { return n(u, c); } });
const require = createRequire(import.meta.url);
try { const s = require('statuses'); console.log('STATUSES_OK', typeof s, s(404)); } catch (e) { console.log('STATUSES_FAIL', e.message); }
