import * as Sentry from '@sentry/cloudflare';
import OpenAI from 'openai';

const MOCK_OPENAI_BASE_URL = 'http://127.0.0.1:51213/v1';

const client = new OpenAI({ apiKey: 'test-key', baseURL: MOCK_OPENAI_BASE_URL });

interface Env {
  SINK_URL: string;
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/ai') {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hi' }],
    });
    return Response.json({ id: completion.id, text: completion.choices[0]?.message?.content });
  }

  if (url.pathname === '/injected') {
    const marker = (globalThis as Record<string, any>).__SENTRY_ORCHESTRION__;
    const registered: Map<string, () => { name: string }> | undefined = marker?.integrations;
    const bundler = registered ? [...registered.keys()] : [];
    const sentryClient = Sentry.getClient();
    const integrations = registered
      ? [...registered.values()]
          .map(factory => factory().name)
          .filter(name => !!sentryClient?.getIntegrationByName(name))
      : [];
    return Response.json({ integrations, bundler });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('ok');
  }

  return new Response('not found', { status: 404 });
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://c16publickey@127.0.0.1/1',
    tunnel: env.SINK_URL,
    tracesSampleRate: 1,
    sendDefaultPii: true,
  }),
  {
    fetch: handle,
  },
);
