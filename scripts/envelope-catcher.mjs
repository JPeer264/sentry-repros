// Local Sentry envelope sink for `wrangler dev`: prints one line per envelope.
// usage: node scripts/envelope-catcher.mjs [port=9999]
import { createServer } from 'node:http';

const port = Number(process.argv[2] || 9999);
let n = 0;

const parse = line => {
  try {
    return JSON.parse(line);
  } catch {
    return {};
  }
};

createServer((req, res) => {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    n++;
    const lines = body.split('\n');
    const header = parse(lines[0]);
    const items = [];
    for (let i = 1; i < lines.length - 1; i += 2) {
      const type = parse(lines[i]).type;
      const payload = parse(lines[i + 1]);
      const summary = { type };
      if (type === 'transaction') summary.transaction = payload.transaction;
      if (type === 'event') summary.message = payload.message || payload.exception?.values?.[0]?.value;
      if (type === 'span') summary.spans = (payload.items || []).map(s => s.name);
      if (type === 'log') summary.logs = (payload.items || []).map(l => l.body);
      if (type === 'trace_metric') summary.metrics = (payload.items || []).map(m => m.name);
      items.push(summary);
    }
    const trace = (header.trace?.trace_id || '-').slice(0, 8);
    console.log(`#${n} ${new Date().toISOString()} trace=${trace} ${JSON.stringify(items)}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
}).listen(port, () => console.log(`envelope catcher on http://127.0.0.1:${port}`));
