import './instrument';
import * as Sentry from '@sentry/bun';

Sentry.captureException(new Error('x-natural'));
console.log('captured, natural exit');
