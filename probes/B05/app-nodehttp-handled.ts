import './instrument';
import * as Sentry from '@sentry/bun';
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/error') {
    Sentry.captureException(new Error('nodehttp handled boom'));
    res.statusCode = 500;
    res.end('boom');
    return;
  }
  if (url === '/sentinel') {
    Sentry.captureMessage('sentinel');
    res.end('sentinel');
    return;
  }
  if (url === '/stop') {
    res.end('stopping');
    setTimeout(() => server.close(), 50);
    return;
  }
  res.end('ok');
});

server.listen(Number(process.env.APP_PORT), () => console.log('nodehttp-handled listening on', process.env.APP_PORT));
