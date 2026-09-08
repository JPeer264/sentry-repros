"""Generate README.md for directories that have none, from the records: the 14 original-round cells and the 114 refutations."""
import json, os, re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def clean(v):
    if isinstance(v,str):
        v=re.sub(r'/private/tmp/claude-501/[^"\s]*?/scratchpad','$SCRATCH',v)
        return v.replace('/Users/janpeer/dev/sentry-runtime-audit-repros','$REPRO').replace('/Users/janpeer','~')
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
    if isinstance(v,list): return [clean(x) for x in v]
    return v
SKIP={'node_modules','.next','.open-next','.wrangler','dist','.output','build','_fresh','.nuxt','.svelte-kit','.vinxi','.astro','.tanstack','.cache','.turbo'}
def listing(d):
    out=[]
    for n in sorted(os.listdir(d)):
        if n in SKIP or n.startswith('.next') or n.startswith('dist') or n=='README.md': continue
        out.append(n+('/' if os.path.isdir(os.path.join(d,n)) else ''))
    return ', '.join('`%s`'%x for x in out) or 'none'
made=0
# cells
cells={c['id']:clean(c) for c in json.load(open(os.path.join(ROOT,'_records','cells.json')))}
for cid,c in cells.items():
    d=os.path.join(ROOT,'cells',cid)
    if not os.path.isdir(d) or os.path.exists(os.path.join(d,'README.md')): continue
    caps=c.get('capabilities') or []
    rows='\n'.join('| %s | %s | %s |' % (x.get('name',''), x.get('verdict',''), (x.get('detail','') or '').replace('|','/').replace('\n',' ')) for x in caps)
    md=['# %s: %s on %s' % (cid, c.get('framework',''), c.get('runtime','')), '',
        '## What it reproduces','', (c.get('notes') or c.get('setup') or '').strip(), '',
        'This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the other cells were rebuilt and carry a hand-written README.', '',
        '## Setup the docs would show','', (c.get('setup') or '').strip(), '',
        '## Install and Run','', 'Recorded commands (paths under `$SCRATCH` were the session working directory; the same files are in this directory):', '', '```', (c.get('commands') or '').strip(), '```', '',
        'Files: '+listing(d), '',
        '## Expected','', '| Capability | Verdict | Detail |','| --- | --- | --- |', rows, '',
        '## Observed','', 'Not re-run in the rebuild. The recorded evidence of the original run:', '', '```', (c.get('evidence') or '').strip(), '```', '']
    if c.get('docsNote'): md+=['## Docs note','', c['docsNote'].strip(), '']
    open(os.path.join(d,'README.md'),'w').write('\n'.join(md)); made+=1
# refutations
J=os.path.expanduser('~/.claude/projects/-Users-janpeer-dev-sentry-javascript/0a25f47b-4e28-4963-bb90-c76251943269/subagents/workflows/wf_ce92b409-039/journal.jsonl')
ref={}
for line in open(J):
    try: o=json.loads(line)
    except Exception: continue
    r=o.get('result')
    if o.get('type')=='result' and isinstance(r,dict) and 'capability' in r and str(r.get('id','')).startswith('verify'): ref[r['id']]=clean(r)
json.dump([ref[k] for k in sorted(ref)], open(os.path.join(ROOT,'_records','refutations.json'),'w'), indent=1)
for rid,r in ref.items():
    d=os.path.join(ROOT,'refutations',rid)
    if not os.path.isdir(d) or os.path.exists(os.path.join(d,'README.md')): continue
    m=re.match(r'verify(\d)-(M-[a-z]+-[a-z]+)-(.+)$', rid)
    cell=m.group(2) if m else ''
    md=['# %s' % rid, '',
        '## What it re-tests','', 'Independent re-test of the capability **%s** of cell `%s` (see `$REPRO/cells/%s/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.' % (r.get('capability',''), cell, cell), '',
        '## Install and Run','', 'No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: '+listing(d), '',
        '## Expected','', 'The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.', '',
        '## Observed','', '**Verdict:** %s' % r.get('verdict',''), '', (r.get('details') or '').strip(), '']
    if r.get('workaround'): md+=['## Workaround','', r['workaround'].strip(), '']
    if r.get('docsImpact'): md+=['## Docs impact','', r['docsImpact'].strip(), '']
    open(os.path.join(d,'README.md'),'w').write('\n'.join(md)); made+=1
print('READMEs generated:', made, '| refutation results:', len(ref))
missing=[d for k in ('cells','probes','refutations') for d in os.listdir(os.path.join(ROOT,k)) if os.path.isdir(os.path.join(ROOT,k,d)) and not os.path.exists(os.path.join(ROOT,k,d,'README.md'))]
print('still without README:', missing)
