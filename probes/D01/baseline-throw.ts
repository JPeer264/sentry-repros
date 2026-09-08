setTimeout(() => console.log("STILL ALIVE"), 2000);

console.log("about to throw");

setTimeout(() => {
  throw new Error("d01 uncaught throw");
}, 0);
