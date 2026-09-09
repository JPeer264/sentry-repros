// docs/platforms/javascript/common/configuration/integrations/koa.mdx:39-50 (the ignoreLayersType example),
// on top of the ESM config snippet, plus the two repro-only options.
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.koaIntegration({
      ignoreLayersType: ['middleware']
    })
  ],
});
