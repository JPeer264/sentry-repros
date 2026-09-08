import express from "express";

const app = express();
app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));

const server = app.listen(Number(process.env.PORT || 0), "127.0.0.1", () => {
  console.log(`PORT=${(server.address() as any).port}`);
});
