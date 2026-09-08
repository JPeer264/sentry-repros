import './instrument';
import * as Sentry from '@sentry/bun';

Sentry.captureException(new Error('x-flush'));
const ok = await Sentry.flush(2000);
console.log('captured, flushed:', ok);
process.exit(0);
