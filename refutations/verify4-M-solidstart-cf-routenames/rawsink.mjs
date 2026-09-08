import http from 'node:http';
const out = [];
http.createServer((req, res) => {
  if (req.url.startsWith('/__raw')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(out));
  }
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    for (const line of body.split('\n')) {
      try {
        const p = JSON.parse(line);
        if (Array.isArray(p.items)) {
          for (const s of p.items) out.push({ name: s.name, is_segment: s.is_segment, attrs: Object.fromEntries(Object.entries(s.attributes || {}).filter(([k]) => k.includes('segment') || k === 'http.route' || k === 'sentry.op')) });
        }
      } catch {}
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
}).listen(52119, '127.0.0.1', () => console.log('rawsink 52119'));
