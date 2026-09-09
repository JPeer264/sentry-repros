// includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
import { defineHandler } from "nitro/h3";
import * as Sentry from "@sentry/nitro";

export default defineHandler(() => {
  Sentry.logger.info("User example action completed");
  return "logged\n";
});
