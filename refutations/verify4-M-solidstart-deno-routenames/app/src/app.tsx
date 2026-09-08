import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';
import { Router, useCurrentMatches } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { getRequestEvent, isServer } from 'solid-js/web';

function Root(props: { children?: any }) {
  const matches = useCurrentMatches();
  const mode = process.env.SENTRY_PAGE_ROUTE;
  if (isServer && mode !== 'off') {
    const all = matches();
    const last = all[all.length - 1] as any;
    const pattern = last?.route?.pattern || last?.route?.originalPath;
    // eslint-disable-next-line no-console
    console.log('[root] mode=', mode, 'pattern=', pattern);
    if (pattern) {
      if (mode === 'direct') {
        setHttpServerSpanRouteAttribute(pattern);
      } else {
        const event = getRequestEvent() as any;
        if (event?.nativeEvent) {
          event.nativeEvent.context = event.nativeEvent.context || {};
          event.nativeEvent.context.matchedRoute = { route: pattern };
          event.nativeEvent.context.params = last?.params;
        }
      }
    }
  }
  return <Suspense>{props.children}</Suspense>;
}

export default function App() {
  return (
    <Router root={Root}>
      <FileRoutes />
    </Router>
  );
}
