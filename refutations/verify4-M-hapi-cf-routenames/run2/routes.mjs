import Hapi from '@hapi/hapi';

export const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

export function registerRoutes(Sentry, manualRename) {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
  server.route({ method: 'GET', path: '/users/{id}', handler: req => ({ id: req.params.id }) });
  server.route({
    method: 'GET',
    path: '/posts/{pid}/comments/{cid}',
    handler: req => ({ pid: req.params.pid, cid: req.params.cid }),
  });
  server.route({
    method: 'GET',
    path: '/probe',
    handler: () => {
      const active = Sentry.getActiveSpan();
      const root = active ? Sentry.getRootSpan(active) : undefined;
      console.log('PROBE', JSON.stringify({
        hasActive: !!active,
        activeJson: active ? Sentry.spanToJSON(active) : null,
        rootJson: root ? Sentry.spanToJSON(root) : null,
      }));
      return { probed: true };
    },
  });
  server.route({
    method: 'GET',
    path: '/sentinel',
    handler: () => {
      Sentry.captureMessage('sentinel');
      return { sentinel: true };
    },
  });

  if (manualRename) {
    server.ext('onPreResponse', (request, h) => {
      const active = Sentry.getActiveSpan();
      const root = active ? Sentry.getRootSpan(active) : undefined;
      if (root && request.route && request.route.path) {
        const name = `${request.method.toUpperCase()} ${request.route.path}`;
        Sentry.updateSpanName(root, name);
        root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
      } else {
        console.log('MANUAL RENAME: no active span', !!active, request.route && request.route.path);
      }
      return h.continue;
    });
  }
}
