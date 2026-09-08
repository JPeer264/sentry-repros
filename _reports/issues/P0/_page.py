import os
import json, html as H
items=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'_items.json')))
AUDIT='_reports/docs-audit.html'
FOOT=("\n\n---\n\n_From the runtime docs audit of September 2026, item {id}; the audit page is `_reports/docs-audit.html` in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._\n")
import re
def body_md(i):
    md=re.sub(r'\n*Source: runtime docs audit, item [^\n]*$','',i['body_md']).strip()
    return md+FOOT.format(id=i['id'],link=AUDIT+'#'+i['id'])
def foot_html(i):
    return ('<hr><p class="foot"><em>From the runtime docs audit of September 2026, item %s; the audit page is <code>_reports/docs-audit.html</code> in the runtime audit repository. Behavior verified on <code>getsentry/sentry-javascript</code> develop at <code>6f2da7483d</code> (package 10.67.0) against docs at <code>046ce5942</code>; citations re-checked on 2026-09-07 against docs <code>b568ebbd3</code> and develop <code>d6426ad581</code>.</em></p>' % i['id'])
def strip_source(bh):
    return re.sub(r'<p>Source: runtime docs audit, item [^<]*</p>\s*$','',bh.strip())

cards=[]; rows=[]
for n,i in enumerate(items,1):
    gh='gh issue create -R getsentry/sentry-docs --title %s --body-file %s' % (json.dumps(i['title']), i['file'])
    rows.append('<tr><td>%d</td><td><a href="#i-%s">%s</a></td><td>%s</td><td><span class="chip">%s</span></td></tr>' % (n,i['id'],H.escape(i['title']),i['id'],i['type']))
    cards.append('''
<article class="issue" id="i-%(id)s">
<p class="meta"><span class="chip draft">Draft</span><span class="repo">getsentry/sentry-docs</span><span class="chip p0">P0</span><span class="chip">%(type)s</span><span class="iid">%(id)s</span><span class="n">%(n)d of 13</span></p>
<h2>%(title)s</h2>
<div class="ibody">%(body)s%(foot)s</div>
<div class="bar"><button type="button" class="btn" data-copy="title">Copy title</button><button type="button" class="btn" data-copy="body">Copy body</button><button type="button" class="btn" data-copy="gh">Copy gh command</button><span class="file">%(file)s</span></div>
<details><summary>Markdown source</summary><pre class="src" data-role="body">%(md)s</pre></details>
<pre class="hidden" data-role="title">%(title)s</pre><pre class="hidden" data-role="gh">%(gh)s</pre>
</article>''' % dict(id=i['id'],type=i['type'],n=n,title=H.escape(i['title']),body=strip_source(i['body_html']),foot=foot_html(i),file=i['file'],md=H.escape(body_md(i)),gh=H.escape(gh)))

