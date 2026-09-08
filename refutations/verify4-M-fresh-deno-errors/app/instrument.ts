import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

const g = globalThis as unknown as { __sentryInited?: boolean };

if (!g.__sentryInited) {
  g.__sentryInited = true;

  const mode = Deno.env.get("SENTRY_MODE") ?? "baseline";
  const port = Deno.env.get("SINK_PORT") ?? "0";

  const integrations = mode.startsWith("console")
    ? [Sentry.captureConsoleIntegration({ levels: ["error"], handled: false })]
    : [];

  Sentry.init({
    dsn: "https://public@127.0.0.1/1",
    tunnel: `http://127.0.0.1:${port}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: Deno.env.get("SENTRY_LIFECYCLE") === "stream" ? "stream" : "static",
    integrations,
  });

  console.log("[instrument] sentry mode:", mode, "sink:", port);
}
