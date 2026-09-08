// Drives one app from a plain node process (a fetch from a Sentry-initialised process would mark the
// server transaction as not sampled).
const [, , appPort, sinkPort, mode] = process.argv;

const hit = async path => {
  const res = await fetch(`http://127.0.0.1:${appPort}${path}`);
  return res.text();
};

console.log('GET /db ->', await hit('/db'));

if (mode === 'twice') {
  console.log('-- second request');
  console.log('GET /db ->', await hit('/db'));
}

if (mode === 'sentinel') {
  await hit('/sentinel');
  const deadline = Date.now() + 15000;
  let items = [];
  while (Date.now() < deadline) {
    items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
    if (items.some(i => i.type === 'event' && i.message === 'sentinel')) break;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('SINK:', JSON.stringify(items));
}
