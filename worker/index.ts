import * as Sentry from "@sentry/cloudflare";
import { routeAgentRequest, Agent, callable } from "agents";

class MyBaseAgent extends Agent {
  @callable()
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

export const MyAgent = Sentry.instrumentDurableObjectWithSentry((env: Env) => ({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 1,
}), MyBaseAgent);

export default Sentry.withSentry((env) => ({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 1,
}), {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) {
      return agentResponse;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>);