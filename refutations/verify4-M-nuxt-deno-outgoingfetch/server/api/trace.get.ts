import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(() => {
  const active = Sentry.getActiveSpan();
  return { active: active ? Sentry.spanToJSON(active).description : null };
});
