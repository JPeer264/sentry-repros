import './instrument';

import * as Sentry from '@sentry/bun';
import OpenAI from 'openai';

const PORT = Number(process.env.PORT ?? 41873);
const MOCK_PORT = process.env.MOCK_PORT ?? '41872';

// Module scope on purpose: an in-request first load would hit known finding K11.
const openai = new OpenAI({
  apiKey: 'test-key',
  baseURL: `http://127.0.0.1:${MOCK_PORT}/v1`,
});

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  routes: {
    '/ai': async () => {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hi' }],
      });
      return Response.json({ text: res.choices[0]?.message?.content, usage: res.usage });
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
});

console.log(`PORT=${PORT} bun=${Bun.version} mock=${MOCK_PORT}`);
