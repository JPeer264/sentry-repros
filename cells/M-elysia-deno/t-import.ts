import * as Sentry from "@sentry/elysia";
console.log("imported ok", typeof Sentry.init, typeof Sentry.withElysia, Sentry.SDK_VERSION);
