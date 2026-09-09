// docs/platforms/javascript/guides/nitro/index.mdx:233-249, verbatim except the file name
// (the guide replaces routes/debug-sentry.ts; both are kept so one server serves both verify snippets)
import { defineHandler } from "nitro/h3";
import * as Sentry from "@sentry/nitro";

export default defineHandler(async () => {
  await Sentry.startSpan(
    {
      op: "test",
      name: "My First Test Transaction",
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      throw new Error("My first Sentry error!");
    }
  );
});
