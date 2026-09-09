// docs/platforms/javascript/guides/angular/manual-setup.mdx:109-164 (the "App Config" tab of
// main.ts) with all four product options. Added for this reproduction: `tunnel: "/tunnel"`
// (manual-setup.mdx:370 -> platform-includes/getting-started-tunneling/javascript.mdx:14-17, the
// local sink), `debug: true`, `window.Sentry` and the harness hooks for the driver.
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "../base/app.config";
import { AppComponent } from "./app.component";

import * as Sentry from "@sentry/angular";
import { installHarness } from "../../harness";

window.Sentry = Sentry;
installHarness();

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,

  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom Angular routing instrumentation
    Sentry.browserTracingIntegration(),
    // Registers the Replay integration,
    // which automatically captures Session Replays
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
