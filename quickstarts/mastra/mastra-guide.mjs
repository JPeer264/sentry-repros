// docs/platforms/javascript/guides/mastra/index.mdx:59-79 verbatim (src/mastra/index.ts, types dropped),
// with the agent from ./agent.mjs in place of the "// agents, workflows, ..." comment.
import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { SentryExporter } from "@mastra/sentry";
import { weatherAgent } from "./agent.mjs";

export const mastra = new Mastra({
  agents: { weatherAgent },
  observability: new Observability({
    configs: {
      sentry: {
        serviceName: "my-mastra-service",
        exporters: [
          new SentryExporter({
            tracesSampleRate: 1.0,
          }),
        ],
      },
    },
  }),
});
