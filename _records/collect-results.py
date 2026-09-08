"""Collect the rebuild results from the workflow journals of the audit session into results.json. Works only on the machine that ran the audit."""
import json, glob, os, re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=os.path.expanduser('~/.claude/projects/-Users-janpeer-dev-sentry-javascript/0a25f47b-4e28-4963-bb90-c76251943269/subagents/workflows/wf_*/journal.jsonl')
res={}
for f in sorted(glob.glob(J)):
    for l in open(f):
        try: r=json.loads(l)
        except Exception: continue
        if r.get('type')=='result' and isinstance(r.get('result'),dict) and 'rebuilt' in r['result']: res[r['result']['id']]=r['result']
ex=os.path.join(ROOT,'_records','extra-results.json')
if os.path.exists(ex):
    for e in json.load(open(ex)): res[e['id']]=e
def clean(v):
    if isinstance(v,str):
        v=re.sub(r'/private/tmp/claude-501/[^"\s]*?/scratchpad','$SCRATCH',v)
        return v.replace('/Users/janpeer/dev/sentry-runtime-audit-repros','$REPRO').replace('/Users/janpeer','~')
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
    if isinstance(v,list): return [clean(x) for x in v]
    return v
out=[clean(res[k]) for k in sorted(res)]
json.dump(out, open(os.path.join(ROOT,'_records','results.json'),'w'), indent=1)
print('results.json:', len(out), 'entries')
