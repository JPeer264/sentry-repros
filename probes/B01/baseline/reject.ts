Promise.reject(new Error("B01 unhandled rejection"));

setTimeout(() => {
  console.log("baseline still alive");
}, 1500);
