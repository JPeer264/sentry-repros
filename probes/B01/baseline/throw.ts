if (process.env.USER_HANDLER === "1") {
  process.on("uncaughtException", err => {
    console.log("USER_HANDLER saw:", (err as Error).message);
  });
}

if (process.env.WHERE === "toplevel") {
  throw new Error("B01 uncaught exception (top level)");
}

setTimeout(() => {
  throw new Error("B01 uncaught exception (timer)");
}, 10);

setTimeout(() => {
  console.log("baseline still alive");
}, 1500);
