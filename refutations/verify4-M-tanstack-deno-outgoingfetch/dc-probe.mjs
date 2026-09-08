import dc from 'node:diagnostics_channel';
let hits = 0;
for (const name of ['undici:request:create','undici:client:sendHeaders','undici:request:headers']) {
  dc.subscribe(name, () => { hits++; console.log('channel fired:', name); });
}
const r = await fetch(process.env.TARGET);
await r.text();
console.log('undici channel hits:', hits);
