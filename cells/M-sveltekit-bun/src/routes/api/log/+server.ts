import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';

export function GET() {
	Sentry.logger.info('sveltekit-bun-log-line', { where: 'route-handler' });
	return json({ ok: true });
}
