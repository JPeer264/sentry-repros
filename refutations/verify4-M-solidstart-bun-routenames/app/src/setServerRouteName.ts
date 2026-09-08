import * as Sentry from '@sentry/solidstart';

/**
 * Renames the active http.server span to a parameterized route.
 * Only active when PROBE_ROUTEFIX is set, so one build serves baseline and fix runs.
 */
export function setServerRouteName(method: string, route: string): void {
  if (!process.env.PROBE_ROUTEFIX) {
    return;
  }
  const activeSpan = Sentry.getActiveSpan();
  const rootSpan = activeSpan && Sentry.getRootSpan(activeSpan);
  if (!rootSpan) {
    // eslint-disable-next-line no-console
    console.log('[PROBE routefix] no active root span for', method, route);
    return;
  }
  // eslint-disable-next-line no-console
  console.log('[PROBE routefix] renaming to', method, route);
  rootSpan.setAttribute('http.route', route);
  rootSpan.updateName(`${method} ${route}`);
  rootSpan.setAttribute('sentry.segment.name.source', 'route');
}
