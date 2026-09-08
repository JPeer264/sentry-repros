import * as Module from 'node:module';
import { createRequire } from 'node:module';
Module.registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json')) {
      console.log('LOAD json url=', url, 'format=', r.format, 'srcType=', typeof r.source, 'hasSource=', r.source != null);
      const wrapped = { ...r, format: 'json' };
      return wrapped;
    }
    return r;
  },
});
const require = createRequire(import.meta.url);
try { const s = require('statuses'); console.log('STATUSES_OK', typeof s); } catch (e) { console.log('STATUSES_FAIL', e.message); }
