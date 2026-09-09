// The only hapiIntegration option the build has (node_modules/@sentry/server-utils/build/types/integrations/hapi/index.d.ts,
// `shouldHandleError`), which docs/platforms/javascript/common/configuration/integrations/hapi.mdx does not document,
// on top of the ESM config snippet, plus the two repro-only options. The predicate accepts every error Hapi reports
// and prints the status it saw, so the sink and the console together show which errors Hapi hands to the SDK at all.
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.hapiIntegration({
      shouldHandleError(error, request) {
        const status = request.response?.output?.statusCode ?? request.response?.statusCode;
        console.log(`shouldHandleError status=${status} error=${String(error)}`);
        return true;
      },
    }),
  ],
});
