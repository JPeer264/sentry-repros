import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/sveltekit';

const isBun = typeof globalThis.Bun !== 'undefined';

Sentry.init({
	dsn: 'https://public@example.invalid/1',
	tracesSampleRate: 1.0,
	debug: !!process.env.SENTRY_DEBUG,
	tunnel: process.env.SENTRY_TUNNEL,
	integrations: isBun ? [fetchIntegration()] : []
});
