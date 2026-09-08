import { createServer } from 'node:http';
createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ headers: req.headers }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('echo ready'));