page='''<title>P0 Issue Drafts</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#F6F5F2;--panel:#EDECE7;--card:#FBFAF8;--ink:#1E2126;--muted:#5F6873;--line:#D6D4CD;--accent:#2E6B8A;--code-bg:#ECEBE6;--p0:#A8382F;--nr:#3F7A4E;--warn:#9A6A12;--serif:"IBM Plex Serif",Georgia,"Times New Roman",serif;--sans:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;--mono:"IBM Plex Mono","SFMono-Regular",Menlo,Consolas,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16191E;--panel:#1D2127;--card:#1A1E24;--ink:#E6E4DE;--muted:#9AA3AE;--line:#2E343C;--accent:#7FB3CF;--code-bg:#1F242B;--p0:#E07B72;--nr:#7FC28F;--warn:#D6A544}}
:root[data-theme="dark"]{--bg:#16191E;--panel:#1D2127;--card:#1A1E24;--ink:#E6E4DE;--muted:#9AA3AE;--line:#2E343C;--accent:#7FB3CF;--code-bg:#1F242B;--p0:#E07B72;--nr:#7FC28F;--warn:#D6A544}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 40%,transparent)}a:hover,a:focus-visible{border-bottom-color:var(--accent);outline:none}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
main{max-width:78ch;margin:0 auto;padding:40px 24px 96px}
h1{font-family:var(--serif);font-weight:600;font-size:32px;line-height:1.15;margin:0 0 12px;text-wrap:balance}
.lede{color:var(--muted);font-size:15px;margin:0 0 22px}
p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:22px}li{margin:4px 0}
code{font-family:var(--mono);font-size:.88em;background:var(--code-bg);padding:1px 5px;border-radius:3px}
pre{background:var(--code-bg);border:1px solid var(--line);padding:12px 14px;overflow-x:auto;font-family:var(--mono);font-size:12.5px;line-height:1.5;margin:0 0 12px;border-radius:4px;white-space:pre-wrap;word-break:break-word}
.chip{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.04em;padding:2px 7px;border-radius:3px;background:var(--panel);color:var(--muted);white-space:nowrap;border:1px solid var(--line)}
.chip.p0{background:var(--p0);color:#fff;border-color:var(--p0)}.chip.draft{color:var(--warn);border-color:currentColor;background:transparent}
.alert{border-left:3px solid var(--warn);background:var(--panel);padding:12px 16px;margin:0 0 22px;border-radius:0 4px 4px 0}.alert p:last-child{margin:0}
.tw{overflow-x:auto;margin:0 0 36px;border:1px solid var(--line);border-radius:4px}
table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}th,td{text-align:left;vertical-align:top;padding:8px 12px;border-bottom:1px solid var(--line)}
th{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--panel);font-weight:500}tr:last-child td{border-bottom:0}
h2.sec{font-family:var(--serif);font-weight:600;font-size:22px;margin:40px 0 14px}
.issue{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:18px 22px 14px;margin:0 0 28px;scroll-margin-top:16px}
.issue .meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px;font-size:13px}.issue .repo{font-family:var(--mono);font-size:12px;color:var(--muted)}.issue .iid{font-family:var(--mono);font-size:12px;color:var(--accent)}.issue .n{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
.issue h2{font-family:var(--serif);font-weight:600;font-size:22px;line-height:1.25;margin:0 0 14px;text-wrap:balance}
.ibody{border-top:1px solid var(--line);padding-top:14px;font-size:15px}.ibody hr{border:0;border-top:1px solid var(--line);margin:16px 0}.ibody .foot{color:var(--muted);font-size:13.5px}
.bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 10px}.bar .file{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--muted)}
.btn{font:inherit;font-size:13px;padding:4px 12px;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--ink);cursor:pointer}.btn:hover{border-color:var(--accent);color:var(--accent)}.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.btn.done{border-color:var(--nr);color:var(--nr)}
details summary{cursor:pointer;color:var(--accent);font-size:13.5px;margin:0 0 8px}.hidden{display:none}
@media (max-width:640px){main{padding:24px 16px 64px}.issue{padding:14px 16px 10px}.issue .n,.bar .file{margin-left:0}}
</style>
<main>
<h1>P0 issue drafts for the runtime docs</h1>
<p class="lede">Thirteen issues for <code>getsentry/sentry-docs</code>, one per P0 item of the runtime docs audit, shown as they would read on GitHub. Nothing has been filed. The order below is the suggested filing order: the four items that mislead every reader of a runtime guide first, then the framework pages that contradict a verified run.</p>
<div class="alert"><p><strong>Before filing.</strong> Three pairs touch the same docs file and could be filed as one issue each: the two Nuxt presets items (DOC-F11, DOC-F28), the two Astro runtime-alert items (DOC-F13, DOC-F30) and the two Elysia runtime-list items (DOC-F19, DOC-F36).</p></div>
<div class="tw"><table><thead><tr><th>#</th><th>Title</th><th>Audit item</th><th>Type</th></tr></thead><tbody>__ROWS__</tbody></table></div>
__CARDS_ANCHOR__<p>The body files and a <code>create.sh</code> with one <code>gh issue create</code> line per draft are in <code>_reports/issues/P0/</code> of the runtime audit repository. The script was not run.</p>
</main>
<script>
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-copy]'); if (!b) return;
  var art = b.closest('.issue'); var src = art.querySelector('[data-role="' + b.getAttribute('data-copy') + '"]');
  var text = src ? src.textContent : '';
  var done = function () { var old = b.textContent; b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1500); };
  var fallback = function () { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { b.textContent = 'Copy failed'; } document.body.removeChild(ta); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
});
</script>
'''.replace('__ROWS__','\n'.join(rows)).replace('__CARDS_ANCHOR__','')
page=page.replace('</main>', '\n'.join(cards)+'\n</main>')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'preview.html'),'w').write(page)
print('page written', len(page))
