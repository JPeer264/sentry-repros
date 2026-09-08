import dc from 'node:diagnostics_channel';
import http from 'node:http';
const seen = [];
try {
  dc.subscribe('http.server.request.start', () => { seen.push('server.request.start'); });
  dc.subscribe('http.server.response.finish', () => { seen.push('server.response.finish'); });
} catch (e) { console.log('subscribe threw', e.message); }
const srv = http.createServer((req, res) => { res.end('ok'); });
srv.listen(0, async () => {
  const port = srv.address().port;
  await fetch(`http://127.0.0.1:${port}/x`);
  setTimeout(() => { console.log('CHANNELS_SEEN=' + JSON.stringify(seen)); srv.close(); process.exit(0); }, 200);
});
