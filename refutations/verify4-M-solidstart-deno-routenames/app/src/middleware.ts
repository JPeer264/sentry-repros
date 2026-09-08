import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';
import { createMiddleware } from '@solidjs/start/middleware';

function patternFromParams(pathname: string, params: Record<string, string> | undefined): string | undefined {
  if (!params || Object.keys(params).length === 0) {
    return undefined;
  }
  const byValue = new Map<string, string>();
  for (const [key, value] of Object.entries(params)) {
    byValue.set(String(value), key);
  }
  return pathname
    .split('/')
    .map(segment => {
      const key = byValue.get(segment);
      return key ? `:${key}` : segment;
    })
    .join('/');
}

export default createMiddleware({
  onRequest: [
    (event: any) => {
      // eslint-disable-next-line no-console
      console.log('[mw:onRequest] keys=', Object.keys(event), 'hasNative=', !!event.nativeEvent);
    },
  ],
  onBeforeResponse: [
    (event: any) => {
      if (process.env.SENTRY_MW_ROUTE === 'off') {
        return;
      }
      const pathname = new URL(event.request.url).pathname;
      const pattern = patternFromParams(pathname, event.params);
      // eslint-disable-next-line no-console
      console.log('[mw:onBeforeResponse]', pathname, JSON.stringify(event.params), '->', pattern);
      if (pattern) {
        setHttpServerSpanRouteAttribute(pattern);
      }
    },
  ],
});
