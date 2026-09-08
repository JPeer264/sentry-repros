import * as Sentry from "@sentry/node";

const RECORDER = process.env.RECORDER_URL;

export async function handle(req, res) {
  const url = req.url || "/";

  if (url.startsWith("/debug-sentry")) {
    try {
      throw new Error("debug-sentry route failure");
    } catch (e) {
      Sentry.captureException(e);
    }
    res.statusCode = 500;
    res.end("captured\n");
    return;
  }

  if (url.startsWith("/debug-span")) {
    const body = await Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, async () => {
      const r = await fetch(`${RECORDER}/recorder?from=debug-span`);
      return await r.text();
    });
    res.end(`span done ${body}\n`);
    return;
  }

  if (url.startsWith("/debug-log")) {
    Sentry.logger.info("hello from /debug-log", { route: "/debug-log" });
    res.end("logged\n");
    return;
  }

  if (url.startsWith("/sentinel")) {
    Sentry.captureMessage("sentinel");
    res.end("sentinel\n");
    return;
  }

  res.statusCode = 404;
  res.end("not found\n");
}
