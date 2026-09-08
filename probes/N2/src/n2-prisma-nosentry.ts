import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

interface Env {
  DB_HOST: string;
  DB_PORT: string;
}

// Deliberately at module scope: this is the failure control for the note that the
// Prisma adapter cannot be constructed outside the request handler on workerd.
const adapter = new PrismaMariaDb({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
  connectionLimit: 2,
});
const prisma = new PrismaClient({ adapter });

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/users') {
      try {
        const rows = await prisma.users.findMany();
        return new Response(JSON.stringify({ ok: true, rows }) + '\n');
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e).slice(0, 400) }) + '\n');
      }
    }
    return new Response('hello\n');
  },
};
