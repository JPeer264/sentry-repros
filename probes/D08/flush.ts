import { Sentry, TAG } from './sentry.ts';

Sentry.captureException(new Error(`flush-exit-${TAG}`));

console.log('captured, flushing');
const result = await Sentry.flush(5000);
console.log(`flush result: ${result}`);
Deno.exit(0);
