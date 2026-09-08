// Classic (non-module) script shared by every variant page. It only touches `window.Sentry`,
// so the four pages differ solely in how the SDK is loaded and initialized.
(function () {
  var RECORDER = '/recorder';

  // The docs' errors-only verify snippet, platform-includes/getting-started-verify/javascript.mdx:22-30
  window.triggerError = function () {
    throw new Error('Sentry Test Error');
  };

  function wire(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  window.__qsMeta = function () {
    var client = window.Sentry && window.Sentry.getClient && window.Sentry.getClient();
    if (!client) return { initialized: false, hasGlobal: !!window.Sentry };
    var meta = (client.getSdkMetadata && client.getSdkMetadata()) || {};
    var opts = client.getOptions ? client.getOptions() : {};
    return {
      initialized: true,
      sdk: meta.sdk && { name: meta.sdk.name, version: meta.sdk.version, packages: meta.sdk.packages },
      integrations: Object.keys(client._integrations || {}),
      options: {
        release: opts.release,
        environment: opts.environment,
        tracesSampleRate: opts.tracesSampleRate,
        replaysSessionSampleRate: opts.replaysSessionSampleRate,
        replaysOnErrorSampleRate: opts.replaysOnErrorSampleRate,
        tunnel: opts.tunnel,
        traceLifecycle: opts.traceLifecycle,
        attachStacktrace: opts.attachStacktrace,
        autoSessionTracking: opts.autoSessionTracking,
        enableLogs: opts.enableLogs,
        dataCollection: opts.dataCollection,
        sendDefaultPii: opts.sendDefaultPii,
      },
      // `docsSnippetDefined` is false when the docs' tracing verify snippet failed to parse.
      docsSnippetDefined: typeof window.triggerErrorFromDocs === 'function',
      docsSnippetError: window.__docsSnippetError || null,
    };
  };

  window.__qsSentinel = function () {
    window.Sentry.captureMessage('sentinel');
    return window.Sentry.startSpan({ name: 'sentinel-span', op: 'test' }, function () {
      return true;
    });
  };

  window.addEventListener('DOMContentLoaded', function () {
    wire('btn-capture', function () {
      window.Sentry.captureException(new Error('Sentry Test Error (captureException)'));
    });

    wire('btn-span', function () {
      return window.Sentry.startSpan({ name: 'Example Frontend Span', op: 'test' }, async function () {
        await new Promise(function (resolve) {
          setTimeout(resolve, 200);
        });
        await fetch(RECORDER + '?from=span');
      });
    });

    wire('btn-log', function () {
      window.Sentry.logger.info('hello from the browser quickstart', { variant: window.__QS_VARIANT__ });
    });

    wire('btn-sentinel', window.__qsSentinel);

    document.body.setAttribute('data-wired', '1');
  });
})();
