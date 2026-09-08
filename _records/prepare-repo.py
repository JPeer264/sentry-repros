"""One-off preparation for publishing this folder: rewrite machine-specific paths to $REPRO, $SDK and $SCRATCH."""
import os, re, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS={'node_modules','.git','_stray-from-repo','.next','.open-next','.wrangler','dist','.output','build','_fresh','.nuxt','.svelte-kit','.vinxi','.astro','.tanstack','.cache'}
BIN_EXT={'.tgz','.gz','.zip','.png','.jpg','.ico','.wasm','.node','.lockb','.woff','.woff2','.jar','.pdf'}
SCR=r'/private/tmp/claude-501/-Users-janpeer-dev-sentry-javascript/[0-9a-f-]+/scratchpad'
RULES=[
 (re.compile(SCR+r'/deep/(verify[45]-)'), r'$REPRO/refutations/\1'),
 (re.compile(SCR+r'/deep/(M-)'), r'$REPRO/cells/\1'),
 (re.compile(SCR+r'/deep/TOOLBOX\.md'), r'$REPRO/_toolbox/TOOLBOX.md'),
 (re.compile(SCR+r'/pack\b'), r'$REPRO/_toolbox/pack'),
 (re.compile(SCR+r'/qs/sink\.mjs'), r'$REPRO/_toolbox/sink.mjs'),
 (re.compile(SCR+r'/deep/([BDCNX]\d+)\b'), r'$REPRO/probes/\1'),
 (re.compile(SCR), '$SCRATCH'),
 (re.compile(r'/Users/janpeer/dev/sentry-runtime-audit-repros'), '$REPRO'),
 (re.compile(r'/Users/janpeer/dev/sentry-worktrees/[^/\s"\'`)\]]+'), '$SDK'),
 (re.compile(r'/Users/janpeer/dev/sentry-javascript'), '$SDK'),
 (re.compile(r'/Users/janpeer'), '~'),
]
changed=files=0
for dp, dns, fns in os.walk(ROOT):
    dns[:]=[d for d in dns if d not in SKIP_DIRS and not d.startswith('.next')]
    for fn in fns:
        p=os.path.join(dp,fn)
        if os.path.splitext(fn)[1].lower() in BIN_EXT or (fn.endswith('.py') and os.path.basename(dp)=='_records'): continue
        try: b=open(p,'rb').read()
        except Exception: continue
        if b'\0' in b[:8192]: continue
        try: s=b.decode('utf-8')
        except UnicodeDecodeError: continue
        files+=1; t=s
        for rx,rep in RULES: t=rx.sub(rep,t)
        if t!=s: open(p,'w').write(t); changed+=1
print('scanned',files,'rewritten',changed)
