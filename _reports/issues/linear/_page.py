import os
import json, re, html as H
T=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'_tickets.json')))
def inline(s):
    s=H.escape(s)
    s=re.sub(r'`([^`]+)`', lambda m:'<code>'+m.group(1)+'</code>', s)
    s=re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2">\1</a>', s)
    return s
def md2html(md):
    out=[]; 
    for block in re.split(r'\n\s*\n', md.strip()):
        lines=block.split('\n')
        if all(l.startswith('- ') for l in lines):
            out.append('<ul>'+''.join('<li>'+inline(l[2:])+'</li>' for l in lines)+'</ul>')
        else:
            out.append('<p>'+inline(' '.join(lines))+'</p>')
    return '\n'.join(out)
PRIO={'High':'p-high','Medium':'p-med','Low':'p-low'}
ms_order=[]; 
for x in T:
    if x['milestone'] not in ms_order: ms_order.append(x['milestone'])
nav=''.join('<li><a href="#ms-%d">%s</a><span class="cnt">%d</span></li>' % (i,H.escape(m),sum(1 for x in T if x['milestone']==m)) for i,m in enumerate(ms_order))
sections=[]
for i,m in enumerate(ms_order):
    cards=[]
    for x in [t for t in T if t['milestone']==m]:
        labels=''.join('<span class="chip">%s</span>' % H.escape(l) for l in x['labels'])
        cards.append('''<article class="ticket" id="t-%(n)d">
<p class="props"><span class="chip status">Backlog</span><span class="chip %(pc)s">Priority: %(prio)s</span><span class="chip ms">%(ms)s</span>%(labels)s<span class="n">#%(n)d of 40</span></p>
<h3>%(title)s</h3>
<div class="body">%(body)s</div>
<div class="bar"><button type="button" class="btn" data-copy="title">Copy title</button><button type="button" class="btn" data-copy="body">Copy description</button><span class="file">%(file)s</span></div>
<details><summary>Markdown source</summary><pre data-role="body">%(md)s</pre></details>
<pre class="hidden" data-role="title">%(title)s</pre>
</article>''' % dict(n=x['n'],pc=PRIO[x['priority']],prio=x['priority'],ms=H.escape(m),labels=labels,title=H.escape(x['title']),body=md2html(x['body']),file=x['file'],md=H.escape(x['body'])))
    sections.append('<section id="ms-%d"><h2>%s <small>%d ticket%s</small></h2>%s</section>' % (i,H.escape(m),len(cards),'' if len(cards)==1 else 's','\n'.join(cards)))
