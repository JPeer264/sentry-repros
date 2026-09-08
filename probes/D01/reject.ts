import "./init.ts";

console.log("about to reject");

setTimeout(() => {
  Promise.reject(new Error("d01 unhandled rejection"));
}, 0);
