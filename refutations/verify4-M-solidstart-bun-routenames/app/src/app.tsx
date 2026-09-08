import { withSentryRouterRouting } from '@sentry/solidstart/solidrouter';
import { MetaProvider, Title } from '@solidjs/meta';
import { Router, useCurrentMatches } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { getRequestEvent, isServer } from 'solid-js/web';
import { setServerRouteName } from './setServerRouteName';

const SentryRouter = withSentryRouterRouting(Router);

function ServerRouteName() {
  if (isServer) {
    const matches = useCurrentMatches();
    const pattern = matches().at(-1)?.route.pattern;
    const method = getRequestEvent()?.request.method ?? 'GET';
    if (pattern) {
      setServerRouteName(method, pattern);
    }
  }
  return null;
}

export default function App() {
  return (
    <SentryRouter
      root={props => (
        <MetaProvider>
          <Title>SolidStart - with Vitest</Title>
          <ServerRouteName />
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </SentryRouter>
  );
}
