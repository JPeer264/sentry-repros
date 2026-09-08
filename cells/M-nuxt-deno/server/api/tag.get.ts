import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(async event => {
  const tag = String(getQuery(event).tag ?? 'none');
  Sentry.setTag('probe_tag', tag);
  await new Promise(resolve => setTimeout(resolve, 200));
  Sentry.captureException(new Error(`iso-${tag}`));
  const span = Sentry.getActiveSpan();
  return { tag, trace: span ? Sentry.spanToJSON(span).trace_id : 'nospan' };
});
