import os
import re, sys
src = os.path.join(os.path.dirname(os.path.abspath(__file__)),'_sources','docs-audit.source.html')
dst = sys.argv[1]
html = open(src).read()

CSS = r'''
.board{position:sticky;top:0;z-index:5;border:1px solid var(--line);background:var(--panel);border-radius:4px;padding:12px 16px;margin:0 0 28px;box-shadow:0 8px 16px -12px color-mix(in srgb,var(--ink) 40%,transparent)}
main h2,main h3,article.item{scroll-margin-top:calc(var(--board-h,0px) + 16px)}
.board-title{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.board-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
.board-row+.board-row{margin-top:10px}
.board-label{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:4px;overflow:hidden}
.seg button{font:inherit;font-size:13px;padding:4px 12px;background:var(--bg);color:var(--ink);border:0;cursor:pointer}
.seg button+button{border-left:1px solid var(--line)}
.seg button.on{background:var(--accent);color:#fff}
.seg button:focus-visible,.btn:focus-visible,.chk input:focus-visible,.board select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.chk{display:inline-flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;user-select:none}
.chk input{margin:0;accent-color:var(--accent)}
.chk .cnt{color:var(--muted);font-variant-numeric:tabular-nums;font-size:12px}
.board select{font:inherit;font-size:13px;padding:3px 8px;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--ink)}
.board-count{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:auto;font-variant-numeric:tabular-nums}
.btn{font:inherit;font-size:13px;padding:4px 12px;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--ink);cursor:pointer}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn.sm{font-size:11px;padding:2px 8px;font-family:var(--mono);letter-spacing:.03em}
.btn.done{border-color:var(--nr);color:var(--nr)}
.board-hint{font-size:12.5px;color:var(--muted)}
.ticket-list{margin:12px 0 0;max-height:38vh;overflow:auto}.ticket-list thead th{position:sticky;top:0}.ticket-list td{font-size:13px;vertical-align:middle}.ticket-list td:nth-child(4){min-width:24ch}.ticket-list .chip{font-size:10.5px}
body.mode-prio main>.doc-only{display:none}
h2.prio-group{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}h2.prio-group .chip{font-size:12px}h2.prio-group small{font-family:var(--sans);font-weight:400;font-size:14px;color:var(--muted)}
.chip.where{display:none;background:transparent;border:1px solid var(--line);color:var(--muted);text-transform:none;letter-spacing:0;font-family:var(--sans);font-size:11.5px;white-space:normal}
body.mode-prio .chip.where{display:inline-block}
.issue .eyebrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.issue .eyebrow .copy{margin-left:auto}
article.item[hidden]{display:none}
@media (max-width:960px){.board-count{margin-left:0}}
'''

BOARD = r'''<section class="board" id="board" aria-label="Ticket board">
<p class="board-title">Ticket board</p>
<div class="board-row">
<span class="board-label">Order</span>
<div class="seg" role="group" aria-label="Order"><button type="button" data-order="doc" class="on">Document</button><button type="button" data-order="prio">Priority</button></div>
<span class="board-label">Show</span>
<label class="chk" title="loses data for a common setup"><input type="checkbox" data-prio="P0" checked><span class="chip p0">P0</span><span class="cnt" data-cnt="P0">13</span></label>
<label class="chk" title="wrong or missing for something users will hit"><input type="checkbox" data-prio="P1" checked><span class="chip p1">P1</span><span class="cnt" data-cnt="P1">64</span></label>
<label class="chk" title="consistency and hygiene"><input type="checkbox" data-prio="P2" checked><span class="chip p2">P2</span><span class="cnt" data-cnt="P2">13</span></label>
<label class="chk" title="checked, not a defect"><input type="checkbox" data-prio="other" checked><span class="chip">not a defect</span><span class="cnt" data-cnt="other">4</span></label>
<span class="board-label">Type</span>
<select id="typeSel" aria-label="Proposal type"><option value="">all types</option><option value="docs-change">docs-change</option><option value="new-page">new-page</option><option value="limitation-note">limitation-note</option></select>
<span class="board-count" id="boardCount">90 proposals shown</span>
</div>
<div class="board-row">
<button type="button" class="btn" id="listToggle">Show ticket list</button>
<button type="button" class="btn" id="copyAll">Copy shown proposals as Markdown</button>
<span class="board-hint">Priority order groups the items under P0, P1 and P2 and hides the section intros and the tables at the end. Each proposal has a copy button for GitHub.</span>
</div>
<div class="tw ticket-list" id="ticketList" hidden><table><thead><tr><th>Priority</th><th>Item</th><th>Type</th><th>Proposed issue</th><th></th></tr></thead><tbody id="ticketRows"></tbody></table></div>
</section>
'''

