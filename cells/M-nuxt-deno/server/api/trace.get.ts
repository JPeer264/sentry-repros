import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(() => {
  const span = Sentry.getActiveSpan();
  return { name: span ? Sentry.spanToJSON(span).description ?? null : null };
});
