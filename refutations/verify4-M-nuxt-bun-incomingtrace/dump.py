import json,sys,urllib.request
data=json.load(urllib.request.urlopen('http://127.0.0.1:41318/__items?raw=1'))
for r in data:
    t=r["header"].get("type"); p=r["payload"]; eh=r["envHeader"]
    if t=="span":
        for it in p.get("items",[]):
            a=it.get("attributes",{})
            op=a.get("sentry.op",{})
            op=op.get("value") if isinstance(op,dict) else op
            tid=it.get("trace_id") or eh.get("trace",{}).get("trace_id")
            print("span   trace=%s parent=%s seg=%s name=%s op=%s"%(tid,it.get("parent_span_id"),it.get("is_segment"),it.get("name"),op))
    elif t in ("event","transaction"):
        tc=p.get("contexts",{}).get("trace",{})
        ex=(p.get("exception",{}).get("values") or [{}])[0]
        print("%-6s trace=%s parent=%s name=%s msg=%s"%(t,tc.get("trace_id"),tc.get("parent_span_id"),p.get("transaction"),p.get("message") or ex.get("value")))
    else:
        print(t)
