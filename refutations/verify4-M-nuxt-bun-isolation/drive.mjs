const base = `http://127.0.0.1:${process.env.APP_PORT}`
const s = process.env.SINK
await fetch(`${s}/__items`, { method: 'DELETE' })
// one unrelated earlier request that sets a transaction name
await fetch(`${base}/api/error`).catch(() => {})
await new Promise(r => setTimeout(r, 400))
const rs = await Promise.all(['alpha', 'beta', 'gamma'].map(t => fetch(`${base}/api/iso?tag=${t}`).then(r => r.json())))
console.log('iso responses', JSON.stringify(rs))
await fetch(`${base}/api/sentinel`).then(r => r.text())
for (let i = 0; i < 40; i++) {
  const items = await fetch(`${s}/__items`).then(r => r.json())
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break
  await new Promise(r => setTimeout(r, 250))
}
const items = await fetch(`${s}/__items`).then(r => r.json())
console.log(JSON.stringify(items, null, 1))
