import { createServer } from 'node:http';

createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, url: req.url }));
}).listen(Number(process.env.PORT || 41400), '127.0.0.1', () => console.log('echo listening', process.env.PORT || 41400));
