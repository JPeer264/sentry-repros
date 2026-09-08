import { readFileSync } from "node:fs";
const lines = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
for (const l of lines) {
  let o; try { o = JSON.parse(l); } catch { continue; }
  if (o.type === "transaction" || (o.transaction && o.contexts)) {
    console.log(`TRANSACTION name=${JSON.stringify(o.transaction)} source=${o.transaction_info?.source} http.route=${JSON.stringify(o.contexts?.trace?.data?.["http.route"])} op=${o.contexts?.trace?.op}`);
    for (const s of o.spans ?? []) console.log(`   span op=${s.op} desc=${JSON.stringify(s.description)} http.route=${JSON.stringify(s.data?.["http.route"])}`);
  } else if (o.version === 2 && Array.isArray(o.items)) {
    for (const it of o.items) {
      const a = it.attributes ?? {};
      console.log(`SPAN name=${JSON.stringify(it.name)} op=${a["sentry.op"]?.value} is_segment=${it.is_segment} http.route=${JSON.stringify(a["http.route"]?.value)} segment.name=${JSON.stringify(a["sentry.segment.name"]?.value)} source=${a["sentry.segment.name.source"]?.value} origin=${a["sentry.origin"]?.value}`);
    }
  } else if (o.message || o.exception) {
    console.log(`EVENT ${o.message?.formatted ?? o.message ?? o.exception?.values?.[0]?.value} transaction=${JSON.stringify(o.transaction)}`);
  }
}
