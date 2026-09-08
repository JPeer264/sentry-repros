import * as Sentry from '@sentry/sveltekit';

export async function GET({ url }) {
  const t = url.searchParams.get('t');
  Sentry.setTag('iso_tag', t);
  await new Promise(r => setTimeout(r, 120));
  Sentry.captureException(new Error(`iso-error-${t}`));
  return new Response(t);
}
