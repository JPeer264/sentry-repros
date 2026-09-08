// docs/platforms/javascript/common/install/commonjs.mdx:21 — "CommonJS uses `require()` to load
// modules." Same init as src/app-npm.js, reached through `require("@sentry/browser")` and bundled
// by esbuild in CJS mode into a browser IIFE.
const Sentry = require("@sentry/browser");

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,

  release: "my-project-name@2.3.12",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],

  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

window.Sentry = Sentry;
