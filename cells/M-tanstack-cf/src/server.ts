import * as Sentry from '@sentry/cloudflare';
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
import handler from '@tanstack/react-start/server-entry';

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@127.0.0.1/1',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static' as const,
    tunnel: 'http://127.0.0.1:33517/',
    environment: 'probe',
    release: 'm-tanstack-cf',
  }),
  // @ts-expect-error the TanStack server entry type is not the Cloudflare ExportedHandler type
  wrapFetchWithSentry(handler),
);
