import { routes, type Env } from './routes';

export default {
  async fetch(request, env, ctx) {
    return routes(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
