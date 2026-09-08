import * as Sentry from "@sentry/deno";

const SINK_PORT = Deno.env.get("SINK_PORT") ?? "9999";

// Status output bypasses console so it is not itself captured as a log item.
const out = (line: string) => Deno.stdout.writeSync(new TextEncoder().encode(`${line}\n`));

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  integrations: [Sentry.consoleLoggingIntegration()],
});

console.warn("console warn line", { code: 7 });
console.error("console error line");
console.info("console info line");
console.log("console log line");

out("DONE console calls, waiting 7s, no explicit flush");
await new Promise(resolve => setTimeout(resolve, 7000));
out("EXIT");
