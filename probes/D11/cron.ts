import * as Sentry from "@sentry/deno";

const port = Deno.env.get("SINK_PORT") ?? "9999";
const runMs = Number(Deno.env.get("RUN_MS") ?? "70000");

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
  integrations: [Sentry.denoCronIntegration()],
});

console.log("sdk=" + Sentry.SDK_VERSION, "Deno.cron=" + typeof Deno.cron);

try {
  Deno.cron("probe", "* * * * *", async () => {
    console.log("cron fired", new Date().toISOString());
    await new Promise(resolve => setTimeout(resolve, 200));
  });
  console.log("Deno.cron registered");
} catch (error) {
  console.log("Deno.cron threw:", String(error));
  Sentry.captureException(error);
}

setTimeout(async () => {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(3000);
  console.log("done");
  Deno.exit(0);
}, runMs);
