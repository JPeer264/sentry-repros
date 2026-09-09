// docs/platforms/javascript/common/agent-tracing/mastra.mdx:84-104 verbatim ("Explicit Configuration"),
// plus the agent from ./agent.mjs.
import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { SentryExporter } from "@mastra/sentry";
import { weatherAgent } from "./agent.mjs";

export const mastra = new Mastra({
  agents: { weatherAgent },
  observability: new Observability({
    configs: {
      sentry: {
        serviceName: "my-service",
        exporters: [
          new SentryExporter({
            dsn: process.env.SENTRY_DSN,
            environment: "production",
            tracesSampleRate: 1.0,
          }),
        ],
      },
    },
  }),
});
