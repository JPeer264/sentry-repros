import * as Sentry from "@sentry/deno";

const port = Deno.env.get("SINK_PORT") ?? "9999";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
});

setTimeout(() => console.log("STILL ALIVE"), 2000);

console.log("init done, sdk", Sentry.SDK_VERSION);
