const port = process.env.APP_PORT;
const paths = ['/users/42', '/error', '/db', '/sentinel'];
for (const p of paths) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}${p}`);
    console.log(p, r.status, (await r.text()).slice(0, 120));
  } catch (e) { console.log(p, 'ERR', e.message); }
}
