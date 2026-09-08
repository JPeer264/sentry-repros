import { subscribe } from 'node:diagnostics_channel'
import { createServer } from 'node:http'
let fired = 0
subscribe('http.server.request.start', () => { fired++ })
const s = createServer((req, res) => { res.end('hi') })
s.listen(41873, async () => {
  await fetch('http://127.0.0.1:41873/x').then(r => r.text())
  await new Promise(r => setTimeout(r, 100))
  console.log('http.server.request.start fired:', fired)
  s.close()
})
