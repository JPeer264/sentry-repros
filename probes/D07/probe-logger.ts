import * as Sentry from "@sentry/deno";

const SINK_PORT = Deno.env.get("SINK_PORT") ?? "9999";

// No log-related options: on develop (v11) there is no enableLogs option, logs are always on.
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
});

Sentry.logger.trace("trace line");
Sentry.logger.debug("debug line");
Sentry.logger.info("info line", { route: "/probe", count: 3, ok: true });
Sentry.logger.warn("warn line");
Sentry.logger.error("error line", { err: "E1" });
Sentry.logger.fatal("fatal line");
Sentry.logger.info(Sentry.logger.fmt`fmt user ${"alice"} id ${42}`);

console.log("DONE logger calls, waiting 7s, no explicit flush");
await new Promise(resolve => setTimeout(resolve, 7000));
console.log("EXIT");
