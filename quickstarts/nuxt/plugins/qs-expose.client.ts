// Repro-only: exposes the SDK to the driver so the docs snippets stay verbatim.
import * as Sentry from "@sentry/nuxt";

export default defineNuxtPlugin(() => {
  const w = window as any;
  w.Sentry = Sentry;
  w.__qsMeta = () => {
    const client = Sentry.getClient() as any;
    if (!client) return { initialized: false };
    const o = client.getOptions();
    return {
      initialized: true,
      sdk: o._metadata?.sdk,
      integrations: Object.keys(client._integrations || {}),
      tunnel: o.tunnel,
      tracePropagationTargets: o.tracePropagationTargets ? o.tracePropagationTargets.map(String) : null,
    };
  };
  w.__qsSentinel = (name: string) => {
    Sentry.captureMessage(name);
    Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
  };
});
