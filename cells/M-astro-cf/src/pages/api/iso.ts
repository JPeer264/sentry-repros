import * as Sentry from '@sentry/cloudflare';

export const prerender = false;

export const GET = async ({ url }: any) => {
  const tag = url.searchParams.get('tag');
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso ${tag}`));
  return new Response(JSON.stringify({ tag }), { headers: { 'content-type': 'application/json' } });
};
