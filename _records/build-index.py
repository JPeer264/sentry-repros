"""Build INDEX.md from the records and the vendored rebuild results."""
import json, os, collections
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rec=lambda n: json.load(open(os.path.join(ROOT,'_records',n)))
probes, cells, results = rec('probes.json'), rec('cells.json'), {r['id']:r for r in rec('results.json')}
def row(kind, x):
    r=results.get(x['id'],{}); exists=os.path.isdir(os.path.join(ROOT,kind,x['id']))
    title=(x.get('title') or (x.get('framework','')+' on '+x.get('runtime',''))).replace('|','/')[:90]
    verdict=(x.get('verdict','') or '')[:12] if kind=='probes' else ''
    return '| [%s](%s/%s/) | %s | %s | %s | %s | %s |' % (x['id'], kind, x['id'], title, verdict, r.get('rebuilt','present' if exists else 'missing'), r.get('matches',''), (r.get('difference','') or '')[:120].replace('|','/'))
out=['# Index','','Every entry is a directory with a README (Install, Run, Expected, Observed). Rebuilt on 2026-09-07 from the recorded results; `matches` says whether the rebuilt run reproduced the recorded verdict.','','## Probes','','| Probe | Title | Recorded | Rebuilt | Matches | Difference |','| --- | --- | --- | --- | --- | --- |']
out+=[row('probes',x) for x in sorted(probes,key=lambda x:x['id'])]
out+=['','## Framework cells','','| Cell | Framework on runtime | | Rebuilt | Matches | Difference |','| --- | --- | --- | --- | --- | --- |']
cmap={c['id']:c for c in cells}
for cid in sorted(set(os.listdir(os.path.join(ROOT,'cells')))|set(cmap)):
    out.append(row('cells', cmap.get(cid,{'id':cid,'framework':cid,'runtime':''})))
c=collections.Counter(r.get('matches') for r in results.values())
out.append(''); out.append('Rebuild status: %d results; matches: %s.' % (len(results), dict(c)))
open(os.path.join(ROOT,'INDEX.md'),'w').write('\n'.join(out)+'\n'); print('INDEX.md written', len(results), 'results')
