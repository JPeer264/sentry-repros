import Hapi from '@hapi/hapi';
import http from 'node:http';
import * as Sentry from '@sentry/deno';

const SINK = Deno.env.get('SINK_PORT') ?? '41971';
const REC = Number(Deno.env.get('REC_PORT') ?? '41972');
const PORT = Number(Deno.env.get('APP_PORT') ?? '41973');

const server = Hapi.server({ port: PORT, host: '127.0.0.1' });

server.route({
  method: 'GET',
  path: '/downstream',
  handler: async () => {
    const r = await fetch(`http://127.0.0.1:${REC}/api/downstream`);
    return { ok: true, body: await r.text() };
  },
});

server.route({
  method: 'GET',
  path: '/downstream-http',
  handler: async () => {
    await new Promise<void>(resolve => {
      http.get(`http://127.0.0.1:${REC}/api/downstream-http`, res => {
        res.resume();
        res.on('end', () => resolve());
      });
    });
    return { ok: true };
  },
});

server.route({
  method: 'GET',
  path: '/sentinel',
  handler: () => {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  },
});

await server.start();
console.log('hapi listening on', server.info.uri, 'sink', SINK, 'rec', REC);
