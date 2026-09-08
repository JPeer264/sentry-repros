import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';
import * as dc from 'node:diagnostics_channel';

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@dsn.ingest.sentry.io/1337',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
  });

  if (process.env.PROBE_DIAG) {
    dc.channel('tracing:h3.request:start').subscribe((data: any) => {
      // eslint-disable-next-line no-console
      console.log(
        '[PROBE h3.request:start]',
        JSON.stringify({
          type: data?.type,
          url: data?.event?.url?.pathname,
          matchedRoute: data?.event?.context?.matchedRoute ?? null,
          params: data?.event?.context?.params ?? null,
          ctxKeys: data?.event?.context ? Object.keys(data.event.context) : null,
        }),
      );
    });
    dc.channel('tracing:h3.request:end').subscribe((data: any) => {
      // eslint-disable-next-line no-console
      console.log(
        '[PROBE h3.request:end]',
        JSON.stringify({
          type: data?.type,
          url: data?.event?.url?.pathname,
          matchedRoute: data?.event?.context?.matchedRoute ?? null,
          params: data?.event?.context?.params ?? null,
        }),
      );
    });
    dc.channel('tracing:srvx.request:start').subscribe((data: any) => {
      // eslint-disable-next-line no-console
      console.log('[PROBE srvx.request:start]', JSON.stringify({ url: data?.request?._url?.pathname }));
    });
  }
});
