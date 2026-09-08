const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const app = p => `http://127.0.0.1:${appPort}${p}`;

async function hit(path) {
  try {
    const res = await fetch(app(path));
    const body = (await res.text()).trim();
    console.log(`GET ${path} -> ${res.status} ${body}`);
    return true;
  } catch (e) {
    console.log(`GET ${path} -> ERR ${e.cause?.code ?? e.message}`);
    return false;
  }
}

async function waitForSentinel(n, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
    if (items.some(i => i.type === 'event' && i.message === `sentinel-${n}`)) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

await hit('/');
await Promise.all([hit('/slow?id=A&ms=600'), hit('/slow?id=B&ms=300'), hit('/slow?id=C&ms=100')]);
await hit('/error-async');
await hit('/sentinel?n=1');
console.log('sentinel-1 arrived:', await waitForSentinel(1));

await hit('/error');
await new Promise(r => setTimeout(r, 1500));
const alive = await hit('/sentinel?n=2');
if (alive) console.log('sentinel-2 arrived:', await waitForSentinel(2));
console.log('app alive after drive:', alive ? 'yes' : 'no');
