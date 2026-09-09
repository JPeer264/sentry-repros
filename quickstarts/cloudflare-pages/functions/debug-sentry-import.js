// Same as debug-sentry.js with the import line the docs snippet is missing.
import * as Sentry from "@sentry/cloudflare";

export async function onRequest(context) {
  await Sentry.startSpan(
    {
      op: "test",
      name: "My First Test Transaction",
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
      throw new Error("My first Sentry error!");
    }
  );
}
