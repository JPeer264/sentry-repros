import * as Sentry from "@sentry/node";
import { defineInstrumentation } from "eve/instrumentation";

export default defineInstrumentation({
  recordInputs: true,
  recordOutputs: true,
  setup: (ctx) => {
    Sentry.init({
      dsn: "https://0299849066e3bcf4626b214897b6c17f@o447951.ingest.us.sentry.io/4510555608449024",
      release: process.env.SENTRY_RELEASE ?? "temp-eve-sentry@dev",
      tracesSampleRate: 1.0,
    })
  },
});
