import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(async event => {
  const tag = String(getQuery(event).tag ?? 'none');
  Sentry.setTag('probe_tag', tag);
  Sentry.setUser({ id: `user-${tag}` });
  await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 150)));
  Sentry.captureException(new Error(`boom-${tag}`));
  return { tag, isolationTag: Sentry.getIsolationScope().getScopeData().tags.probe_tag ?? null };
});
