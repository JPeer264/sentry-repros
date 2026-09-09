"""Extract every proposed docs issue (P0 to P2) from the docs audit page into Markdown drafts and gist files."""
import re, html as H, json, os
from html.parser import HTMLParser
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..'))
OUT=os.path.dirname(os.path.abspath(__file__)); GIST=os.path.join(OUT,'gist'); os.makedirs(GIST, exist_ok=True)
BASE='https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements'
AUDIT=BASE+'/_reports/docs-audit.html'; REPORT=BASE+'/_reports/deep-probe-report.html'
doc=open(os.path.join(ROOT,'_reports','docs-audit.html')).read()
class MD(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.out=[]; s.href=None
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='p': s.out.append('')
        elif t=='li': s.out.append('- ')
        elif t=='code': s.out.append('`')
        elif t in('strong','b'): s.out.append('**')
        elif t in('em','i'): s.out.append('_')
        elif t=='a': s.href=a.get('href','')
        elif t=='br': s.out.append('\n')
    def handle_endtag(s,t):
        if t=='p': s.out.append('\n\n')
        elif t in('ul','ol'): s.out.append('\n')
        elif t=='li': s.out.append('\n')
        elif t=='code': s.out.append('`')
        elif t in('strong','b'): s.out.append('**')
        elif t in('em','i'): s.out.append('_')
        elif t=='a':
            if s.href and not s.href.startswith('#'): s.out.append(' ('+s.href+')')
            s.href=None
    def handle_data(s,d): s.out.append(d)
def to_md(fragment):
    p=MD(); p.feed(fragment); t=''.join(p.out)
    t=re.sub(r'[ \t]+\n','\n',t); t=re.sub(r'\n{3,}','\n\n',t); return t.strip()
OWNED={'X2':'owned by Linear JS-2599 (v11 migration guide for docs); do not file separately','DOC-R20':'owned by Linear SDK-1351 (removal of the custom OpenTelemetry setup page); do not file separately',
       'DOC-C1':'v11-gated; file as a sub-issue of Linear SDK-1296','DOC-C2':'v11-gated; file as a sub-issue of Linear SDK-1296','DOC-C3':'v11-gated; file as a sub-issue of Linear SDK-1296','DOC-C4':'v11-gated; file as a sub-issue of Linear SDK-1296','DOC-C5':'v11-gated; file as a sub-issue of Linear SDK-1296'}
PAIRS={'DOC-F11':'DOC-F28','DOC-F28':'DOC-F11','DOC-F13':'DOC-F30','DOC-F30':'DOC-F13','DOC-F19':'DOC-F36','DOC-F36':'DOC-F19'}
items=[]
for m in re.finditer(r'<h3 id="([^"]+)">((?:(?!<h3 ).)*?)</h3>\s*<div class="issue">(.*?)</details></div>', doc, re.S):
    hid,h3,issue=m.groups()
    pm=re.search(r'chip (p[012])',h3)
    if not pm: continue
    prio=pm.group(1).upper()
    heading=H.unescape(re.sub(r'<[^>]+>','',re.search(r'<span class="ht">(.*?)</span>',h3,re.S).group(1))).strip()
    typ=re.search(r'Proposed issue <span class="chip">([^<]+)</span>',issue).group(1)
    title=H.unescape(re.sub(r'<[^>]+>','',re.search(r'<p class="it">(.*?)</p>',issue,re.S).group(1))).strip()
    body=to_md(re.search(r'<div class="body">(.*)$',issue,re.S).group(1))
    body=re.sub(r'\n*Source: runtime docs audit, item [^\n]*$','',body).strip()
    body=body.replace('**What to change**\n\n','What to change:\n\n')
    m2=re.match(r'^(.*?) on (Bun|Deno|Cloudflare): documented (no|wrong|partial|yes)$', heading)
    if m2:
        fw,rt,v=m2.groups(); rt2={'Cloudflare':'Cloudflare Workers'}.get(rt,rt)
        heading={'no':'No page documents %s on %s','wrong':'The page for %s on %s contradicts the verified run','partial':'The page for %s on %s misses the wiring or the limits','yes':'The page for %s on %s is correct'}[v] % (fw,rt2)
    items.append(dict(id=hid,prio=prio,heading=heading,type=typ,title=title,body=body))
P0_ORDER=['DOC-Q7','DOC-Q12','DOC-Q19','DOC-Q20','DOC-Q25','DOC-Q26','DOC-Q32','DOC-Q37','DOC-Q41','DOC-Q44','DOC-Q48','DOC-Q52','DOC-Q57','DOC-Q58','DOC-Q69','DOC-Q71','DOC-Q75','DOC-Q78','DOC-Q83','DOC-Q86','DOC-Q87','DOC-Q92','DOC-Q95','DOC-Q101','DOC-Q103','DOC-B1','DOC-R1','DOC-R2','DOC-R20','DOC-R13','DOC-F50','DOC-F36','DOC-F19','DOC-F11','DOC-F28','DOC-F13','DOC-F30','DOC-F29']
for pos,i in enumerate(items): i['pos']=pos
def key(i): return (['P0','P1','P2'].index(i['prio']), P0_ORDER.index(i['id']) if i['id'] in P0_ORDER else 99, i['pos'])
items.sort(key=key)
FOOT='\n\n---\n\n_From the runtime docs audit of September 2026, item %s, see the [docs audit](%s) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._\n'
def notes(i):
    n=[]
    if i['id'] in OWNED: n.append('**Note.** '+OWNED[i['id']]+'.')
    if i['id'] in PAIRS: n.append('**Note.** Touches the same docs file as %s; the two can be filed as one issue.' % PAIRS[i['id']])
    return ('\n\n'.join(n)+'\n\n') if n else ''
sh=['#!/usr/bin/env bash','# Files the docs issues in getsentry/sentry-docs. Not executed by the audit. Items marked as owned by Linear are commented out.','set -euo pipefail','cd "$(dirname "$0")"','']
idx=['# Docs issue drafts, P0 to P2','','%d drafts for `getsentry/sentry-docs`, one per finding of the runtime docs audit.' % len(items)+' P0 is in the suggested filing order; P1 and P2 follow the audit page. Each `.md` is an issue body, the title is in the table. `create.sh` files them with the GitHub CLI and was not run.','','| # | Prio | Item | Type | Title | File |','| --- | --- | --- | --- | --- | --- |']
gist={'P0':[],'P1':[],'P2':[]}
for n,i in enumerate(items,1):
    fn='%s-%02d-%s.md' % (i['prio'], n, i['id']); i['file']=fn
    md=notes(i)+i['body']+FOOT % (i['id'], AUDIT)
    open(os.path.join(OUT,fn),'w').write(md)
    line='gh issue create -R getsentry/sentry-docs --title %s --body-file %s' % (json.dumps(i['title']), fn)
    sh.append(('# ' if i['id'] in OWNED else '')+line)
    idx.append('| %d | %s | %s | %s | %s | `%s` |' % (n,i['prio'],i['id'],i['type'],i['title'],fn))
    gist[i['prio']].append('## %d. %s\n\n**Audit item:** %s · **Type:** %s · **Finding:** %s\n\n%s' % (n, i['title'], i['id'], i['type'], i['heading'], md.strip()))
open(os.path.join(OUT,'create.sh'),'w').write('\n'.join(sh)+'\n'); os.chmod(os.path.join(OUT,'create.sh'),0o755)
open(os.path.join(OUT,'README.md'),'w').write('\n'.join(idx)+'\n')
json.dump(items, open(os.path.join(OUT,'_items.json'),'w'), indent=1)
MEAN={'P0':'a page that loses data for a common setup','P1':'a page that is wrong or missing for something users will hit','P2':'consistency and hygiene'}
def slug(h):
    h=h.lower().replace(' ','-')
    return re.sub(r'[^a-z0-9_\-]','',h)
for p in ('P0','P1','P2'):
    head='# %s docs issues, %s\n\n%d drafts for `getsentry/sentry-docs`. Each section is one issue: the heading is the proposed title, the body is the proposed description. From the runtime docs audit of the Bun, Deno and Cloudflare guides, September 2026.\n\n' % (p, MEAN[p], len(gist[p]))
    toc=['## Contents','']
    for sec in gist[p]:
        h=sec.split('\n',1)[0][3:]
        it=re.search(r'\*\*Audit item:\*\* (\S+) · \*\*Type:\*\* (\S+)', sec)
        toc.append('- [%s](#%s) · %s · %s' % (h, slug(h), it.group(1), it.group(2)))
    open(os.path.join(GIST,'%s.md' % p),'w').write(head+'\n'.join(toc)+'\n\n'+'\n\n'.join(gist[p])+'\n')
gidx=['# Runtime docs audit, proposed issues for sentry-docs','','Ninety-six proposed GitHub issues for `getsentry/sentry-docs` from the audit of the Bun, Deno and Cloudflare guides against the shipped SDK (develop at `6f2da7483d`, September 2026). One file per priority; within P0 the order is the suggested filing order.','','| Priority | Meaning | Drafts |','| --- | --- | --- |']
for p in ('P0','P1','P2'): gidx.append('| [%s](#file-%s-md) | %s | %d |' % (p, p.lower(), MEAN[p], len(gist[p])))
gidx+=['','**Start with [01-V11-CHECKLIST.md](#file-01-v11-checklist-md):** the getting-started and manual-setup changes that must land with v11, grouped by runtime, each linked to its draft.','','Reproductions, report pages and the same drafts as individual body files: %s' % BASE.replace('/blob/','/tree/'),'','Section 7 (DOC-Q1 to DOC-Q6) comes from the getting-started paths run on 2026-09-08. Seven drafts carry a note: X2 and DOC-R20 are owned by Linear tickets already in progress, and DOC-C1 to DOC-C5 are v11-gated and belong under the v11 docs umbrella. Three pairs touch the same docs file and can be filed as one issue each: DOC-F11 with DOC-F28, DOC-F13 with DOC-F30, DOC-F19 with DOC-F36.','']
open(os.path.join(GIST,'README.md'),'w').write('\n'.join(gidx)+'\n')
from collections import Counter
print(len(items),'drafts', dict(Counter(i['prio'] for i in items)), '| gist files:', sorted(os.listdir(GIST)))
