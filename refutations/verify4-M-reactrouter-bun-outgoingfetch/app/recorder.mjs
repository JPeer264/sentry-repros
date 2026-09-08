import http from "node:http";
const port = Number(process.env.REC_PORT);
http
  .createServer((req, res) => {
    console.log(`REC ${req.url} ${JSON.stringify(req.headers)}`);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(req.headers));
  })
  .listen(port, "127.0.0.1", () => console.log(`recorder on ${port}`));
