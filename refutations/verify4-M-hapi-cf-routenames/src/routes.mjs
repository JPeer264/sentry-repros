import Hapi from '@hapi/hapi';

export const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

export function registerRoutes(Sentry) {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
  server.route({ method: 'GET', path: '/users/{id}', handler: req => ({ id: req.params.id }) });
  server.route({
    method: 'GET',
    path: '/posts/{pid}/comments/{cid}',
    handler: req => ({ pid: req.params.pid, cid: req.params.cid }),
  });
  server.route({
    method: 'GET',
    path: '/sentinel',
    handler: () => {
      Sentry.captureMessage('sentinel');
      return { sentinel: true };
    },
  });
}
