import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';

export const GET: APIRoute = async ({ url }) => {
  const tag = url.searchParams.get('tag') ?? 'none';
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso-error-${tag}`));
  return new Response(tag);
};
