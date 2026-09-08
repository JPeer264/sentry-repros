import WebSocket from 'ws';

const appPort = process.argv[2] ?? '53119';
const sinkPort = process.argv[3] ?? '47205';
const phase = process.argv[4] ?? '1';
const base = `http://127.0.0.1:${appPort}`;
const wsBase = `ws://127.0.0.1:${appPort}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function open(conn) {
  const ws = new WebSocket(`${wsBase}/ws?conn=${conn}`);
  ws.on('message', d => console.log(`[${conn}] <- ${d}`));
  ws.on('error', e => console.log(`[${conn}] error ${e.message}`));
  return new Promise((resolve, reject) => {
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

async function pollSink(sentinel) {
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
    if (items.some(it => it.type === 'event' && it.message === sentinel)) return items;
  }
  return (await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json());
}

if (phase === '1') {
  console.log('arm:', await (await fetch(`${base}/arm?in=9000`)).text());

  const a = await open('A');
  const b = await open('B');

  for (const [ws, msg] of [[a, 'a1'], [b, 'b1'], [a, 'a2'], [b, 'b2'], [a, 'boom'], [b, 'b3']]) {
    ws.send(msg);
    await sleep(400);
  }

  // the alarm was armed for +9s and throws; wait for it and its first retries
  await sleep(12000);

  a.close();
  b.close();
  await sleep(1500);

  console.log('onlyfw:', await (await fetch(`${base}/onlyfw`)).text());
  console.log('onlymine:', await (await fetch(`${base}/onlymine`)).text());
  await fetch(`${base}/final?name=final-sentinel`);

  console.log(JSON.stringify(await pollSink('final-sentinel'), null, 1));
} else {
  // second run: two brand-new connections on the same (still live) DO isolate
  const a = await open('A');
  const b = await open('B');
  a.send('a9');
  await sleep(400);
  b.send('b9');
  await sleep(400);
  a.close();
  b.close();
  await sleep(1500);
  await fetch(`${base}/final?name=second-run-sentinel`);

  console.log(JSON.stringify(await pollSink('second-run-sentinel'), null, 1));
}

process.exit(0);
