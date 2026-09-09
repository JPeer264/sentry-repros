import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..'))
import re, html as H, json, os
from html.parser import HTMLParser
SRC=os.path.join(ROOT,'_reports','docs-audit.html')
OUT=os.path.dirname(os.path.abspath(__file__))
AUDIT='https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html'
os.makedirs(OUT, exist_ok=True)
doc=open(SRC).read()

class MD(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.href=None; s.li=None
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='p': s.out.append('')
        elif t in('ul','ol'): s.li=0
        elif t=='li': s.li+=1; s.out.append('- ')
        elif t=='code': s.out.append('`')
        elif t in('strong','b'): s.out.append('**')
        elif t in('em','i'): s.out.append('_')
        elif t=='a': s.href=a.get('href','')
        elif t=='br': s.out.append('\n')
    def handle_endtag(s,t):
        if t=='p': s.out.append('\n\n')
        elif t in('ul','ol'): s.out.append('\n'); s.li=None
        elif t=='li': s.out.append('\n')
        elif t=='code': s.out.append('`')
        elif t in('strong','b'): s.out.append('**')
        elif t in('em','i'): s.out.append('_')
        elif t=='a':
            if s.href and not s.href.startswith('#'): s.out.append(' ('+s.href+')')
            s.href=None
    def handle_data(s,d): s.out.append(d)
def to_md(fragment):
    p=MD(); p.feed(fragment); txt=''.join(p.out)
    txt=re.sub(r'[ \t]+\n','\n',txt); txt=re.sub(r'\n{3,}','\n\n',txt)
    return txt.strip()

items=[]
for m in re.finditer(r'<h3 id="([^"]+)">((?:(?!<h3 ).)*?)</h3>\s*<div class="issue">(.*?)</details></div>', doc, re.S):
    hid, h3, issue = m.group(1), m.group(2), m.group(3)
    if 'chip p0' not in h3: continue
    title_h3=H.unescape(re.sub(r'<[^>]+>','',re.search(r'<span class="ht">(.*?)</span>',h3,re.S).group(1))).strip()
    typ=re.search(r'Proposed issue <span class="chip">([^<]+)</span>',issue).group(1)
    it=H.unescape(re.sub(r'<[^>]+>','',re.search(r'<p class="it">(.*?)</p>',issue,re.S).group(1))).strip()
    body_html=re.search(r'<div class="body">(.*)$',issue,re.S).group(1)
    items.append(dict(id=hid,heading=title_h3,type=typ,title=it,body_html=body_html,body_md=to_md(body_html)))

order=['DOC-Q7','DOC-Q12','DOC-Q19','DOC-Q20','DOC-Q25','DOC-Q26','DOC-Q32','DOC-Q37','DOC-Q41','DOC-Q44','DOC-Q48','DOC-Q52','DOC-Q57','DOC-Q58','DOC-B1','DOC-R1','DOC-R2','DOC-R20','DOC-R13','DOC-F50','DOC-F36','DOC-F19','DOC-F11','DOC-F28','DOC-F13','DOC-F30','DOC-F29']
order=[o for o in order if o in {i['id'] for i in items}]+[i['id'] for i in items if i['id'] not in order]
items.sort(key=lambda i: order.index(i['id']))

FOOT=("\n\n---\n\n_From the runtime docs audit of September 2026, item {id}, see the [docs audit]({link}) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._\n")
def body_md(i):
    md=i['body_md']
    md=re.sub(r'\n*Source: runtime docs audit, item [^\n]*$','',md).strip()
    return md+FOOT.format(id=i['id'],link=AUDIT)

sh=['#!/usr/bin/env bash','# Creates the P0 issues in getsentry/sentry-docs. Not executed by the audit; run it yourself when the drafts are final.','set -euo pipefail','cd "$(dirname "$0")"','']
idx=['# P0 issue drafts','','Fourteen drafts for `getsentry/sentry-docs`, in the suggested filing order. Each `.md` file is an issue body; the title is in the table. `create.sh` files them with the GitHub CLI and was not run.','','| # | File | Title | Type | Audit item |','| --- | --- | --- | --- | --- |']
for n,i in enumerate(items,1):
    fn=f'{n:02d}-{i["id"]}.md'
    open(os.path.join(OUT,fn),'w').write(body_md(i))
    i['file']=fn
    sh.append(f'gh issue create -R getsentry/sentry-docs --title {json.dumps(i["title"])} --body-file {fn}')
    idx.append(f'| {n} | `{fn}` | {i["title"]} | {i["type"]} | {i["id"]} |')
open(os.path.join(OUT,'create.sh'),'w').write('\n'.join(sh)+'\n'); os.chmod(os.path.join(OUT,'create.sh'),0o755)
open(os.path.join(OUT,'README.md'),'w').write('\n'.join(idx)+'\n')
json.dump([{k:v for k,v in i.items()} for i in items], open(os.path.join(OUT,'_items.json'),'w'), indent=1)
print(len(items),'drafts written to',OUT)
for n,i in enumerate(items,1): print(n,i['id'],i['type'],'|',i['title'])
