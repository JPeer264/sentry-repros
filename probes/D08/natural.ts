import { Sentry, TAG } from './sentry.ts';

Sentry.captureException(new Error(`natural-exit-${TAG}`));

console.log('captured, natural exit');
