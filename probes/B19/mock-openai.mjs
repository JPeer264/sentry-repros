import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 41872);

createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    console.log(req.method, req.url);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      id: 'chatcmpl-mock1',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Hello from mock' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
    }));
  });
}).listen(PORT, '127.0.0.1', () => console.log('mock openai listening', PORT));
