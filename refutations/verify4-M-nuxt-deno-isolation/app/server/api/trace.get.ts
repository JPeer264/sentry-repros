import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(() => {
  const span = Sentry.getActiveSpan();
  const root = span ? Sentry.getRootSpan(span) : undefined;
  return {
    hasActiveSpan: !!span,
    rootName: root ? Sentry.spanToJSON(root).description : null,
    isolationTags: Sentry.getIsolationScope().getScopeData().tags,
  };
});
