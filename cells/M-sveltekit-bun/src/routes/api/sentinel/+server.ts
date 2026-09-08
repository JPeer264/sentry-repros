import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';

export function GET() {
	Sentry.captureMessage('sentinel');
	return json({ ok: true });
}
