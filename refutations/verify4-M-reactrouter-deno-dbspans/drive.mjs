const base = `http://127.0.0.1:${process.env.PORT}`;
for (const p of process.argv.slice(2)) {
  const r = await fetch(`${base}${p}`);
  const t = await r.text();
  console.log(p, r.status, t.length, /db4|db3|db2|db/.test(p) ? '' : '');
}
