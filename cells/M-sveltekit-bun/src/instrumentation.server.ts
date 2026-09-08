import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://abc@o1.ingest.sentry.io/1',
	tracesSampleRate: 1.0,
	tunnel: process.env.SENTRY_TUNNEL,
	traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'stream' | 'static') || 'stream',
	debug: !!process.env.SENTRY_DEBUG
});
