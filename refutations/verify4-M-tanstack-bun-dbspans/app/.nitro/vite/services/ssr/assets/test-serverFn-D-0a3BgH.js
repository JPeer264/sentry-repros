import { c as createServerRpc } from "./createServerRpc-CkyzfB7Q.js";
import { d5 as createServerFn, W as startSpan } from "../server.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const testLog_createServerFn_handler = createServerRpc({
  id: "06bf4c870ccc821429ab5eab89d0d2de36d7b33456a003e6ad402f73a5001414",
  name: "testLog",
  filename: "src/routes/test-serverFn.tsx"
}, (opts) => testLog.__executeServer(opts));
const testLog = createServerFn().handler(testLog_createServerFn_handler, async () => {
  console.log("Test log from server function");
  return {
    message: "Log created"
  };
});
const testNestedLog_createServerFn_handler = createServerRpc({
  id: "1ac31c23f613ec7e58631cf789642e2feb86c58e3128324cf00d746474a044bf",
  name: "testNestedLog",
  filename: "src/routes/test-serverFn.tsx"
}, (opts) => testNestedLog.__executeServer(opts));
const testNestedLog = createServerFn().handler(testNestedLog_createServerFn_handler, async () => {
  await startSpan({
    name: "testNestedLog"
  }, async () => {
    await testLog();
  });
  console.log("Outer test log from server function");
  return {
    message: "Nested log created"
  };
});
export {
  testLog_createServerFn_handler,
  testNestedLog_createServerFn_handler
};
