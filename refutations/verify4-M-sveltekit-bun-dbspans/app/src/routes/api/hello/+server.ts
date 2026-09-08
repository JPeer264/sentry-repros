import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';

export async function GET() {
  Sentry.captureMessage('sentinel');
  return json({ ok: true });
}
