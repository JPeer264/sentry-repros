import http from 'node:http';
import fs from 'node:fs';
const out = fs.createWriteStream(process.env.OUT ?? './raw.ndjson');
http
  .createServer((req, res) => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => {
      out.write(JSON.stringify(b) + '\n');
      res.writeHead(200);
      res.end('{}');
    });
  })
  .listen(Number(process.env.PORT));
