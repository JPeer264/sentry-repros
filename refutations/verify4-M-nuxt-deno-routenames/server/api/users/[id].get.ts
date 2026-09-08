import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(event => {
  const id = getRouterParam(event, 'id');
  const active = Sentry.getActiveSpan();
  const root = active ? Sentry.getRootSpan(active) : undefined;
  if (id === 'boom') {
    throw new Error('users-route-boom');
  }
  return { id, name: root ? Sentry.spanToJSON(root).description ?? null : null };
});
