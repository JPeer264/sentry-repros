import './resolveonly.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
console.log('RESULT:', require('jsonpkg'));
