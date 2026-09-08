"""Second pass: READMEs for the 14 original-round cells and the refutations recorded under the cell id, from the matrix journal."""
import json, os, re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=os.path.expanduser('~/.claude/projects/-Users-janpeer-dev-sentry-javascript/0a25f47b-4e28-4963-bb90-c76251943269/subagents/workflows/wf_ce92b409-039/journal.jsonl')
def clean(v):
    if isinstance(v,str):
        v=re.sub(r'/private/tmp/claude-501/[^"\s]*?/scratchpad','$SCRATCH',v)
        return v.replace('/Users/janpeer/dev/sentry-runtime-audit-repros','$REPRO').replace('/Users/janpeer','~')
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
    if isinstance(v,list): return [clean(x) for x in v]
    return v
SKIP={'node_modules','.next','.open-next','.wrangler','dist','.output','build','_fresh','.nuxt','.svelte-kit','.vinxi','.astro','.tanstack','.cache','.turbo'}
def listing(d):
    out=[n+('/' if os.path.isdir(os.path.join(d,n)) else '') for n in sorted(os.listdir(d)) if n not in SKIP and not n.startswith('.next') and not n.startswith('dist') and n!='README.md']
    return ', '.join('`%s`'%x for x in out) or 'none'
cellrecs={}; caprecs={}
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower())
for line in open(J):
    try: o=json.loads(line)
    except Exception: continue
    r=o.get('result')
    if o.get('type')!='result' or not isinstance(r,dict): continue
    if 'capabilities' in r and r.get('id','').startswith('M-'): cellrecs[r['id']]=clean(r)
    elif 'capability' in r and r.get('id','').startswith('M-'): caprecs.setdefault((r['id'], norm(r['capability'])), []).append(clean(r))
json.dump([cellrecs[k] for k in sorted(cellrecs)], open(os.path.join(ROOT,'_records','cells-all.json'),'w'), indent=1)
made=0
for cid in sorted(os.listdir(os.path.join(ROOT,'cells'))):
    d=os.path.join(ROOT,'cells',cid)
    if not os.path.isdir(d) or os.path.exists(os.path.join(d,'README.md')): continue
    c=cellrecs.get(cid)
    if not c: print('no record for', cid); continue
    caps=c.get('capabilities') or []
    rows='\n'.join('| %s | %s | %s |' % (x.get('name',''), x.get('verdict',''), (x.get('detail','') or '').replace('|','/').replace('\n',' ')) for x in caps)
    md=['# %s: %s on %s' % (cid, c.get('framework',''), c.get('runtime','')), '',
        '## What it reproduces','', (c.get('notes') or c.get('setup') or '').strip(), '',
        'This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.', '',
        '## Setup the docs would show','', (c.get('setup') or '').strip(), '',
        '## Install and Run','', 'Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:', '', '```', (c.get('commands') or '').strip(), '```', '',
        'Files: '+listing(d), '',
        '## Expected','', '| Capability | Verdict | Detail |','| --- | --- | --- |', rows, '',
        '## Observed','', 'Not re-run in the rebuild. The recorded evidence of the original run:', '', '```', (c.get('evidence') or '').strip(), '```', '']
    if c.get('docsNote'): md+=['## Docs note','', c['docsNote'].strip(), '']
    open(os.path.join(d,'README.md'),'w').write('\n'.join(md)); made+=1
for rid in sorted(os.listdir(os.path.join(ROOT,'refutations'))):
    d=os.path.join(ROOT,'refutations',rid)
    if not os.path.isdir(d) or os.path.exists(os.path.join(d,'README.md')): continue
    m=re.match(r'verify(\d)-(M-[a-z]+-[a-z]+)-(.+?)(?:-v\d)?$', rid)
    if not m: print('unparsed', rid); continue
    cell, cap = m.group(2), norm(m.group(3))
    rs=caprecs.get((cell,cap)) or [r for (c2,k2),v in caprecs.items() if c2==cell and (cap in k2 or k2 in cap) for r in v]
    obs=[]
    for r in rs:
        obs+=['**Verdict:** %s' % r.get('verdict',''), '', (r.get('details') or '').strip(), '']
        if r.get('workaround'): obs+=['Workaround: '+r['workaround'].strip(), '']
        if r.get('docsImpact'): obs+=['Docs impact: '+r['docsImpact'].strip(), '']
    if not obs: obs=['No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.', '']
    md=['# %s' % rid, '',
        '## What it re-tests','', 'Independent re-test of the capability **%s** of cell `%s` (see `$REPRO/cells/%s/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.' % (m.group(3), cell, cell), '',
        '## Install and Run','', 'No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: '+listing(d), '',
        '## Expected','', 'The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.', '',
        '## Observed','']+obs
    open(os.path.join(d,'README.md'),'w').write('\n'.join(md)); made+=1
print('READMEs generated:', made, '| cell records in journal:', len(cellrecs))
missing=[d for k in ('cells','probes','refutations') for d in os.listdir(os.path.join(ROOT,k)) if os.path.isdir(os.path.join(ROOT,k,d)) and not os.path.exists(os.path.join(ROOT,k,d,'README.md'))]
print('still without README:', missing)
