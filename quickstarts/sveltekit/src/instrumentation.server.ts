// getting-started-complete/javascript.sveltekit.mdx:242-258 verbatim, with the placeholder DSN
// pointed at the local sink. Repro additions are marked below.
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "http://public@127.0.0.1:4754/1",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Repro addition: debug output for the write-up.
  debug: true,
});

// Repro addition: print the SDK identity and the installed integrations for the write-up.
const client = Sentry.getClient() as any;
console.log(
  "[qs] server sdk",
  JSON.stringify({
    sdk: client?.getOptions?.()._metadata?.sdk,
    integrations: Object.keys(client?._integrations ?? {}),
    node: process.version,
  }),
);
