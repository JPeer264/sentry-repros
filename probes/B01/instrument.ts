import * as Sentry from "@sentry/bun";

const port = process.env.SINK_PORT ?? "9999";
const integrations = [];

if (process.env.REJECTION_MODE) {
  integrations.push(
    Sentry.onUnhandledRejectionIntegration({
      mode: process.env.REJECTION_MODE as "none" | "warn" | "strict",
    }),
  );
}

if (process.env.EXIT_EVEN === "1") {
  integrations.push(
    Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: true }),
  );
}

Sentry.init({
  dsn: "http://publickey@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${port}/`,
  integrations,
});
