// The Durable Object bound in wrangler.agent.jsonc is not declared here, it is
// re-exported from another module. The plugin can only rewrite declarations it
// sees in the entry, so this is the case where it has to warn instead.
export { Counter } from './counter';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/error') {
      throw new Error('route boom');
    }
    return Response.json({ worker: 'agent', path: url.pathname });
  },
} satisfies ExportedHandler<Env>;
