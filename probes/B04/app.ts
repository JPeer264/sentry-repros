import './instrument';
import * as Sentry from '@sentry/bun';
import { createServer } from 'node:http';

const DS = `http://127.0.0.1:${process.env.DS_PORT}`;

Bun.serve({
  port: Number(process.env.BUN_PORT),
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return new Response('ok');
    }
    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('sentinel-bun');
      return new Response('ok');
    }
    await fetch(`${DS}/from-bun`);
    return new Response('ok');
  },
});

createServer(async (req, res) => {
  if (req.url?.startsWith('/sentinel')) {
    Sentry.captureMessage('sentinel-node');
    res.end('ok');
    return;
  }
  await new Promise<void>(resolve => {
    const r = require('node:http').get(`${DS}/from-node`, dres => {
      dres.resume();
      dres.on('end', () => resolve());
    });
    r.on('error', () => resolve());
  });
  res.end('ok');
}).listen(Number(process.env.NODE_PORT), '127.0.0.1');

console.log('app up', process.env.BUN_PORT, process.env.NODE_PORT);
