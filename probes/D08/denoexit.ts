import { Sentry, TAG } from './sentry.ts';

Sentry.captureException(new Error(`deno-exit-${TAG}`));

console.log('captured, Deno.exit(0)');
Deno.exit(0);
