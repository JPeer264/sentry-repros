"""Rebuild docs-audit.source.html from the template and the item fragments, then the page via ../add-board.py."""
import re, os, subprocess, sys, json
H=os.path.dirname(os.path.abspath(__file__))
plan=json.load(open(os.path.join(H,'..','issues','setup','plan.json')))
FILED={iid:p['created'] for p in plan if p.get('created') for iid in p['must']}
LINEAR='https://linear.app/getsentry/issue/'
t=open(os.path.join(H,'docs-audit.template.html')).read()
def sub(m):
    p=os.path.join(H,'items',m.group(1)+'.html'); f=open(p).read(); t=FILED.get(m.group(1))
    if t:
        f=f.replace('</span></h3>', '<a class="chip filed" href="%s%s">%s</a></span></h3>' % (LINEAR,t,t), 1)
        f=re.sub(r'(<p class="eyebrow">Proposed issue <span class="chip">[^<]+</span>)', r'\1 <a class="chip filed" href="%s%s">filed as %s</a>' % (LINEAR,t,t), f, count=1)
    return f
s=re.sub(r'<!--ITEM:([^>]+)-->\n', sub, t)
open(os.path.join(H,'docs-audit.source.html'),'w').write(s)
print('assembled', s.count('<div class="issue">'), 'issue blocks')
