import json, sys

for path in sys.argv[1:]:
    print(f"--- {path}")
    raw = json.load(open(path))
    ev = None
    for r in raw:
        p = r["payload"]
        if r["header"].get("type") == "event" and p.get("exception"):
            ev = p
    if ev is None:
        print("no exception event")
        continue
    d = json.dumps
    print(f'sdk: {ev["sdk"]["name"]} {ev["sdk"]["version"]} | platform: {ev.get("platform")} | '
          f'server_name: {ev.get("server_name")} | release: {ev.get("release")} | env: {ev.get("environment")}')
    print("user:", d(ev.get("user")))
    print("tags:", d(ev.get("tags")))
    print("extra:", d(ev.get("extra")))
    for k in ("app", "device", "os", "v8", "typescript", "probe_ctx", "runtime"):
        if k in ev.get("contexts", {}):
            print(f"contexts.{k}:", d(ev["contexts"][k]))
    bcs = ev.get("breadcrumbs") or []
    if isinstance(bcs, dict):
        bcs = bcs.get("values", [])
    for b in bcs:
        b.pop("timestamp", None)
        print("breadcrumb:", d(b))
    for f in ev["exception"]["values"][0].get("stacktrace", {}).get("frames", []):
        if f.get("function") == "innerThrow":
            print("frame:", d({
                "filename": f.get("filename"), "function": f.get("function"),
                "lineno": f.get("lineno"), "colno": f.get("colno"), "in_app": f.get("in_app"),
                "context_line": f.get("context_line"),
                "pre": len(f.get("pre_context") or []), "post": len(f.get("post_context") or []),
            }))
