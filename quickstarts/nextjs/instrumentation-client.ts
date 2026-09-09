import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% in dev, 10% in production
  // Adjust based on your traffic volume
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
  ],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Repro additions, not on the docs page: the driver needs every trace and the SDK's debug output.
  debug: true,
  tracesSampler: () => 1.0,
});

// This export will instrument router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Repro-only hooks for the driver.
const w = window as unknown as Record<string, unknown>;
w.Sentry = Sentry;
w.__qsMeta = () => {
  const client = Sentry.getClient();
  const o = client?.getOptions() as Record<string, unknown> | undefined;
  const md = (o?._metadata as { sdk?: unknown } | undefined)?.sdk;
  return {
    initialized: !!client,
    sdk: md,
    integrations: ((o?.integrations as { name: string }[]) || []).map((i) => i.name),
    dsn: o?.dsn,
    tunnel: o?.tunnel,
    tracesSampleRate: o?.tracesSampleRate,
    replaysSessionSampleRate: o?.replaysSessionSampleRate,
    release: o?.release,
    environment: o?.environment,
    tracePropagationTargets: String(o?.tracePropagationTargets),
  };
};
w.__qsSentinel = (name: string) => {
  Sentry.captureMessage(name);
  Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
};