page='''<title>Runtime Compatibility Tickets</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#F6F5F2;--panel:#EDECE7;--card:#FBFAF8;--ink:#1E2126;--muted:#5F6873;--line:#D6D4CD;--accent:#2E6B8A;--code-bg:#ECEBE6;--p0:#A8382F;--warn:#9A6A12;--nr:#3F7A4E;--serif:"IBM Plex Serif",Georgia,"Times New Roman",serif;--sans:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;--mono:"IBM Plex Mono","SFMono-Regular",Menlo,Consolas,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16191E;--panel:#1D2127;--card:#1A1E24;--ink:#E6E4DE;--muted:#9AA3AE;--line:#2E343C;--accent:#7FB3CF;--code-bg:#1F242B;--p0:#E07B72;--warn:#D6A544;--nr:#7FC28F}}
:root[data-theme="dark"]{--bg:#16191E;--panel:#1D2127;--card:#1A1E24;--ink:#E6E4DE;--muted:#9AA3AE;--line:#2E343C;--accent:#7FB3CF;--code-bg:#1F242B;--p0:#E07B72;--warn:#D6A544;--nr:#7FC28F}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 40%,transparent)}a:hover,a:focus-visible{border-bottom-color:var(--accent);outline:none}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.wrap{display:grid;grid-template-columns:260px minmax(0,1fr);gap:40px;max-width:1180px;margin:0 auto;padding:40px 28px 96px}
nav{position:sticky;top:24px;align-self:start;font-size:13px}nav p{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}nav ul{list-style:none;margin:0;padding:0}nav li{display:flex;align-items:baseline;gap:8px;margin:6px 0}nav li a{border:0;color:inherit}nav li a:hover{color:var(--accent)}nav .cnt{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
main{max-width:78ch;min-width:0}
h1{font-family:var(--serif);font-weight:600;font-size:32px;line-height:1.15;margin:0 0 12px;text-wrap:balance}
.lede{color:var(--muted);font-size:15px;margin:0 0 20px}
p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:22px}li{margin:4px 0}
code{font-family:var(--mono);font-size:.88em;background:var(--code-bg);padding:1px 5px;border-radius:3px}
pre{background:var(--code-bg);border:1px solid var(--line);padding:12px 14px;overflow-x:auto;font-family:var(--mono);font-size:12.5px;line-height:1.5;margin:0 0 12px;border-radius:4px;white-space:pre-wrap;word-break:break-word}
.chip{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.04em;padding:2px 7px;border-radius:3px;background:var(--panel);color:var(--muted);white-space:nowrap;border:1px solid var(--line)}
.chip.status{color:var(--muted)}.chip.ms{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent)}.chip.p-high{color:var(--p0);border-color:currentColor;background:transparent}.chip.p-med{color:var(--warn);border-color:currentColor;background:transparent}.chip.p-low{color:var(--muted);border-color:currentColor;background:transparent}
.alert{border-left:3px solid var(--warn);background:var(--panel);padding:12px 16px;margin:0 0 28px;border-radius:0 4px 4px 0}.alert p:last-child{margin:0}
section h2{font-family:var(--serif);font-weight:600;font-size:22px;margin:44px 0 16px;padding-top:20px;border-top:1px solid var(--line);display:flex;align-items:baseline;gap:10px}section h2 small{font-family:var(--mono);font-size:12px;font-weight:400;color:var(--muted)}
section:first-of-type h2{margin-top:8px}
.ticket{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:16px 20px 12px;margin:0 0 20px;scroll-margin-top:16px}
.props{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 8px}.props .n{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
.ticket h3{font-family:var(--serif);font-weight:600;font-size:19px;line-height:1.3;margin:0 0 12px;text-wrap:balance}
.body{border-top:1px solid var(--line);padding-top:12px;font-size:15px}
.bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 8px}.bar .file{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
.btn{font:inherit;font-size:13px;padding:4px 12px;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--ink);cursor:pointer}.btn:hover{border-color:var(--accent);color:var(--accent)}.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.btn.done{border-color:var(--nr);color:var(--nr)}
details summary{cursor:pointer;color:var(--accent);font-size:13px;margin:0 0 8px}.hidden{display:none}
@media (max-width:960px){.wrap{grid-template-columns:1fr;gap:20px;padding:24px 16px 64px}nav{position:static}.props .n,.bar .file{margin-left:0}}
</style>
<div class="wrap"><nav><p>Milestones</p><ul>__NAV__</ul></nav><main>
<h1>Tickets for the runtime compatibility project</h1>
<p class="lede">Forty drafts for the Linear project Improve Server Runtime + Framework Compatibility [JS], grouped by milestone, in the shape the project's existing issues use: what was observed, the cause where known, a work item, and the evidence. Nothing has been created.</p>
<div class="alert"><p><strong>Before filing.</strong> Evidence lines name files in the runtime audit repository: the cell and probe reproductions, and the report pages under <code>_reports/</code>. Existing tickets that already cover a finding are referenced by id and not drafted again: JS-3508, JS-3517, JS-3518, JS-3509, JS-3510, JS-3572, JS-3580 and JS-3581. The Markdown files are in <code>_reports/issues/linear/</code> of that repository.</p></div>
__SECTIONS__
</main></div>
<script>
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-copy]'); if (!b) return;
  var art = b.closest('.ticket'); var src = art.querySelector('[data-role="' + b.getAttribute('data-copy') + '"]');
  var text = src ? src.textContent : '';
  var done = function () { var old = b.textContent; b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1500); };
  var fallback = function () { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { b.textContent = 'Copy failed'; } document.body.removeChild(ta); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
});
</script>
'''.replace('__NAV__',nav).replace('__SECTIONS__','\n'.join(sections))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'preview.html'),'w').write(page)
print('page written', len(page), 'tickets', len(T))
