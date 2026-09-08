const app = process.env.APP_PORT, sink = process.env.SINK_PORT;
for (const p of (process.env.ROUTES || "/db-mysql1,/db-mysql2-query,/db-mysql2-execute,/db-mysql2-pool").split(",")) {
  console.log(p, "->", await fetch(`http://127.0.0.1:${app}${p}`).then(r => r.text()));
}
await fetch(`http://127.0.0.1:${app}/sentinel`).then(r => r.text());
const deadline = Date.now() + 25000;
while (Date.now() < deadline) {
  const items = await fetch(`http://127.0.0.1:${sink}/__items`).then(r => r.json());
  if (JSON.stringify(items).includes("sentinel")) { console.log(JSON.stringify(items, null, 1)); process.exit(0); }
  await new Promise(r => setTimeout(r, 400));
}
console.log("NO SENTINEL");
console.log(JSON.stringify(await fetch(`http://127.0.0.1:${sink}/__items`).then(r=>r.json()), null, 1));
