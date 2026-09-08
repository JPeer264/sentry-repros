// usage: node bare-drive.mjs <app port>
const port = Number(process.argv[2]);
for (const path of ['/error-sync', '/hello/world']) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const body = await res.text();
    console.log(`${path} ${res.status} ${JSON.stringify(body)} conn: ${res.headers.get('connection')}`);
  } catch (e) {
    console.log(`${path} FETCH FAILED ${e.cause?.code ?? e.message}`);
  }
}
