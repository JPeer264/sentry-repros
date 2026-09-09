// docs/platforms/javascript/guides/cloudflare/index.mdx:325-337 ("Tracing", "Cloudflare Pages"), verbatim.
// The printed snippet has no import line.
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
