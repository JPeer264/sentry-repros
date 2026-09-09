// Runs one agent turn against the mock model, then captures a sentinel message and a sentinel span and flushes.
// The sentinel is what run.sh polls the sink for, instead of sleeping.
import * as Sentry from '@sentry/node';

const { mastra } = await import(process.env.MASTRA_FILE || './mastra-guide.mjs');
const agent = mastra.getAgent('weatherAgent');
let result;
try {
  result = await agent.generate('What is the weather in Berlin right now?', { memory: { thread: 'thread-1', resource: 'user-1' } });
  console.log('agent text:', result.text);
  console.log('agent usage:', JSON.stringify(result.usage ?? result.totalUsage ?? null));
  console.log('agent toolCalls:', JSON.stringify((result.toolCalls || []).map((t) => t.payload?.toolName ?? t.toolName ?? t)));
} catch (e) {
  console.log('agent generate threw:', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e));
}
const client = Sentry.getClient();
console.log('client present:', !!client, 'dsn host:', client?.getDsn()?.host, 'environment:', client?.getOptions().environment, 'release:', JSON.stringify(client?.getOptions().release));
Sentry.captureMessage('sentinel');
Sentry.startSpan({ name: 'sentinel', op: 'test' }, () => {});
const flushed = await Sentry.flush(10000);
console.log('flushed:', flushed);
