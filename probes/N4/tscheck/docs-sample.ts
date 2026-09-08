// features/agents-sdk.mdx:18-33, verbatim apart from the `Env` declaration and the DSN placeholder.
import * as Sentry from "@sentry/cloudflare";
import { Agent, callable } from "agents";

interface Env {}

class MyAgentBase extends Agent<Env> {
  @callable()
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

// Export your named class as defined in your wrangler config
export const MyAgent = Sentry.instrumentAgentWithSentry(
  (env: Env) => ({
    dsn: "https://abc123@127.0.0.1/1",
    tracesSampleRate: 1.0,
    enableRpcTracePropagation: true,
  }),
  MyAgentBase
);
