// repro-only: the run polls the sink for this event and its server span instead of sleeping
import { defineHandler } from "nitro/h3";
import * as Sentry from "@sentry/nitro";

export default defineHandler(() => {
  Sentry.captureMessage("sentinel");
  return "sentinel\n";
});
