"""Rebuild quickstarts/README.md, the getting-started tracker, from _records/getting-started-plan.json."""
import json, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P=json.load(open(os.path.join(ROOT,'_records','getting-started-plan.json')))
out=['# Getting-started paths','',
 'One directory per docs guide: the install, configure and verify steps as a new user would run them, with the manual-setup variants the guide names, against the develop build. Status from `_records/getting-started-plan.json`; a done row links its directory, whose README carries the observations and the per-variant `results-*.json`.','',
 '| Path | Group | Guide | Variants | Status | Note |','| --- | --- | --- | --- | --- | --- |']
for x in P:
    d=x['id'][3:]
    path='[%s](%s/)' % (x['id'], d) if x['status']=='done' and os.path.isdir(os.path.join(ROOT,'quickstarts',d)) else x['id']
    out.append('| %s | %s | %s | %s | %s | %s |' % (path, x['group'], x['guide'], ', '.join(x['variants']), x['status'], x.get('note','')))
from collections import Counter
c=Counter(x['status'] for x in P)
out += ['', 'Totals: %s.' % ', '.join('%d %s' % (n,s) for s,n in c.most_common())]
open(os.path.join(ROOT,'quickstarts','README.md'),'w').write('\n'.join(out)+'\n')
print(dict(c))
