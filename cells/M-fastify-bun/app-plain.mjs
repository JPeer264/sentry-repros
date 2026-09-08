import Fastify from 'fastify';

const PORT = Number(process.env.PORT || 47316);
const app = Fastify();
app.get('/users/:id', async request => ({ id: request.params.id, name: 'ok' }));
await app.listen({ port: PORT, host: '127.0.0.1' });
console.log(`plain fastify listening ${PORT}`);
