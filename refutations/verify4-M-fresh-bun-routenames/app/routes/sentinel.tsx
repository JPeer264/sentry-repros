import * as Sentry from "@sentry/bun";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET() {
    Sentry.captureMessage("sentinel");
    return new Response("ok");
  },
});
