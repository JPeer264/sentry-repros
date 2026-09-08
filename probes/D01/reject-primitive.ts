import "./init.ts";

console.log("about to reject with a string");

setTimeout(() => {
  Promise.reject("just a string");
}, 0);
