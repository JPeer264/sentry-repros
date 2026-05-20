import { routeAgentRequest } from "agents";
import { Agent, callable } from "agents";

export class MyAgent extends Agent<Env> {
  @callable()
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) {
      return agentResponse;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
