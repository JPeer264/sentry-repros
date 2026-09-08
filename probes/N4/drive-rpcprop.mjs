import WebSocket from 'ws';

const APP = process.env.APP_PORT || '51736';
const SINK = process.env.SINK_PORT || '47211';

const wait = ms => new Promise(r => setTimeout(r, ms));

await fetch(`http://127.0.0.1:${SINK}/__items`, { method: 'DELETE' });

const ws = await new Promise((resolve, reject) => {
  const s = new WebSocket(`ws://127.0.0.1:${APP}/agents/my-agent/rpcprop-1`);
  s.on('open', () => resolve(s));
  s.on('error', reject);
});

const id = 'greet-rpcprop';
const result = await new Promise((resolve, reject) => {
  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'rpc' && msg.id === id) resolve(msg);
  });
  ws.send(JSON.stringify({ type: 'rpc', id, method: 'greet', args: ['world'] }));
  setTimeout(() => reject(new Error('rpc timed out')), 15000);
});
console.log('[rpc]', JSON.stringify(result.result));
ws.close();

await wait(6000);

const list = await (await fetch(`http://127.0.0.1:${SINK}/__items`)).json();
console.log('--- sink items ---');
for (const item of list) {
  if (item.type === 'span') {
    for (const s of item.items) console.log(JSON.stringify(s));
  } else {
    console.log(JSON.stringify(item));
  }
}
