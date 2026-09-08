import * as Module from 'node:module';
import { createRequire } from 'node:module';
Module.registerHooks({ resolve(s, c, n) { return n(s, c); }, load(u, c, n) { return n(u, c); } });
const require = createRequire(import.meta.url);
try { console.log('STATUSES_OK', typeof require('statuses')); } catch (e) { console.log('STATUSES_FAIL', e.message); }
