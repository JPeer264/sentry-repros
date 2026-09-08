import WebSocket from 'ws';

const APP = process.env.APP_PORT || '51735';
const SINK = process.env.SINK_PORT || '47211';
const base = `http://127.0.0.1:${APP}`;

const wait = ms => new Promise(r => setTimeout(r, ms));

function connect(path) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${APP}${path}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function rpc(ws, method, args = []) {
  return new Promise((resolve, reject) => {
    const id = `${method}-${Math.random().toString(36).slice(2)}`;
    const onMessage = data => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }
      if (msg.type === 'rpc' && msg.id === id) {
        ws.off('message', onMessage);
        resolve(msg);
      }
    };
    ws.on('message', onMessage);
    ws.send(JSON.stringify({ type: 'rpc', id, method, args }));
    setTimeout(() => { ws.off('message', onMessage); reject(new Error(`rpc ${method} timed out`)); }, 15000);
  });
}

async function items() {
  return (await fetch(`http://127.0.0.1:${SINK}/__items`)).json();
}

async function waitForSentinel(label, timeoutMs = 25000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const list = await items();
    if (list.some(i => i.type === 'event' && i.message === label)) return true;
    await wait(400);
  }
  return false;
}

await fetch(`http://127.0.0.1:${SINK}/__items`, { method: 'DELETE' });

// 1. instrumentAgentWithSentry class: HTTP turn, then callable RPCs over WebSocket.
console.log('[http]', await (await fetch(`${base}/agents/my-agent/room-1`)).text());

const ws = await connect('/agents/my-agent/room-1');
for (const [method, args] of [
  ['greet', ['world']],
  ['aiTurn', []],
  ['writeKeys', []],
  ['clearChat', []],
  ['aiTurn', []],
  ['sentinel', []],
]) {
  const res = await rpc(ws, method, args);
  console.log('[rpc]', method, JSON.stringify(res.result ?? res.error));
}
ws.close();

// 2. instrumentDurableObjectWithSentry class (the docs' pre-10.69 path).
console.log('[http legacy]', await (await fetch(`${base}/agents/legacy-agent/legacy-1`)).text());
const lws = await connect('/agents/legacy-agent/legacy-1');
console.log('[rpc legacy]', JSON.stringify((await rpc(lws, 'legacyTurn')).result));
lws.close();

// 3. Sentinel through the plain worker route: everything sent before it has arrived once it lands.
await fetch(`${base}/sentinel`);
console.log('[sentinel arrived]', await waitForSentinel('worker-sentinel'));

const list = await items();
console.log('--- sink items ---');
for (const item of list) {
  if (item.type === 'span') {
    for (const s of item.items) console.log(JSON.stringify(s));
  } else {
    console.log(JSON.stringify(item));
  }
}
