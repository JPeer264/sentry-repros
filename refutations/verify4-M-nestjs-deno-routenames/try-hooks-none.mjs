import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
try { console.log('STATUSES_OK', typeof require('statuses')); } catch (e) { console.log('STATUSES_FAIL', e.message); }
