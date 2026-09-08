import * as Sentry from '@sentry/astro';

export const prerender = false;

export const GET = async ({ url }) => {
  const t = url.searchParams.get('t');
  Sentry.setTag('probe_tag', t);
  await new Promise(r => setTimeout(r, 120));
  Sentry.captureException(new Error(`iso-${t}`));
  return new Response(JSON.stringify({ t }), { headers: { 'content-type': 'application/json' } });
};
