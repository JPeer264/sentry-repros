// docs/platforms/javascript/common/install/late-initialization.mdx:20-22 — the shape of a page
// where `Sentry.init()` cannot run first because the DSN is fetched from an external source.
// `@sentry/node/preload`, the hook that page relies on, has no browser counterpart.
import * as Sentry from "@sentry/browser";

// Caught before init. Nothing can report this: there is no client yet.
try {
  throw new Error("Error before Sentry.init");
} catch (e) {
  window.__preInitCaught = String(e);
}

// Uncaught, and an unhandled rejection, before init. Only the global handlers that
// `Sentry.init` installs can see these, so they are the interesting case.
setTimeout(() => {
  throw new Error("Uncaught error before Sentry.init");
}, 0);
Promise.reject(new Error("Unhandled rejection before Sentry.init"));

fetch("/dsn")
  .then(r => (r.ok ? r.text() : ""))
  .catch(() => "")
  .then(t => t || "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337")
  .then(initSentry);

function initSentry(dsn) {
  Sentry.init({
    dsn,
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
  window.__lateInitDone = true;

  // The same uncaught error again, now that the global handlers are installed.
  setTimeout(() => {
    throw new Error("Uncaught error after Sentry.init");
  }, 0);
}
