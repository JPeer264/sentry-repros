import { AIChatAgent } from '@cloudflare/ai-chat';
import * as Sentry from '@sentry/cloudflare';
import { Agent, callable, routeAgentRequest } from 'agents';

export interface Env {
  SINK_URL: string;
  RPC_PROP?: string;
  MyAgent: DurableObjectNamespace;
  LegacyAgent: DurableObjectNamespace;
  MyChatAgent: DurableObjectNamespace;
}

const sentryOptions = (env: Env) => {
  const options = {
    dsn: 'https://abc123@127.0.0.1/1',
    tunnel: env.SINK_URL,
    tracesSampleRate: 1.0,
  };

  // The docs sample passes `enableRpcTracePropagation`, which develop's options type rejects (it is
  // typed `never`). Writing it through an index keeps this file type-clean while the Worker still
  // receives the option at runtime, which is what the `--var RPC_PROP:1` run checks.
  if (env.RPC_PROP === '1') {
    (options as Record<string, unknown>).enableRpcTracePropagation = true;
  }

  return options;
};

class MyAgentBase extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    return Sentry.startSpan({ name: 'chat-http', op: 'gen_ai.chat' }, async () => new Response('http-turn-ok'));
  }

  @callable()
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }

  @callable()
  async aiTurn(): Promise<string> {
    return Sentry.startSpan({ name: 'chat', op: 'gen_ai.chat' }, async () => 'turn-done');
  }

  @callable()
  async writeKeys(): Promise<string> {
    await this.ctx.storage.put('mine', 1);
    await this.ctx.storage.put('cf_x', 1);
    await this.ctx.storage.put('__ps_y', 1);
    await this.ctx.storage.put('/z', 1);
    return 'wrote';
  }

  @callable()
  async clearChat(): Promise<string> {
    (this as unknown as { _emit: (t: string) => void })._emit('message:clear');
    return 'cleared';
  }

  @callable()
  async sentinel(): Promise<string> {
    Sentry.captureMessage('sentinel');
    return 'sentinel';
  }
}

export const MyAgent = Sentry.instrumentAgentWithSentry(sentryOptions, MyAgentBase);

// The docs' pre-10.69 path: instrumentDurableObjectWithSentry plus a manual Sentry.setConversationId.
class LegacyAgentBase extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    Sentry.setConversationId('conv_abc123');
    return Sentry.startSpan({ name: 'legacy-chat-http', op: 'gen_ai.chat' }, async () => new Response('legacy-ok'));
  }

  @callable()
  async legacyTurn(): Promise<string> {
    return Sentry.startSpan({ name: 'legacy-chat', op: 'gen_ai.chat' }, async () => 'legacy-turn-done');
  }
}

export const LegacyAgent = Sentry.instrumentDurableObjectWithSentry(sentryOptions, LegacyAgentBase);

class MyChatAgentBase extends AIChatAgent<Env> {
  async onChatMessage(): Promise<Response | undefined> {
    return Sentry.startSpan({ name: 'chat', op: 'gen_ai.chat' }, async () => undefined);
  }

  @callable()
  async aiTurn(): Promise<string> {
    return Sentry.startSpan({ name: 'chat', op: 'gen_ai.chat' }, async () => 'chat-turn-done');
  }
}

export const MyChatAgent = Sentry.instrumentAgentWithSentry(sentryOptions, MyChatAgentBase);

export default Sentry.withSentry(sentryOptions, {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('worker-sentinel');
      return new Response('sentinel');
    }

    return (await routeAgentRequest(request, env)) ?? new Response('not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>);
