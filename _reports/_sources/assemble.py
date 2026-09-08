"""Rebuild docs-audit.source.html from the template and the item fragments, then the page via ../add-board.py."""
import re, os, subprocess, sys
H=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(H,'docs-audit.template.html')).read()
def sub(m):
    p=os.path.join(H,'items',m.group(1)+'.html')
    return open(p).read()
s=re.sub(r'<!--ITEM:([^>]+)-->\n', sub, t)
open(os.path.join(H,'docs-audit.source.html'),'w').write(s)
print('assembled', s.count('<div class="issue">'), 'issue blocks')
