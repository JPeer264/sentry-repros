// Driver hooks, not part of any docs snippet. Everything goes through `window.Sentry`.
import { VERSION } from "@angular/core";

declare global {
  interface Window {
    Sentry: any;
    __qsMeta: () => unknown;
    __qsSentinel: (name: string) => unknown;
    __extractorCalls?: number;
  }
}

export function installHarness(): void {
  window.__qsMeta = function () {
    const client = window.Sentry?.getClient?.();
    if (!client) return { initialized: false, hasGlobal: !!window.Sentry };
    const meta = client.getSdkMetadata?.() || {};
    const opts = client.getOptions ? client.getOptions() : {};
    return {
      initialized: true,
      SDK_VERSION: window.Sentry.SDK_VERSION,
      sdk: meta.sdk && { name: meta.sdk.name, version: meta.sdk.version, packages: meta.sdk.packages },
      integrations: Object.keys(client._integrations || {}),
      options: {
        release: opts.release,
        environment: opts.environment,
        tracesSampleRate: opts.tracesSampleRate,
        tracePropagationTargets: (opts.tracePropagationTargets || []).map(String),
        replaysSessionSampleRate: opts.replaysSessionSampleRate,
        replaysOnErrorSampleRate: opts.replaysOnErrorSampleRate,
        tunnel: opts.tunnel,
        traceLifecycle: opts.traceLifecycle,
        attachStacktrace: opts.attachStacktrace,
        debug: opts.debug,
      },
      angular: VERSION.full,
      zone: typeof (window as any).Zone !== "undefined",
      extractorCalls: window.__extractorCalls ?? 0,
    };
  };

  window.__qsSentinel = function (name: string) {
    window.Sentry.captureMessage(name);
    return window.Sentry.startSpan({ name: name + "-span", op: "test" }, () => true);
  };
}

export function markWired(): void {
  document.body.setAttribute("data-wired", "1");
}
