const base = `http://127.0.0.1:${process.env.APP_PORT}`;
for (const p of process.argv.slice(2)) {
  const r = await fetch(base + p);
  console.log(p, r.status, (await r.text()).slice(0, 60));
}
