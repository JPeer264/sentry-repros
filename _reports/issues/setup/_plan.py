"""Plan the Linear sub-issues for the setup doc changes: one per framework or runtime, with the must and should items of the v11 checklist. Writes the bodies, plan.json, README.md and preview.html. Creates nothing in Linear."""
import ast, json, os, re, html as H
OUT=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(OUT,'..','..','..'))
GIST='https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21'
REPRO='https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements'
PARENT='SDK-1429'
items=json.load(open(os.path.join(ROOT,'_reports','issues','docs','_items.json')))
by={i['id']:i for i in items}
for n,i in enumerate(items,1): i['n']=n
csrc=open(os.path.join(ROOT,'_reports','issues','docs','_checklist.py')).read()
PLAN=ast.literal_eval(re.search(r'\nPLAN=(\[.*?\n\])\n', csrc, re.S).group(1))
OWNER=ast.literal_eval(re.search(r'\nOWNER=(\{.*?\})\n', csrc, re.S).group(1))
def slug(h): return re.sub(r'[^a-z0-9_\-]','',h.lower().replace(' ','-'))
def anchor(i): return GIST+'#'+slug('%d. %s' % (i['n'], i['title']))

# Where each checklist item goes. Groups map to a sub-issue of the same name unless listed here.
GROUP={'Every runtime guide':'All runtime guides','Cloudflare Pages':'Cloudflare','Cloudflare Workers':'Cloudflare','Browser WebAssembly':'Browser',
       'Node, Express, Fastify, Koa, Hapi, Connect, Hono and NestJS':None,'Frameworks whose page contradicts a verified run':None,'Frameworks whose page misses the wiring or the limits':None,'Migration to v11':None,'Gatsby':None}
ASSIGN={'DOC-Q85':'Node','DOC-Q25':'Node','DOC-Q26':'Node','DOC-Q5':'Node','DOC-Q28':'Node',
        'DOC-Q27':'Express','DOC-Q37':'Fastify','DOC-Q39':'Fastify','DOC-Q44':'Koa','DOC-Q45':'Koa','DOC-Q46':'Koa','DOC-Q47':'Hapi',
        'DOC-Q52':'Connect','DOC-Q53':'Connect','DOC-Q54':'Hono','DOC-Q55':'Hono','DOC-Q57':'NestJS','DOC-Q58':'NestJS','DOC-Q59':'NestJS','DOC-Q60':'NestJS',
        'DOC-F50':'Remix','DOC-F36':'Elysia','DOC-F19':'Elysia','DOC-F11':'Nuxt','DOC-F28':'Nuxt','DOC-F13':'Astro','DOC-F30':'Astro','DOC-F29':'SvelteKit',
        'DOC-F1':'Hono','DOC-F2':'Elysia','DOC-F18':'Hono','DOC-F35':'Hono','DOC-F44':'Next.js','DOC-F45':'Nuxt','DOC-F46':'SvelteKit','DOC-F49':'TanStack Start'}
ORDER=['All runtime guides','Node','Express','Fastify','Koa','Hapi','Connect','Hono','NestJS','Elysia','Bun','Deno','Cloudflare','Browser','React','Vue','Angular','Svelte','Solid','Ember',
       'Next.js','Nuxt','SvelteKit','Remix','Astro','TanStack Start','SolidStart','React Router','Nitro','AWS Lambda','Google Cloud Functions','Azure Functions','Effect','Mastra']
# Existing tickets that take the place of a new sub-issue.
EXISTING={'Cloudflare':('SDK-1426','Adjust docs for Cloudflare, assigned, milestone stable, body still tbd: fill it with the list below instead of creating a new sub-issue')}
GUIDE={'All runtime guides':'the Node, Bun, Deno and Cloudflare','Node':'the Node','Browser':'the browser and WebAssembly','Cloudflare':'the Cloudflare Workers and Pages','Elysia':'the Elysia'}

subs={}
skipped=[]
for group, rows in PLAN:
    for tier,iid,why in rows:
        if tier not in ('must','should'): continue
        sub=ASSIGN.get(iid, GROUP.get(group, group))
        if sub is None:
            skipped.append((iid, group, OWNER.get(iid,''))); continue
        subs.setdefault(sub, []).append((tier, iid, why))
missing=[s for s in subs if s not in ORDER]; assert not missing, missing

def sources(ids):
    dirs=[]
    for iid in ids:
        src=by[iid].get('source','')
        for q in re.findall(r'QS-([a-z0-9-]+)', src):
            d='quickstarts/'+q
            if d not in dirs: dirs.append(d)
        for c in re.findall(r'\b(M-[a-z0-9-]+)', src):
            d='cells/'+c
            if d not in dirs: dirs.append(d)
    return dirs

