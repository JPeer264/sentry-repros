const app = process.env.APP_PORT, sink = process.env.SINK_PORT;
await fetch(`http://127.0.0.1:${app}/db`).then(r => r.text()).then(t => console.log("db:", t));
await fetch(`http://127.0.0.1:${app}/sentinel`).then(r => r.text());
const deadline = Date.now() + 25000;
while (Date.now() < deadline) {
  const items = await fetch(`http://127.0.0.1:${sink}/__items`).then(r => r.json());
  if (JSON.stringify(items).includes("sentinel")) { console.log(JSON.stringify(items, null, 1)); process.exit(0); }
  await new Promise(r => setTimeout(r, 400));
}
console.log("NO SENTINEL");
const items = await fetch(`http://127.0.0.1:${sink}/__items`).then(r => r.json());
console.log(JSON.stringify(items, null, 1));
