import * as Sentry from '@sentry/sveltekit';
import { json } from '@sveltejs/kit';

export async function GET() {
	Sentry.captureMessage('sentinel');
	return json({ hello: 'world' });
}
