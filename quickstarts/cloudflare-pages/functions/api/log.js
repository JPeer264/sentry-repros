import * as Sentry from "@sentry/cloudflare";

export async function onRequest() {
  Sentry.logger.info("hello from /api/log", { route: "/api/log" });
  return new Response("logged");
}
