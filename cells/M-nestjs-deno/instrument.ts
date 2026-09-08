// The workaround from the record: with the develop SDK's runtime injection active,
// Deno 2.9.0 compiles every require('*.json') as JavaScript and throws
// SyntaxError: Unexpected token ':' (denoland/deno#36240 family), which makes
// @nestjs/platform-express unimportable. Setting this sentinel before init()
// makes registerDiagnosticsChannelInjection() skip Module.registerHooks().
if (Deno.env.get("NO_INJECT")) {
  (globalThis as Record<string, unknown>).__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true };
}

import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT") ?? "44822"}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") ?? "stream") as "stream" | "static",
  environment: "probe",
  debug: !!Deno.env.get("SENTRY_DEBUG"),
});
