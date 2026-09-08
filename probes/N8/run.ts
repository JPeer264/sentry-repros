import { handler } from './app.ts';

const port = Number(Deno.env.get('PORT'));
Deno.serve({ port, hostname: '127.0.0.1' }, handler);
