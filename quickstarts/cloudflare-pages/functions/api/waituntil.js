import * as Sentry from "@sentry/cloudflare";

// index.mdx:394-401 shape (Worker code), applied to the Pages EventContext.
export async function onRequest(context) {
  context.waitUntil(
    Sentry.startSpan({ name: "background.task", op: "task" }, () =>
      fetch("http://127.0.0.1:4747/recorder?from=waituntil")
    )
  );
  return new Response("waituntil");
}
