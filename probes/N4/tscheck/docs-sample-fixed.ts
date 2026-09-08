// The same sample with the `enableRpcTracePropagation` line removed.
import * as Sentry from '@sentry/cloudflare';
import { Agent, callable } from 'agents';

interface Env {}

class MyAgentBase extends Agent<Env> {
  @callable()
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

export const MyAgent = Sentry.instrumentAgentWithSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tracesSampleRate: 1.0,
  }),
  MyAgentBase,
);
