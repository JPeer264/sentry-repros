import WebSocket from 'ws';

const app = Number(process.env.APP_PORT);
const sink = Number(process.env.SINK_PORT);

function connect(path) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${app}${path}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function rpc(ws, id, method, args = []) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`rpc ${method} timed out`)), 20000);
    const onMessage = data => {
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (parsed.type === 'rpc' && parsed.id === id) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        resolve(parsed);
      }
    };
    ws.on('message', onMessage);
    ws.send(JSON.stringify({ type: 'rpc', id, method, args }));
  });
}

await fetch(`http://127.0.0.1:${sink}/__items`, { method: 'DELETE' });

const http = await fetch(`http://127.0.0.1:${app}/agents/my-agent/room-1`);
console.log('[http onRequest]', http.status, (await http.text()).trim());

const ws = await connect('/agents/my-agent/room-1');
console.log('[rpc greet]     ', JSON.stringify(await rpc(ws, '1', 'greet', ['world'])));
console.log('[rpc aiTurn]    ', JSON.stringify(await rpc(ws, '2', 'aiTurn')));
console.log('[rpc writeKeys] ', JSON.stringify(await rpc(ws, '3', 'writeKeys')));
console.log('[rpc clearChat] ', JSON.stringify(await rpc(ws, '4', 'clearChat')));
console.log('[rpc aiTurn#2]  ', JSON.stringify(await rpc(ws, '5', 'aiTurn')));
console.log('[rpc sentinel]  ', JSON.stringify(await rpc(ws, '6', 'sentinel')));

const legacyHttp = await fetch(`http://127.0.0.1:${app}/agents/legacy-agent/room-1`);
console.log('[legacy http]   ', legacyHttp.status, (await legacyHttp.text()).trim());

const lws = await connect('/agents/legacy-agent/room-1');
console.log('[legacy aiTurn] ', JSON.stringify(await rpc(lws, '1', 'aiTurn')));
console.log('[legacy sent.]  ', JSON.stringify(await rpc(lws, '2', 'sentinel')));

await fetch(`http://127.0.0.1:${app}/sentinel`);

for (let i = 0; i < 80; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'worker-sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

ws.close();
lws.close();

const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
console.log('--- sink ---');
for (const it of items) console.log(JSON.stringify(it));
