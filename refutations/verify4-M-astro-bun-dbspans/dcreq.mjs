import { createRequire } from 'node:module';
import * as dcNs from 'node:diagnostics_channel';
const __require = createRequire(import.meta.url);
const { tracingChannel } = __require('diagnostics_channel');
const a = tracingChannel('orchestrion:mysql2:query');
const b = dcNs.tracingChannel('orchestrion:mysql2:query');
b.subscribe({ start(){} });
console.log('createRequire handle start.hasSubscribers:', a.start.hasSubscribers);
console.log('same start channel object:', a.start === b.start);
