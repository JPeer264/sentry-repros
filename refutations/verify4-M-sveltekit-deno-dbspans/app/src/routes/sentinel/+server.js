import * as Sentry from '@sentry/sveltekit';
export const GET = () => { Sentry.captureMessage('sentinel'); return new Response('ok'); };
