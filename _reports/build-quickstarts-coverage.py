"""Insert or refresh the getting-started coverage section of _reports/quick-starts.html from the records."""
import json, os, re, glob, html
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T='https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements'
AUDIT='https://claude.ai/code/artifact/c8dffc51-f5ab-4014-8c5c-6c4423bec61b'
plan=json.load(open(os.path.join(R,'_records','getting-started-plan.json')))
qs={q['id']:q for q in json.load(open(os.path.join(R,'_records','quickstarts.json')))}
# docs-audit items that came out of each quick start, from the Source line of the fragments
items={}
for f in sorted(glob.glob(os.path.join(R,'_reports','_sources','items','*.html'))):
    s=open(f).read(); iid=os.path.basename(f)[:-5]
    for m in re.finditer(r'quick start (QS-[a-z-]+)', s): items.setdefault(m.group(1),set()).add(iid)
    m=re.search(r'<span class="ht">(.*?)</span>', s, re.S); items.setdefault('_h',{})[iid]=html.unescape(re.sub(r'<[^>]+>','',m.group(1))).strip() if m else iid
def ikey(i):
    m=re.match(r'([A-Z-]+?)(\d+)$', i); return (m.group(1), int(m.group(2))) if m else (i,0)
E=html.escape
chip={'done':'<span class="chip nr">done</span>','planned':'<span class="chip">planned</span>','not measurable':'<span class="chip p2">not measurable</span>'}
groups=[]; 
for p in plan:
    if p['group'] not in groups: groups.append(p['group'])
counts={s:sum(1 for p in plan if p['status']==s) for s in ['done','planned','not measurable']}
out=['<!--QS-COVERAGE-->','<h1 id="coverage">Getting-started coverage</h1>',
 '<p>The scope widened on 2026-09-08 to every JavaScript guide: the install, configure and verify steps as a new user runs them, plus the manual-setup variants the guide names, each against the develop build of that day (<code>03aaf42455</code>, package 10.67.0). One directory per path in <a href="%s/quickstarts">quickstarts/</a>, with the per-variant <code>results-*.json</code> and a README; the plain-runtime runs above were made at the earlier pin <code>6f2da7483d</code>. %d done, %d planned, %d not measurable on this machine.</p>' % (T, counts['done'], counts['planned'], counts['not measurable']),
 '<div class="tw"><table><thead><tr><th>Path</th><th>Group</th><th>Guide</th><th>Variants</th><th>Status</th><th>Items</th></tr></thead><tbody>']
for p in plan:
    d=p['id'][3:]; link='<a href="%s/quickstarts/%s">%s</a>' % (T,d,p['id']) if p['status']=='done' and os.path.isdir(os.path.join(R,'quickstarts',d)) else p['id']
    its=' '.join('<a href="%s#%s">%s</a>' % (AUDIT,i,i) for i in sorted(items.get(p['id'],[]), key=ikey))
    out.append('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % (link,E(p['group']),E(p['guide']),E(', '.join(p['variants'])),chip[p['status']],its))
out.append('</tbody></table></div>')
nav=['<!--QS-NAV-->','<li class="l1"><a href="#coverage">Getting-started coverage</a></li>']
for p in plan:
    if p['status']!='done' or p['id'] not in qs or p['id'] in ('QS-node','QS-bun','QS-deno','QS-cloudflare'): continue
    q=qs[p['id']]; hid='coverage-'+p['id'][3:]
    out+=['<h2 id="%s">%s</h2>' % (hid, E(p['guide'][0].upper()+p['guide'][1:])),
          '<p><strong>Runtime.</strong> %s. <strong>SDK.</strong> <code>%s</code> %s, %s integrations.</p>' % (E(q['runtime']),E(q['sdk']['name']),E(q['sdk']['version']),q['sdk']['integrations']),
          '<p>%s</p>' % E(q['summary']),
          '<div class="tw"><table><thead><tr><th>Variant</th><th>Result</th></tr></thead><tbody>'+''.join('<tr><td>%s</td><td>%s</td></tr>' % (E(k),E(v)) for k,v in q['variants'].items())+'</tbody></table></div>']
    its=sorted(items.get(p['id'],[]), key=ikey)
    if its: out.append('<p><strong>Docs items.</strong> '+'; '.join('<a href="%s#%s">%s</a> %s' % (AUDIT,i,i,E(items['_h'].get(i,''))) for i in its)+'.</p>')
    out.append('<p>Directory: <a href="%s/quickstarts/%s">quickstarts/%s</a>.</p>' % (T,p['id'][3:],p['id'][3:]))
    nav.append('<li class="l3"><a href="#%s">%s</a></li>' % (hid, E(p['guide'])))
out.append('<!--/QS-COVERAGE-->'); nav.append('<!--/QS-NAV-->')
p=os.path.join(R,'_reports','quick-starts.html'); s=open(p).read()
s=re.sub(r'<!--QS-COVERAGE-->.*?<!--/QS-COVERAGE-->\n?', '', s, flags=re.S); s=re.sub(r'<!--QS-NAV-->.*?<!--/QS-NAV-->', '', s, flags=re.S)
assert '</main></div>' in s and '</ul></nav>' in s
s=s.replace('</main></div>', '\n'.join(out)+'\n</main></div>',1).replace('</ul></nav>', ''.join(nav)+'</ul></nav>',1)
open(p,'w').write(s); print('coverage section written; items per quick start:', {k:sorted(v, key=ikey) for k,v in items.items() if k!='_h'})
