import { createHash, randomUUID } from 'node:crypto';

const appPort = process.argv[2] ?? '41826';
const sinkPort = process.argv[3] ?? '41726';
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function expectedTraceId(instanceId) {
  if (UUID_RE.test(instanceId)) return instanceId.replace(/-/g, '');
  return createHash('sha1').update(instanceId).digest('hex').slice(0, 32);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function trigger(id, throwTimes, limit) {
  const res = await fetch(`${app}/trigger?id=${encodeURIComponent(id)}&throwTimes=${throwTimes}&limit=${limit}`);
  return res.json();
}

async function status(id) {
  const res = await fetch(`${app}/status/${encodeURIComponent(id)}`);
  return res.json();
}

async function waitForTerminal(id, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await status(id);
    if (['complete', 'errored', 'terminated'].includes(last.status)) return last;
    await wait(1000);
  }
  return { ...last, timedOut: true };
}

const ids = {
  A: randomUUID(),
  B: `probe-c26-nonuuid-${Date.now()}`,
  C: randomUUID(),
};

await fetch(`${sink}/__items`, { method: 'DELETE' });

await trigger(ids.A, 1, 3);
await trigger(ids.B, 1, 3);
await trigger(ids.C, 99, 1);

const statuses = {
  A: await waitForTerminal(ids.A),
  B: await waitForTerminal(ids.B),
  C: await waitForTerminal(ids.C),
};

console.log('instance ids:', JSON.stringify(ids));
console.log('status', JSON.stringify(statuses));
console.log('expected trace ids:', {
  A: expectedTraceId(ids.A),
  B: expectedTraceId(ids.B),
  C: expectedTraceId(ids.C),
});

await fetch(`${app}/sentinel`);
for (let i = 0; i < 60; i++) {
  const list = await (await fetch(`${sink}/__items`)).json();
  if (list.some(x => x.type === 'event' && x.message === 'sentinel 1')) break;
  await wait(500);
}

const items = await (await fetch(`${sink}/__items`)).json();
for (const item of items) console.log(JSON.stringify(item));

const workflowExceptions = items.filter(x => x.type === 'event' && x.mechanism === 'auto.faas.cloudflare.workflow');
console.log(`(total exception events for 3 instances: ${workflowExceptions.length})`);
