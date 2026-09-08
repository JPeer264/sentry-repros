import json,sys
for it in json.load(sys.stdin):
    t=it.get("type")
    if t=="transaction":
        print("transaction | %s | op=%s | src=%s | route=%s | segsrc=%s" % (it.get("name"),it.get("op"),it.get("source"),it.get("route"),it.get("segsource")), " spans=", it.get("spans"))
    elif t=="span":
        for r in it.get("raw",[]):
            print("span | %s | %s | src=%s | route=%s | seg=%s" % (r.get("op"),r.get("name"),r.get("source"),r.get("route"),r.get("is_segment")))
    elif t=="event":
        print("event | %s | mech=%s handled=%s | tx=%s" % (it.get("message") or it.get("exception"),it.get("mechanism"),it.get("handled"),it.get("transaction")))
    else:
        print(t)
