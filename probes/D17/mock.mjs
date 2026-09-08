import { createServer } from 'node:http';

createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    console.log(`MOCK ${req.method} ${req.url} ${Buffer.concat(chunks).toString('utf8')}`);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      id: 'chatcmpl-mock123',
      object: 'chat.completion',
      created: 1700000000,
      model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant', content: 'Hello from the mock' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 },
    }));
  });
}).listen(Number(process.env.PORT || 9998), '127.0.0.1', () => console.log('mock listening', process.env.PORT || 9998));
