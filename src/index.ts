import { Mastra } from '@mastra/core';
import { InMemoryStore } from '@mastra/core/storage';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { Hono } from 'hono';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as dc from 'node:diagnostics_channel';
import { z } from 'zod';

const probeStore = new AsyncLocalStorage<string>();
const storeSeenInStep: (string | undefined)[] = [];

// Both constructed at module scope on purpose: this is what PR 24386 must support on workerd.
const echoStep = createStep({
  id: 'echo-step',
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ echoed: z.string() }),
  execute: async ({ inputData }) => {
    storeSeenInStep.push(probeStore.getStore());
    await fetch(`https://example.com/?step=${inputData.id}`);
    return { echoed: `echo:${inputData.id}` };
  },
});

const echoWorkflow = createWorkflow({
  id: 'echo-workflow',
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ echoed: z.string() }),
})
  .then(echoStep)
  .commit();

const mastra = new Mastra({
  workflows: { echoWorkflow },
  storage: new InMemoryStore(),
});

const app = new Hono<{ Bindings: Env }>();

app.use('/workflow/*', async function userTimingMiddleware(_c, next) {
  await next();
});

app.get('/health', c => c.json({ ok: true }));

app.get('/hono/:id', c => {
  const tc = dc.tracingChannel(HONO_CHANNEL) as unknown as Record<string, { hasSubscribers: unknown }>;
  return c.json({
    honoConstructorSubscribers: Object.fromEntries(SUB_CHANNELS.map(s => [s, hasSubs(tc[s]!)])),
    routes: app.routes.map(r => `${r.method} ${r.path} ${r.handler.name || '(anonymous)'}`),
  });
});

app.get('/workflow/:id', async c => {
  const id = c.req.param('id');
  const run = await mastra.getWorkflow('echoWorkflow').createRun();
  const result = await run.start({ inputData: { id } });
  return c.json({ id, status: result.status, result: result.status === 'success' ? result.result : null });
});

const MASTRA_CHANNELS = ['orchestrion:@mastra/core:mastraConstructor', 'orchestrion:@mastra/core:mastraExecuteWithContext'];
const HONO_CHANNEL = 'orchestrion:hono:honoConstructor';
const SUB_CHANNELS = ['start', 'end', 'asyncStart', 'asyncEnd', 'error'] as const;

function hasSubs(ch: { hasSubscribers: unknown }): boolean {
  const v = ch.hasSubscribers;
  return typeof v === 'function' ? Boolean(v.call(ch)) : Boolean(v);
}

app.get('/channels/:id', async c => {
  const subscribers = Object.fromEntries(
    MASTRA_CHANNELS.map(name => {
      const tc = dc.tracingChannel(name) as unknown as Record<string, { hasSubscribers: unknown }>;
      return [name, Object.fromEntries(SUB_CHANNELS.map(s => [s, hasSubs(tc[s]!)]))];
    }),
  );

  const m = mastra as unknown as {
    observability?: { getDefaultInstance?: () => { getExporters?: () => { name?: string }[] } | undefined };
  };
  const exporters = (m.observability?.getDefaultInstance?.()?.getExporters?.() ?? []).map(e => ({
    name: e.name,
    sentryBrand: Boolean((e as Record<symbol, unknown>)[Symbol.for('sentry.mastra.exporter')]),
  }));

  const counts: Record<string, number> = {};
  const spanTypes: string[] = [];
  const unsubs: (() => void)[] = [];
  for (const name of MASTRA_CHANNELS) {
    const tc = dc.tracingChannel(name) as unknown as Record<string, dc.Channel>;
    for (const s of SUB_CHANNELS) {
      const key = `${name.split(':').pop()}.${s}`;
      counts[key] = 0;
      const fn = (msg: unknown): void => {
        counts[key]!++;
        const span = (msg as { arguments?: { span?: { type?: string; name?: string } }[] }).arguments?.[0]?.span;
        if (s === 'start' && span) spanTypes.push(`${span.type}:${span.name}`);
      };
      tc[s]!.subscribe(fn);
      unsubs.push(() => tc[s]!.unsubscribe(fn));
    }
  }
  const ewc = dc.tracingChannel(MASTRA_CHANNELS[1]!) as unknown as { start: { bindStore: Function; unbindStore: Function } };
  ewc.start.bindStore(probeStore, () => 'bound-via-channel');
  storeSeenInStep.length = 0;
  const run = await mastra.getWorkflow('echoWorkflow').createRun();
  const result = await run.start({ inputData: { id: c.req.param('id') } });
  ewc.start.unbindStore(probeStore);
  unsubs.forEach(u => u());

  return c.json({ status: result.status, subscribers, exporters, eventsDuringWorkflow: counts, spanTypes, storeSeenInStep });
});

app.get('/boom/:id', () => {
  throw new Error(`repro-24386 hono error ${Date.now()}`);
});

export default app;
