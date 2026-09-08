// Deno compiles a `.json` file as JavaScript once any `Module.registerHooks` load hook is
// installed (denoland/deno#36240), which is what breaks Next.js under Sentry's runtime
// diagnostics-channel injection. Registering this hook FIRST puts it innermost in the chain, so it
// re-tags every JSON result before Sentry's hook and the Deno loader see it.
function registerJsonSafeLoadHook() {
  process.getBuiltinModule('node:module').registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (url.endsWith('.json') && result) {
        result.format = 'json';
      }
      return result;
    },
  });
  console.log('[probe] json-safe load hook registered');
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.JSON_SHIM === '1') {
      registerJsonSafeLoadHook();
    }
    await import('./sentry.server.config.js');
  }
}

export async function onRequestError(...args) {
  const Sentry = await import('@sentry/nextjs');
  return Sentry.captureRequestError(...args);
}
