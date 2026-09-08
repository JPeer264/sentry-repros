import http from "node:http";
import { writeFileSync, appendFileSync } from "node:fs";
const out = process.env.OUT ?? "b-raw.ndjson";
writeFileSync(out, "");
http.createServer((req, res) => {
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    for (const line of body.split("\n")) {
      if (!line.trim()) continue;
      try { appendFileSync(out, line + "\n"); } catch {}
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
}).listen(Number(process.env.PORT), () => console.log("sink up"));
