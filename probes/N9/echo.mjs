import http from "node:http";

const port = Number(process.env.PORT ?? "47312");
http
  .createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ url: req.url, headers: req.headers }));
  })
  .listen(port, "127.0.0.1", () => console.log(`echo on ${port}`));
