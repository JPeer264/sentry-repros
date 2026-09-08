import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 51213);
let n = 0;

createServer((req, res) => {
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      n += 1;
      console.log(`mock POST ${req.url} auth=${req.headers.authorization} body=${body}`);
      const payload = {
        id: `chatcmpl-mock-${n}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4o-mini-2025-01-01',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `Hello from the mock (${n})`, refusal: null },
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 },
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    console.log(`mock ${req.method} ${req.url} (unhandled)`);
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{"error":"not found"}');
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock openai on http://127.0.0.1:${PORT}`));
