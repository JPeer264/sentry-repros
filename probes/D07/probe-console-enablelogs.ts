import * as Sentry from "@sentry/deno";

const SINK_PORT = Deno.env.get("SINK_PORT") ?? "9999";

const out = (line: string) => Deno.stdout.writeSync(new TextEncoder().encode(`${line}\n`));

// Control run: enableLogs is gone from the options type on develop, so it is passed through a cast.
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  enableLogs: true,
  integrations: [Sentry.consoleLoggingIntegration()],
} as Parameters<typeof Sentry.init>[0]);

console.warn("console warn line", { code: 7 });
console.error("console error line");
console.info("console info line");
console.log("console log line");

out("DONE console calls, waiting 7s, no explicit flush");
await new Promise(resolve => setTimeout(resolve, 7000));
out("EXIT");
