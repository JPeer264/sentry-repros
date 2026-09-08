const base = process.env.APP_URL;
const paths = process.argv.slice(2);
for (const p of paths) {
  try {
    const res = await fetch(base + p, { headers: { accept: 'text/html' } });
    console.log(p, res.status);
  } catch (e) {
    console.log(p, 'ERR', e.message);
  }
}
