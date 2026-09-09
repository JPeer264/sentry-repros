// getting-started-complete/javascript.astro.mdx:189-196 (`integrations: [sentry()]`) and :384-398
// (the source maps step: `org`, `project`, `authToken: process.env.SENTRY_AUTH_TOKEN`). No token is set.
//
// Repro additions: the Node adapter in standalone mode and `output: "server"` (the page never says
// the verify API route must render on demand; `QS_OUTPUT=static` leaves `output` unset to see what
// a default Astro project does), `outDir` per build variant, `telemetry: false` so the bundler plugin
// never contacts Sentry, and `QS_VARIANT=middleware` for the docs' manual middleware setup
// (configuration/apis.mdx:1462-1510 + tracing/instrumentation/automatic-instrumentation.mdx:47-60).
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sentry from "@sentry/astro";

const variant = process.env.QS_VARIANT || "base";

const sentryOptions = {
  org: "___ORG_SLUG___",
  project: "___PROJECT_SLUG___",
  // store your auth token in an environment variable
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  ...(variant === "middleware" ? { autoInstrumentation: { requestHandler: false } } : {}),
  ...(variant === "removed-option"
    ? { sourceMapsUploadOptions: { org: "___ORG_SLUG___", project: "___PROJECT_SLUG___" } }
    : {}),
};

export default defineConfig({
  ...(process.env.QS_OUTPUT === "static" ? {} : { output: "server" }),
  outDir: variant === "base" ? "./dist" : `./dist-${variant}`,
  adapter: node({ mode: "standalone" }),
  integrations: [sentry(sentryOptions)],
});
