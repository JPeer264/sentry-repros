import { continueTrace, generateTraceId, getDefaultIsolationScope, withIsolationScope } from '@sentry/core';

export default defineNitroPlugin(nitroApp => {
  const app = (nitroApp as any).h3 ?? (nitroApp as any).h3App;
  const original = app.handler;
  app.handler = new Proxy(original, {
    apply(target, thisArg, args: any[]) {
      const scope = getDefaultIsolationScope().clone();
      scope.setPropagationContext({ traceId: generateTraceId(), sampleRand: Math.random() });
      const event = args[0];
      const headers = event?.node?.req?.headers ?? {};
      return withIsolationScope(scope, () =>
        continueTrace(
          { sentryTrace: headers['sentry-trace'], baggage: headers.baggage },
          () => target.apply(thisArg, args),
        ),
      );
    },
  });
});
