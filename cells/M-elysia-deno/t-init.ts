import * as Sentry from "@sentry/elysia";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:43711/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  debug: true,
});
console.log("init ok, client=", !!Sentry.getClient());
Sentry.captureMessage("t-init-hello");
await Sentry.flush(3000);
console.log("flushed");
