import http from 'node:http';
const S = globalThis.__S;
const port = Number(process.env.PORT || 41602);
http.createServer(async (req, res) => {
  if (req.url === '/error') {
    try { throw new Error('boom-http'); } catch (e) { S.captureException(e); }
    res.writeHead(500); res.end('err'); return;
  }
  if (req.url === '/sentinel') { S.captureMessage('sentinel'); await S.flush(3000); res.end('ok'); return; }
  res.end('ok');
}).listen(port, () => console.log('[probe] listening', port));
