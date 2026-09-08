import { Hono } from 'hono';

const app = new Hono();
app.get('/users/:id', c => c.json({ id: c.req.param('id') }));

export default { port: Number(process.env.PORT || 41799), fetch: app.fetch };
