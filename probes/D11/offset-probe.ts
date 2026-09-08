const start = Date.now();

console.log(
  "deno", Deno.version.deno,
  "DENO_CRON_TEST_SCHEDULE_OFFSET=" + (Deno.env.get("DENO_CRON_TEST_SCHEDULE_OFFSET") ?? "<unset>"),
);

Deno.cron("offset-probe", "* * * * *", () => {
  console.log("cron fired after", Date.now() - start, "ms");
  Deno.exit(0);
});

setTimeout(() => {
  console.log("no cron within 10s");
  Deno.exit(0);
}, 10000);
