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
      if (msg.type === 'rpc' && msg.id === id) { ws.off('message', onMessage); resolve(msg); }
    };
    ws.on('message', onMessage);
    ws.send(JSON.stringify({ type: 'rpc', id, method, args }));
    setTimeout(() => { ws.off('message', onMessage); reject(new Error(`rpc ${method} timed out`)); }, 15000);
  });
}

function chatRequest(ws, text) {
  const id = `chat-${Math.random().toString(36).slice(2)}`;
  ws.send(JSON.stringify({
    type: 'cf_agent_use_chat_request',
    id,
    init: {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id, role: 'user', parts: [{ type: 'text', text }] }],
        trigger: 'submit-message',
      }),
    },
  }));
}

async function items() {
  return (await fetch(`http://127.0.0.1:${SINK}/__items`)).json();
}

await fetch(`http://127.0.0.1:${SINK}/__items`, { method: 'DELETE' });

const ws = await connect('/agents/my-chat-agent/chat-1');

// A chat turn, a callable RPC, then the REAL clear path a client uses, then another chat turn.
chatRequest(ws, 'hello');
await wait(3000);
console.log('[rpc]', JSON.stringify((await rpc(ws, 'aiTurn')).result));
ws.send(JSON.stringify({ type: 'cf_agent_chat_clear' }));
await wait(1500);
chatRequest(ws, 'hello again');
await wait(3000);
ws.close();

// Sentinel through the plain worker route.
await fetch(`${base}/sentinel`);
const started = Date.now();
while (Date.now() - started < 25000) {
  const list = await items();
  if (list.some(i => i.type === 'event' && i.message === 'worker-sentinel')) break;
  await wait(400);
}

const list = await items();
console.log('--- sink items ---');
for (const item of list) {
  if (item.type === 'span') {
    for (const s of item.items) console.log(JSON.stringify(s));
  } else {
    console.log(JSON.stringify(item));
  }
}
