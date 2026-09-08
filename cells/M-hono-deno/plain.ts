import { Hono } from 'hono';

const app = new Hono();
app.get('/users/:id', c => c.json({ id: c.req.param('id') }));

Deno.serve({ port: Number(Deno.env.get('APP_PORT') || 52818), hostname: '127.0.0.1' }, app.fetch);
