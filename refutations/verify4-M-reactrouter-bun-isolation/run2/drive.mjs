const base = `http://127.0.0.1:${process.env.APP_PORT}`;
const cases = [
  { tag: 'alpha', delay: 300, id: '1' },
  { tag: 'bravo', delay: 150, id: '2' },
  { tag: 'charlie', delay: 50, id: '3' },
];
const results = await Promise.all(
  cases.map(async c => {
    const r = await fetch(`${base}/users/${c.id}?mode=isolation&tag=${c.tag}&delay=${c.delay}`);
    const body = await r.text();
    const m = body.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    const raw = m ? m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&') : null;
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    return { tag: c.tag, status: r.status, loader: parsed ?? raw?.slice(0, 200) };
  }),
);
for (const r of results) console.log(JSON.stringify(r));
const f = await fetch(`${base}/flush`);
console.log('flush', f.status);
