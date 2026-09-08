import http from "node:http";
import { handle } from "./routes.mjs";

const port = Number(process.env.APP_PORT);

http
  .createServer((req, res) => {
    handle(req, res).catch(err => {
      res.statusCode = 500;
      res.end(String(err));
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`app listening ${port}`));
