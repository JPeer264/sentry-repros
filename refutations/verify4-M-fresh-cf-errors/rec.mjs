import { createServer } from 'node:http';
const recorded = [];
createServer((req, res) => {
  if (req.url === '/dump') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recorded));
    return;
  }
  recorded.push({ url: req.url, method: req.method, headers: req.headers });
  res.setHeader('content-type', 'application/json');
  res.end('{"ok":true}');
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('rec listening'));
