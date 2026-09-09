// index.mdx:214-231, verbatim. SolidStart 2 never reads this file; check-config.mjs evaluates it.
import { withSentry } from "@sentry/solidstart";
import { defineConfig } from "@solidjs/start/config";

export default defineConfig(
  withSentry(
    {
      // other SolidStart config options...
      middleware: "./src/middleware.ts",
    },
    {
      // Your Sentry build-time config (such as source map upload options)
      // optional: if your `instrument.server.ts` file is not located inside `src`
      instrumentation: "./mypath/instrument.server.ts",
    }
  )
);
