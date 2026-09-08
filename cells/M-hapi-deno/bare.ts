import Hapi from '@hapi/hapi';

const server = Hapi.server({ port: 0, host: '127.0.0.1' });
server.route({
  method: 'GET',
  path: '/users/{id}',
  handler: (req: { params: { id: string } }) => ({ id: req.params.id, bare: true }),
});
await server.start();
console.log('READY PORT=' + server.info.port);
