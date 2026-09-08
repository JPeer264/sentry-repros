// usage: node drive.mjs <appPort> <sinkPort> <path> <full|cancel>
// env: SENTINEL_DELAY_MS (wait before hitting /sentinel), POST_WAIT_MS (re-read the sink afterwards)
const [appPort, sinkPort, path, mode] = process.argv.slice(2);
const SENTINEL_DELAY_MS = Number(process.env.SENTINEL_DELAY_MS ?? '0');
const POST_WAIT_MS = Number(process.env.POST_WAIT_MS ?? '0');

const stamp = () => new Date().toISOString().slice(11, 23);
const log = msg => console.log(`[drive ${stamp()}] ${msg}`);
const wait = ms => new Promise(r => setTimeout(r, ms));

const t0 = Date.now();
const controller = new AbortController();
const res = await fetch(`http://127.0.0.1:${appPort}${path}`, { signal: controller.signal });
log(`status=${res.status} headers-received after ${Date.now() - t0}ms`);

const reader = res.body.getReader();
const decoder = new TextDecoder();

if (mode === 'cancel') {
  const { value } = await reader.read();
  log(`got ${JSON.stringify(decoder.decode(value))} after ${Date.now() - t0}ms`);
  log('cancelling after first chunk');
  await reader.cancel();
  controller.abort();
} else {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    log(`got ${JSON.stringify(decoder.decode(value))} after ${Date.now() - t0}ms`);
  }
  log(`done after ${Date.now() - t0}ms`);
}

if (SENTINEL_DELAY_MS) await wait(SENTINEL_DELAY_MS);
await fetch(`http://127.0.0.1:${appPort}/sentinel`).then(r => r.text());

const items = async () => (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
for (let i = 0; i < 200; i++) {
  const list = await items();
  if (list.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await wait(100);
}
log(`sentinel sent at +${Date.now() - t0}ms; sink items:`);
for (const it of await items()) console.log(JSON.stringify(it));

if (POST_WAIT_MS) {
  await wait(POST_WAIT_MS);
  console.log(`--- sink ${POST_WAIT_MS / 1000}s later:`);
  for (const it of await items()) console.log(JSON.stringify(it));
}
