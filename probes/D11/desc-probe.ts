const desc = Object.getOwnPropertyDescriptor(Deno, "cron");

console.log(
  "deno", Deno.version.deno,
  "typeof Deno.cron=" + typeof (Deno as { cron?: unknown }).cron,
  "descriptor=" + JSON.stringify(
    desc
      ? {
        hasGet: !!desc.get,
        hasSet: !!desc.set,
        hasValue: "value" in desc,
        writable: desc.writable,
        configurable: desc.configurable,
      }
      : null,
  ),
);

try {
  (Deno as { cron: unknown }).cron = (Deno as { cron: unknown }).cron;
  console.log("assign ok");
} catch (error) {
  console.log("assign threw:", String(error));
}

try {
  Object.defineProperty(Deno, "cron", {
    value: (Deno as { cron: unknown }).cron,
    writable: true,
    configurable: true,
  });
  console.log("defineProperty ok");
} catch (error) {
  console.log("defineProperty threw:", String(error));
}
