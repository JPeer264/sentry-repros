import { Elysia } from 'elysia';

new Elysia().get('/users/:id', ({ params }) => ({ id: params.id })).listen(Number(process.env.APP_PORT ?? 41371));

console.log('bare listening', process.env.APP_PORT ?? 41371);