JS = r'''<script>
(function () {
  var main = document.querySelector('main');
  var nav = document.querySelector('nav ul');
  var board = document.getElementById('board');
  if (!main || !board) return;
  var ORDER = { P0: 0, P1: 1, P2: 2, other: 3 };
  var LABEL = { P0: 'P0', P1: 'P1', P2: 'P2', other: 'Not a defect' };
  var MEANING = { P0: 'a page that loses data for a common setup', P1: 'a page that is wrong or missing for something users will hit', P2: 'consistency and hygiene', other: 'checked, not reproduced' };
  var CHIP = { P0: 'chip p0', P1: 'chip p1', P2: 'chip p2', other: 'chip nr' };

  var items = [], byId = {}, section = '', sub = '', firstH2 = null;
  var kids = Array.prototype.slice.call(main.children);
  for (var i = 0; i < kids.length; i++) {
    var el = kids[i];
    if (el.parentElement !== main) continue;
    if (el.tagName === 'H2') { section = el.textContent.trim(); sub = ''; if (!firstH2) firstH2 = el; }
    var iid = el.tagName === 'H3' ? el.querySelector('.iid') : null;
    if (el.tagName === 'H3' && !iid) sub = el.textContent.trim();
    if (!iid) { if (firstH2 && el !== board) el.classList.add('doc-only'); continue; }
    var art = document.createElement('article');
    art.className = 'item';
    main.insertBefore(art, el);
    var n = el;
    while (n) {
      var next = n.nextElementSibling;
      if (n !== el && (n.tagName === 'H2' || n.tagName === 'H3' || n.tagName === 'HR')) break;
      art.appendChild(n);
      n = next;
    }
    var prioChip = el.querySelector('.chip.p0,.chip.p1,.chip.p2');
    var prio = prioChip ? prioChip.textContent.trim() : 'other';
    var issue = art.querySelector('.issue');
    var typeChip = issue ? issue.querySelector('.eyebrow .chip') : null;
    var where = section.replace(/\s*\(.*$/, '');
    if (sub) where += ' · ' + sub;
    var chips = el.querySelector('.chips');
    if (chips) { var w = document.createElement('span'); w.className = 'chip where'; w.textContent = where; chips.appendChild(w); }
    var it = {
      id: iid.textContent.trim(), el: art, prio: prio, idx: items.length,
      type: typeChip ? typeChip.textContent.trim() : '',
      title: (el.querySelector('.ht') || el).textContent.trim(),
      issueTitle: issue ? (issue.querySelector('.it') || {}).textContent || '' : '',
      body: issue ? issue.querySelector('.body') : null,
      where: where, visible: true
    };
    art.id = art.id || '';
    items.push(it); byId[it.id] = it;
    if (issue) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn sm copy'; b.textContent = 'Copy for GitHub'; b.setAttribute('data-copy', it.id);
      issue.querySelector('.eyebrow').appendChild(b);
    }
  }
  var origOrder = Array.prototype.slice.call(main.children);
  var navOrig = nav ? nav.innerHTML : '';

  var state = { order: 'doc', prios: { P0: true, P1: true, P2: true, other: true }, type: '', list: false };
  try { var saved = JSON.parse(localStorage.getItem('audit-board') || 'null'); if (saved && saved.prios) state = saved; } catch (e) {}
  function persist() { try { localStorage.setItem('audit-board', JSON.stringify(state)); } catch (e) {} }

  function toMd(node) {
    var out = '';
    Array.prototype.forEach.call(node.childNodes, function (c) {
      if (c.nodeType === 3) { out += c.nodeValue; return; }
      if (c.nodeType !== 1) return;
      var t = c.tagName;
      if (t === 'CODE') out += '`' + c.textContent + '`';
      else if (t === 'STRONG' || t === 'B') out += '**' + toMd(c) + '**';
      else if (t === 'EM' || t === 'I') out += '_' + toMd(c) + '_';
      else if (t === 'A') { var h = c.getAttribute('href') || ''; out += toMd(c) + (h && h.charAt(0) !== '#' ? ' (' + h + ')' : ''); }
      else if (t === 'BR') out += '\n';
      else if (t === 'P') out += toMd(c).trim() + '\n\n';
      else if (t === 'UL' || t === 'OL') { Array.prototype.forEach.call(c.children, function (li, k) { out += (t === 'OL' ? (k + 1) + '. ' : '- ') + toMd(li).trim() + '\n'; }); out += '\n'; }
      else out += toMd(c);
    });
    return out;
  }
  function itemMd(it) {
    var md = '## ' + it.issueTitle.trim() + '\n\n' + (it.body ? toMd(it.body).trim() : '') + '\n\n';
    md += 'Priority: ' + it.prio + (it.type ? ' · Type: ' + it.type : '') + ' · Audit item: ' + it.id + ' (runtime docs audit)\n';
    return md;
  }
  function copyText(text, btn) {
    var done = function () { if (!btn) return; var old = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 1500); };
    var fallback = function () {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { if (btn) btn.textContent = 'Copy failed'; }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  function visibleSorted() {
    return items.filter(function (it) { return it.visible; }).sort(function (a, b) { return ORDER[a.prio] - ORDER[b.prio] || a.idx - b.idx; });
  }
  function applyFilter() {
    var counts = { P0: 0, P1: 0, P2: 0, other: 0 }, shown = 0;
    items.forEach(function (it) {
      counts[it.prio]++;
      var show = !!state.prios[it.prio] && (!state.type || it.type === state.type);
      it.visible = show; it.el.hidden = !show; if (show) shown++;
    });
    Object.keys(counts).forEach(function (k) { var c = board.querySelector('[data-cnt="' + k + '"]'); if (c) c.textContent = counts[k]; });
    var withIssue = items.filter(function (it) { return it.visible && it.body; }).length;
    document.getElementById('boardCount').textContent = withIssue + ' proposal' + (withIssue === 1 ? '' : 's') + ' shown';
    main.querySelectorAll('h2.prio-group').forEach(function (h) {
      var k = h.getAttribute('data-prio'); var n = items.filter(function (it) { return it.prio === k && it.visible; }).length;
      h.querySelector('small').textContent = n + ' of ' + counts[k] + ' · ' + MEANING[k]; h.hidden = n === 0;
    });
    renderNav(); renderList();
  }
  function applyOrder() {
    var prio = state.order === 'prio';
    document.body.classList.toggle('mode-prio', prio);
    board.querySelectorAll('.seg button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-order') === state.order); });
    main.querySelectorAll('h2.prio-group').forEach(function (h) { h.remove(); });
    if (prio) {
      var sorted = items.slice().sort(function (a, b) { return ORDER[a.prio] - ORDER[b.prio] || a.idx - b.idx; });
      var last = null;
      sorted.forEach(function (it) {
        if (it.prio !== last) {
          var h = document.createElement('h2'); h.className = 'prio-group'; h.id = 'prio-' + it.prio; h.setAttribute('data-prio', it.prio);
          h.innerHTML = '<span class="' + CHIP[it.prio] + '">' + LABEL[it.prio] + '</span><small></small>';
          main.appendChild(h); last = it.prio;
        }
        main.appendChild(it.el);
      });
    } else {
      origOrder.forEach(function (e) { main.appendChild(e); });
    }
    applyFilter();
  }
  function renderNav() {
    if (!nav) return;
    if (state.order === 'prio') {
      var html = '', last = null;
      visibleSorted().forEach(function (it) {
        if (it.prio !== last) { html += '<li class="l2"><a href="#prio-' + it.prio + '">' + LABEL[it.prio] + '</a></li>'; last = it.prio; }
        html += '<li class="l3"><a href="#' + it.id + '">' + it.id + ' ' + escapeHtml(it.title) + '</a></li>';
      });
      nav.innerHTML = html;
    } else {
      nav.innerHTML = navOrig;
      nav.querySelectorAll('li.l3 a').forEach(function (a) { var it = byId[(a.getAttribute('href') || '').slice(1)]; if (it) a.parentElement.hidden = !it.visible; });
    }
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderList() {
    var wrap = document.getElementById('ticketList'), rows = document.getElementById('ticketRows'), toggle = document.getElementById('listToggle');
    wrap.hidden = !state.list; toggle.textContent = state.list ? 'Hide ticket list' : 'Show ticket list';
    if (!state.list) return;
    var html = '';
    visibleSorted().forEach(function (it) {
      if (!it.body) return;
      html += '<tr><td><span class="' + CHIP[it.prio] + '">' + it.prio + '</span></td><td><a href="#' + it.id + '">' + it.id + '</a></td><td><span class="chip">' + escapeHtml(it.type) + '</span></td><td>' + escapeHtml(it.issueTitle) + '</td><td><button type="button" class="btn sm" data-copy="' + it.id + '">Copy</button></td></tr>';
    });
    rows.innerHTML = html || '<tr><td colspan="5">Nothing matches the filters.</td></tr>';
  }

  board.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-order')) { state.order = b.getAttribute('data-order'); persist(); applyOrder(); }
    else if (b.id === 'listToggle') { state.list = !state.list; persist(); renderList(); }
    else if (b.id === 'copyAll') { copyText(visibleSorted().filter(function (it) { return it.body; }).map(itemMd).join('\n---\n\n'), b); }
    else if (b.hasAttribute('data-copy')) { var it = byId[b.getAttribute('data-copy')]; if (it) copyText(itemMd(it), b); }
  });
  board.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.hasAttribute('data-prio')) { state.prios[t.getAttribute('data-prio')] = t.checked; persist(); applyFilter(); }
    else if (t.id === 'typeSel') { state.type = t.value; persist(); applyFilter(); }
  });
  main.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-copy]'); if (!b || board.contains(b)) return;
    var it = byId[b.getAttribute('data-copy')]; if (it) copyText(itemMd(it), b);
  });

  function setBoardHeight() { document.documentElement.style.setProperty('--board-h', board.offsetHeight + 'px'); }
  if (window.ResizeObserver) new ResizeObserver(setBoardHeight).observe(board); else setBoardHeight();
  board.querySelectorAll('[data-prio]').forEach(function (c) { c.checked = !!state.prios[c.getAttribute('data-prio')]; });
  document.getElementById('typeSel').value = state.type || '';
  applyOrder();
})();
</script>
'''

marker_css = '</style>\n<div class="wrap">'
assert html.count(marker_css) == 1
html = html.replace(marker_css, CSS + marker_css)
marker_board = '<h2 id="scode-defects-the-docs-items-depend-on">'
assert html.count(marker_board) == 1
html = html.replace(marker_board, BOARD + marker_board)
marker_end = '</body></html>'
assert html.endswith(marker_end)
html = html[:-len(marker_end)] + JS + marker_end
open(dst, 'w').write(html)
print('written', dst, len(html))
