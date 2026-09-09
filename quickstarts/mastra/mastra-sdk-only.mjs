// Repro-only: no @mastra/sentry exporter and no Observability config. Used with `node --import ./instrument.mjs`
// to see what @sentry/node's own default `mastraIntegration` produces (the guide never mentions it).
import { Mastra } from "@mastra/core";
import { weatherAgent } from "./agent.mjs";

export const mastra = new Mastra({
  agents: { weatherAgent },
});
