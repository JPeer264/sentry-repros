import http from 'node:http';
import fs from 'node:fs';

const out = fs.createWriteStream(process.env.OUT || 'raw.ndjson', { flags: 'a' });

http
  .createServer((req, res) => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => {
      out.write(JSON.stringify(b) + '\n');
      res.writeHead(200, { 'access-control-allow-origin': '*' });
      res.end('{}');
    });
  })
  .listen(Number(process.env.PORT), '127.0.0.1', () => console.log('rawsink up'));
