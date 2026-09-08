// WORKAROUND (verified): gives every matched Nitro route an `http.route` on the segment,
// not just parameterized ones. Enable by keeping this file in `server/plugins/`.
import { defineNitroPlugin } from '#imports';
import { getActiveSpan, getRootSpan, spanToJSON } from '@sentry/cloudflare';

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('beforeResponse', (event: any) => {
    const route = event.context?.matchedRoute?.path ?? event.context?.matchedRoute?.route;
    if (!route || route === '/**') return;

    const activeSpan = getActiveSpan();
    if (!activeSpan) return;
    const rootSpan = getRootSpan(activeSpan);
    if (!rootSpan) return;

    const attrs = spanToJSON(rootSpan).attributes ?? {};
    if (attrs['sentry.op'] !== 'http.server') return;
    if (attrs['http.route']) return;

    const method = attrs['http.request.method'] ?? attrs['http.method'] ?? 'GET';
    rootSpan.setAttribute('http.route', route);
    rootSpan.updateName(`${method} ${route}`);
    rootSpan.setAttribute('sentry.segment.name.source', 'route');
  });
});
