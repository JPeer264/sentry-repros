import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
});

Sentry.setUser({ id: "u-42", email: "probe@example.com", username: "probe" });
Sentry.setTag("probe", "B02");
Sentry.setContext("order", { id: "ord-7", total: 12.5 });
Sentry.setExtra("attempt", 3);
Sentry.addBreadcrumb({ category: "manual", message: "manual breadcrumb", level: "info", data: { step: 1 } });

console.log("console log before captureException");

function innerThrow() {
  throw new Error("B02 enrichment error");
}

try {
  innerThrow();
} catch (e) {
  Sentry.captureException(e);
}
Sentry.captureMessage("sentinel");

await Sentry.flush(5000);
