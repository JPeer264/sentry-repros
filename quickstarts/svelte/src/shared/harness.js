// Driver hooks, not part of any docs snippet. Everything goes through `window.Sentry`.
export function installHarness() {
  window.__qsMeta = function () {
    var client = window.Sentry && window.Sentry.getClient && window.Sentry.getClient();
    if (!client) return { initialized: false, hasGlobal: !!window.Sentry };
    var meta = (client.getSdkMetadata && client.getSdkMetadata()) || {};
    var opts = client.getOptions ? client.getOptions() : {};
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
      svelte: window.__svelteVersion || null,
    };
  };

  window.__qsSentinel = function (name) {
    window.Sentry.captureMessage(name);
    return window.Sentry.startSpan({ name: name + '-span', op: 'test' }, function () {
      return true;
    });
  };
}

export function markWired() {
  document.body.setAttribute('data-wired', '1');
}
