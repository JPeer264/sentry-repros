import "./instrument.ts";

try {
  const mod = await import("npm:@nestjs/platform-express@10");
  console.log("PLATFORM_EXPRESS_OK", typeof mod.ExpressAdapter);
} catch (e) {
  console.log("PLATFORM_EXPRESS_FAIL", e);
}
try {
  const express = (await import("npm:express@4")).default;
  console.log("EXPRESS_OK", typeof express);
} catch (e) {
  console.log("EXPRESS_FAIL", (e as Error).message);
}
