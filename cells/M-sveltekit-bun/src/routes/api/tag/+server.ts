import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';

export async function GET({ url }) {
	const t = url.searchParams.get('t') || 'none';
	Sentry.setTag('probe_tag', t);
	await new Promise(r => setTimeout(r, 20 + Math.random() * 120));
	Sentry.captureException(new Error(`iso-${t}`));
	return json({ t });
}
