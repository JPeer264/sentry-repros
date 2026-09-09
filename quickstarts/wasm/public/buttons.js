// Classic (non-module) script shared by both pages. It only touches `window.Sentry`, loads the
// wasm module after the SDK is initialized, and holds the guide's verify snippets verbatim.
(function () {
  var params = new URLSearchParams(location.search);
  var WASM_FILE = params.get('wasm') || 'divide.wasm';
  var LOADER = params.get('load') || 'streaming';

  // docs/platforms/javascript/guides/wasm/index.mdx:170-184. The module is loaded through the
  // WebAssembly API below, so the "via WebAssembly API" line is the active one.
  window.testWasmError = function testWasmError() {
    try {
      // Assuming you already have your WebAssembly module loaded as 'wasmModule'
      // Replace this with your actual WebAssembly module instance

      // depending on how your module is compiled, call function directly
      // const result = wasmModule.divide(10, 0);
      // or via WebAssembly API
      const result = wasmModule.instance.exports.divide(10, 0);
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  // docs/platforms/javascript/guides/wasm/index.mdx:242-259, same substitution.
  window.testWasmTracing = function testWasmTracing() {
    Sentry.startSpan({ op: "test", name: "Example Span" }, () => {
      try {
        // Assuming you already have your WebAssembly module loaded as 'wasmModule'
        // Replace this with your actual WebAssembly module instance

        // depending on how your module is compiled, call function directly
        // const result = wasmModule.compute_intensive_function(1000);
        // or via WebAssembly API
        const result = wasmModule.instance.exports.compute_intensive_function(1000);
        console.log("Result:", result);
      } catch (e) {
        Sentry.captureException(e);
      }
    });
  };

  // Not in the guide: the trap reaches Sentry through the global handlers instead of captureException.
  window.testWasmErrorUncaught = function testWasmErrorUncaught() {
    return wasmModule.instance.exports.divide(10, 0);
  };

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
        tracesSampleRate: opts.tracesSampleRate,
        tunnel: opts.tunnel,
        traceLifecycle: opts.traceLifecycle,
        sendDefaultPii: opts.sendDefaultPii,
        dataCollection: opts.dataCollection,
      },
      // Which of the two documented calling styles the loaded module supports.
      callStyles: {
        direct: typeof (window.wasmModule && window.wasmModule.divide) === 'function',
        api: typeof (window.wasmModule && window.wasmModule.instance && window.wasmModule.instance.exports.divide) === 'function',
      },
      wasm: window.__qsWasm || null,
    };
  };

  window.__qsSentinel = function () {
    window.Sentry.captureMessage('sentinel');
    return window.Sentry.startSpan({ name: 'sentinel-span', op: 'test' }, function () {
      return true;
    });
  };

  async function loadWasm() {
    var url = new URL('/' + WASM_FILE, location.href).href;
    var loaded;
    if (LOADER === 'bytes') {
      var res = await fetch(url);
      var bytes = await res.arrayBuffer();
      loaded = await WebAssembly.instantiate(bytes);
    } else {
      loaded = await WebAssembly.instantiateStreaming(fetch(url));
    }
    window.wasmModule = loaded;
    window.__qsWasm = {
      url: url,
      loader: LOADER,
      buildIdSections: WebAssembly.Module.customSections(loaded.module, 'build_id').length,
      externalDebugInfoSections: WebAssembly.Module.customSections(loaded.module, 'external_debug_info').length,
      exports: Object.keys(loaded.instance.exports),
    };
  }

  window.addEventListener('DOMContentLoaded', function () {
    var sentinel = document.getElementById('btn-sentinel');
    if (sentinel) sentinel.addEventListener('click', window.__qsSentinel);

    loadWasm().then(
      function () {
        document.body.setAttribute('data-wired', '1');
      },
      function (e) {
        window.__qsWasmError = String(e && e.message ? e.message : e);
        document.body.setAttribute('data-wired', 'error');
      },
    );
  });
})();
