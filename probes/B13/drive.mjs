const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const base = `http://127.0.0.1:${appPort}`;

const user = await fetch(`${base}/user/42`);
console.log(JSON.stringify({
  route: '/user/42',
  status: user.status,
  responseHeaders: {
    'sentry-trace': user.headers.get('sentry-trace'),
    baggage: user.headers.get('baggage'),
  },
  body: await user.json(),
}, null, 1));

const err = await fetch(`${base}/error`);
console.log(JSON.stringify({
  route: '/error',
  status: err.status,
  responseHeaders: {
    'sentry-trace': err.headers.get('sentry-trace'),
    baggage: err.headers.get('baggage'),
  },
}, null, 1));

await fetch(`${base}/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 500));
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
}

console.log('--- sink items ---');
for (const it of items) console.log(JSON.stringify(it));
