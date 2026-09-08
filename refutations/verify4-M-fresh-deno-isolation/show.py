import json,sys,urllib.request
port=sys.argv[1]
d=json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/__items"))
for i in d:
  t=i["type"]
  if t=="transaction": print("tx    |",i["name"],"| src=",i.get("source"),"| tags=",i.get("tags"),"| trace=",(i.get("trace_id") or "")[:8])
  elif t=="event": print("event |",i.get("message") or i.get("exception"),"| tags=",i.get("tags"),"| trace=",(i.get("trace_id") or "")[:8])
  elif t=="span": print("span  |",i.get("items"),"| trace=",(i.get("trace_id") or "")[:8])
  else: print(t)
