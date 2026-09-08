import './instrument';
import * as Sentry from '@sentry/bun';

Sentry.captureException(new Error('x-exit'));
console.log('captured, process.exit(0)');
process.exit(0);
