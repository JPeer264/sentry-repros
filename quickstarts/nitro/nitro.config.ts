// docs/platforms/javascript/guides/nitro/index.mdx:86-99, verbatim except the two repro-only additions
// (`telemetry: false` so the bundler plugin does not call home; the auth token is unset in run.sh so no upload happens).
import { defineNitroConfig } from "nitro/config";
import { withSentryConfig } from "@sentry/nitro";

const config = defineNitroConfig({
  // your Nitro options...
  // Nitro 3 defaults to `serverDir: false` (no route scanning); its own docs set this line, so the guide's
  // routes/debug-sentry.ts lives in server/routes/ here.
  serverDir: "./server",
});

export default withSentryConfig(config, {
  org: "___ORG_SLUG___",
  project: "___PROJECT_SLUG___",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
});
