import * as Sentry from "@sentry/deno";
import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    Sentry.captureMessage("sentinel");
    await Sentry.flush(2000);
    return new Response("sentinel sent");
  },
});
