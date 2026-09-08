import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  environment: 'control',
  ...(process.env.DISABLE_CHANNEL_INJECTION === '1' ? { enableRuntimeChannelInjection: false } : {}),
});
console.log('[control] init', Sentry.isInitialized(), 'injection', process.env.DISABLE_CHANNEL_INJECTION === '1' ? 'off' : 'on');
const { pool } = await import('./db.mjs');
const http = await import('node:http');
const port = Number(process.env.PORT);
http.createServer(async (req, res) => {
  if (req.url === '/db') {
    const [rows] = await pool.query('SELECT id, name FROM users');
    res.end(JSON.stringify(rows));
    return;
  }
  if (req.url === '/sentinel') { Sentry.captureMessage('sentinel'); res.end('ok'); return; }
  res.end('hi');
}).listen(port, '127.0.0.1', () => console.log(`READY http://127.0.0.1:${port}`));