NOCHANGE=[]
def entry(tier, iid, why):
    i=by[iid]; body=i['body']
    if 'What to change:' in body:
        obs,change=body.split('What to change:',1)
    else:
        blocks=body.strip().split('\n\n'); k=len(blocks)
        while k>0 and all(l.startswith('- ') for l in blocks[k-1].split('\n')): k-=1
        if k<len(blocks):
            if k>0 and blocks[k-1].rstrip().endswith(':'): k-=1
            obs='\n\n'.join(blocks[:k]); change='\n\n'.join(blocks[k:])
        else:
            obs=body; change=''; NOCHANGE.append(iid)
    obs=obs.strip().replace('\n\n','\n  ')
    change=re.sub(r'^- ','',change.strip(), flags=re.M).strip().replace('\n\n',' ').replace('\n',' ')
    change=re.sub(r'^What to change on (`[^`]+`):\s*', r'On \1: ', change)
    change=re.sub(r'^What to change[^:]*:\s*', '', change)
    head=why[0].upper()+why[1:] if re.match(r'^[a-z]+\b', why) and not re.match(r'^[a-z]+[A-Z._/]', why) else why
    lines=['- [ ] **%s** · %s · %s' % (i['prio'], iid, head), '  '+obs]
    if change: lines.append('  **Change:** '+change)
    if iid in OWNER: lines.append('  Note: %s.' % OWNER[iid])
    lines.append('  Draft: [%s](<%s>)' % (i['title'], anchor(i)))
    return '\n'.join(lines)

plan=[]
for k,title in enumerate(ORDER,1):
    rows=subs.get(title, [])
    must=[r for r in rows if r[0]=='must']; should=[r for r in rows if r[0]=='should']
    ids=[r[1] for r in rows]
    dirs=sources(ids)
    repro=', '.join('[`%s/`](<%s/%s>)' % (d, REPRO, d) for d in dirs)
    guide=GUIDE.get(title, 'the %s' % title)
    intro=('Docs changes for %s guide%s that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). '
           'Each item links to its issue draft in the secret gist (%s); the reproductions are %s in the audit repository.') % (guide, 's' if title=='All runtime guides' else '', GIST, repro or 'linked from each draft')
    md=intro+'\n\n## Must land\n\n'+('\n'.join(entry(*r) for r in must) if must else 'None.')+'\n\n## Should land\n\n'+('\n'.join(entry(*r) for r in should) if should else 'None.')
    prio='High' if must else 'Medium'
    fn='%02d-%s.md' % (k, slug(title))
    open(os.path.join(OUT,fn),'w').write(md+'\n')
    plan.append(dict(n=k,title=title,file=fn,priority=prio,must=[r[1] for r in must],should=[r[1] for r in should],existing=EXISTING.get(title),body=md))
json.dump(plan, open(os.path.join(OUT,'plan.json'),'w'), indent=1)

PROPS='team SDKs · project Major Release: 11.0 [JavaScript] · milestone stable · labels Task, Type: Documentation · parent %s · not synced with GitHub' % PARENT
idx=['# Linear sub-issue plan for the setup doc changes','','%d sub-issues under %s, one per framework or runtime, each with the must and should items of the v11 checklist as checkboxes. %s. Nothing has been created; `plan.json` and the `.md` files are the bodies.' % (len(plan), PARENT, PROPS[0].upper()+PROPS[1:]),'',
     '| # | Sub-issue | Priority | Must | Should | Existing ticket | File |','| --- | --- | --- | --- | --- | --- | --- |']
for p in plan:
    idx.append('| %d | %s | %s | %s | %s | %s | `%s` |' % (p['n'],p['title'],p['priority'],', '.join(p['must']) or '–',', '.join(p['should']) or '–',(p['existing'][0] if p['existing'] else '–'),p['file']))
idx+=['','## Not in a sub-issue','']+['- %s (%s)%s' % (iid, group, ': '+own if own else '') for iid,group,own in skipped]+['','Counts: %d must, %d should across %d sub-issues.' % (sum(len(p['must']) for p in plan), sum(len(p['should']) for p in plan), len(plan))]
open(os.path.join(OUT,'README.md'),'w').write('\n'.join(idx)+'\n')

# preview page
style=re.search(r'<style>.*?</style>', open(os.path.join(ROOT,'_reports','issues','linear','_page.py')).read(), re.S).group(0)
def inline(s):
    s=H.escape(s)
    s=re.sub(r'`([^`]+)`', lambda m:'<code>'+m.group(1)+'</code>', s)
    s=re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s=re.sub(r'\[([^\]]+)\]\(&lt;(https?://[^&]+)&gt;\)', r'<a href="\2">\1</a>', s)
    s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2">\1</a>', s)
    return s
