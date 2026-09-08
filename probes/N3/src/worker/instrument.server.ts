// Picked up by convention by the auto-instrument plugin: it sits next to the
// worker entry named in wrangler's `main` and its default export is the options
// callback used by every wrapper the plugin injects.
export default (env: Env) => ({
  dsn: 'https://public@example.invalid/1',
  tunnel: env.SINK_URL,
  tracesSampleRate: 1.0,
  environment: 'n3',
});
