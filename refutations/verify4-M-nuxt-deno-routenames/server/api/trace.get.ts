import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(() => {
  const active = Sentry.getActiveSpan();
  const root = active ? Sentry.getRootSpan(active) : undefined;
  return {
    name: root ? Sentry.spanToJSON(root).description ?? null : null,
    op: root ? Sentry.spanToJSON(root).op ?? null : null,
    hasActive: !!active,
  };
});
