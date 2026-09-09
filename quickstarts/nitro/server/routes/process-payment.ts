// docs/platforms/javascript/guides/nitro/index.mdx:301-310 ("Manual Spans"), verbatim; the file name is repro-only
import { defineHandler } from "nitro/h3";
import * as Sentry from "@sentry/nitro";

export default defineHandler(() => {
  return Sentry.startSpan({ name: "process-payment" }, () => {
    // ... your code
  });
});
