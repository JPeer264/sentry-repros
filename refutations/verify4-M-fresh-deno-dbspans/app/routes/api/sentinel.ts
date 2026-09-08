import * as Sentry from "@sentry/deno";

export const handler = {
  GET() {
    Sentry.captureMessage("sentinel");
    return new Response("ok");
  },
};
