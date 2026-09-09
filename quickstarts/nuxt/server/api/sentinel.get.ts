import * as Sentry from "@sentry/nuxt";

export default defineEventHandler(() => {
  Sentry.captureMessage("sentinel-server");
  return { ok: true };
});
