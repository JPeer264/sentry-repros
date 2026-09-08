import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/cloudflare';

interface Env {
  /** Port of the local envelope sink the SDK tunnels to. */
  SINK_PORT: string;
  /** Host and port of the MariaDB instance the Prisma adapter connects to. */
  DB_HOST: string;
  DB_PORT: string;
}

let client: PrismaClient | undefined;

// The adapter must be constructed inside the request handler: at module scope workerd
// traps in the Prisma wasm engine and the connection pool times out after 10001ms.
function getPrisma(env: Env): PrismaClient {
  if (!client) {
    const adapter = new PrismaMariaDb({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: 'root',
      password: '',
      database: 'app',
      connectionLimit: 2,
    });
    client = new PrismaClient({ adapter });
  }
  return client;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: 'static' as const,
    integrations: [Sentry.prismaIntegration()],
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/users') {
        const rows = await getPrisma(env).users.findMany();
        return new Response(JSON.stringify({ ok: true, rows }) + '\n');
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('n2-prisma-sentinel');
        return new Response('sentinel\n');
      }

      return new Response('hello\n');
    },
  },
);
