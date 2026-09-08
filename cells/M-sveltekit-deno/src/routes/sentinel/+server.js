import * as Sentry from '@sentry/sveltekit';
export function GET() { Sentry.captureMessage('sentinel'); return new Response('ok'); }
