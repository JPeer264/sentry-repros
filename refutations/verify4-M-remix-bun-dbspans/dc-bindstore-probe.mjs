import { AsyncLocalStorage } from 'node:async_hooks';
import dc from 'node:diagnostics_channel';

const als = new AsyncLocalStorage();
const ch = dc.tracingChannel('probe:test');

ch.subscribe({ start() {}, end() {}, asyncStart() {}, asyncEnd() {}, error() {} });

ch.start.bindStore(als, () => {
  const caller = als.getStore();
  console.log('  transform sees caller store:', JSON.stringify(caller));
  return { ...(caller ?? {}), span: 'S' };
});

async function traced() {
  return ch.tracePromise(async () => {
    console.log('  inside traced op, store:', JSON.stringify(als.getStore()));
  }, {});
}

await als.run({ id: 'outer' }, async () => {
  console.log('  before traced, store:', JSON.stringify(als.getStore()));
  await traced();
});