def md2html(md):
    out=[]; li=None
    def flush():
        nonlocal li
        if li is not None: out.append('<li><label><input type="checkbox" disabled> '+'<br>'.join(li)+'</label></li>'); li=None
    inlist=False
    for line in md.split('\n'):
        if line.startswith('## '):
            flush()
            if inlist: out.append('</ul>'); inlist=False
            out.append('<h4>'+inline(line[3:])+'</h4>')
        elif line.startswith('- [ ] '):
            flush()
            if not inlist: out.append('<ul class="checks">'); inlist=True
            li=[inline(line[6:])]
        elif line.startswith('  ') and li is not None:
            li.append(inline(line.strip()))
        elif line.strip()=='' :
            flush()
            if inlist: out.append('</ul>'); inlist=False
        else:
            flush()
            if inlist: out.append('</ul>'); inlist=False
            out.append('<p>'+inline(line)+'</p>')
    flush()
    if inlist: out.append('</ul>')
    return '\n'.join(out)
nav=''.join('<li><a href="#s-%d">%s</a><span class="cnt">%d/%d</span></li>' % (p['n'],H.escape(p['title']),len(p['must']),len(p['should'])) for p in plan)
cards=[]
for p in plan:
    ex=('<p class="existing"><strong>Use the existing ticket %s.</strong> %s.</p>' % (p['existing'][0], H.escape(p['existing'][1]))) if p['existing'] else ''
    cards.append('''<article class="ticket" id="s-%(n)d">
<p class="props"><span class="chip status">Planned</span><span class="chip %(pc)s">Priority: %(prio)s</span><span class="chip ms">stable</span><span class="chip">Task</span><span class="chip">Type: Documentation</span><span class="chip">parent %(parent)s</span><span class="n">#%(n)d of %(total)d · %(m)d must · %(s)d should</span></p>
<h3>%(title)s</h3>%(ex)s
<div class="body">%(body)s</div>
<div class="bar"><button type="button" class="btn" data-copy="title">Copy title</button><button type="button" class="btn" data-copy="body">Copy description</button><span class="file">%(file)s</span></div>
<details><summary>Markdown source</summary><pre data-role="body">%(md)s</pre></details>
<pre class="hidden" data-role="title">%(title)s</pre>
</article>''' % dict(n=p['n'],total=len(plan),pc='p-high' if p['priority']=='High' else 'p-med',prio=p['priority'],parent=PARENT,m=len(p['must']),s=len(p['should']),title=H.escape(p['title']),ex=ex,body=md2html(p['body']),file=p['file'],md=H.escape(p['body'])))
skip_html=''.join('<li><code>%s</code> from %s%s</li>' % (iid,H.escape(group),(': '+H.escape(own)) if own else '') for iid,group,own in skipped)
page='''<title>v11 Setup Doc Tickets</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
'''+style.replace('</style>','.checks{list-style:none;padding-left:0}.checks li{border-top:1px solid var(--line);padding:8px 0;margin:0}.checks li:first-child{border-top:0}.checks label{display:block}.checks input{margin-right:6px}h4{font-family:var(--serif);font-size:16px;margin:14px 0 6px}.existing{border-left:3px solid var(--warn);background:var(--panel);padding:8px 12px;margin:0 0 12px;border-radius:0 4px 4px 0;font-size:14px}nav .cnt{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}</style>')+'''
<div class="wrap"><nav><p>Sub-issues · must/should</p><ul>'''+nav+'''</ul></nav><main>
<h1>Linear sub-issues for the setup doc changes</h1>
<p class="lede">'''+str(len(plan))+''' planned sub-issues under '''+PARENT+''' (v11 SDK docs updates), one per framework or runtime. Every card is a ready description: the must and should items of the v11 checklist, each with the finding, the change and the draft link. Nothing has been created.</p>
<div class="alert"><p><strong>Properties for every sub-issue.</strong> '''+H.escape(PROPS)+'''. Priority High where a must item exists, Medium otherwise. Four audit findings covered by existing tickets (DOC-Q29 and DOC-Q38 by SDK-1482, DOC-Q62 by SDK-1461, DOC-Q86 by SDK-1483) are not listed; items that overlap an existing ticket carry a note.</p>
<p><strong>Not in a sub-issue.</strong></p><ul>'''+skip_html+'''</ul></div>
'''+'\n'.join(cards)+'''
</main></div>
<script>
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-copy]'); if (!b) return;
  var art = b.closest('.ticket'); var src = art.querySelector('[data-role="' + b.getAttribute('data-copy') + '"]');
  var text = src ? src.textContent : '';
  var done = function () { var old = b.textContent; b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1500); };
  var fallback = function () { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { b.textContent = 'Copy failed'; } document.body.removeChild(ta); };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else { fallback(); }
});
</script>
'''
open(os.path.join(OUT,'preview.html'),'w').write(page)
print('no change section:', NOCHANGE)
print(len(plan),'sub-issues;', sum(len(p['must']) for p in plan),'must,', sum(len(p['should']) for p in plan),'should; skipped', [s[0] for s in skipped])
