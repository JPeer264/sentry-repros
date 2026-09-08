const base = `http://127.0.0.1:${process.env.APP_PORT}`;
const mode = process.argv[2] || 'isolation';

const cases = [
  { tag: 'alpha', delay: 300, id: '1' },
  { tag: 'bravo', delay: 150, id: '2' },
  { tag: 'charlie', delay: 50, id: '3' },
];

const results = await Promise.all(
  cases.map(async c => {
    const r = await fetch(`${base}/users/${c.id}?mode=${mode}&tag=${c.tag}&delay=${c.delay}`);
    return { tag: c.tag, status: r.status, body: (await r.text()).slice(0, 400) };
  }),
);
for (const r of results) console.log(JSON.stringify(r));

const f = await fetch(`${base}/flush`);
console.log('flush', f.status);
