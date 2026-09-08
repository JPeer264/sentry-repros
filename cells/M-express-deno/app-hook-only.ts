import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { createApp, listen } from "./routes.ts";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT") ?? "41734"}/`,
  tracesSampleRate: 1.0,
  environment: "probe",
});

listen(createApp());
