import * as Sentry from '@sentry/solidstart';

const g = globalThis as any;
g.__probeCounter = g.__probeCounter || { n: 0 };

export function idOf(scope: unknown): number | null {
  if (!scope) return null;
  const s = scope as { __probeId?: number };
  if (!s.__probeId) s.__probeId = ++g.__probeCounter.n;
  return s.__probeId;
}

export function snapshot(label: string) {
  const iso = Sentry.getIsolationScope() as any;
  const cur = Sentry.getCurrentScope() as any;
  const def = g.__probeDefaultIso;
  return {
    label,
    defaultIsoId: idOf(def),
    defaultIsoTags: def ? def.getScopeData().tags : null,
    initCurrentId: idOf(g.__probeInitCurrent),
    initCurrentTags: g.__probeInitCurrent ? g.__probeInitCurrent.getScopeData().tags : null,
    isoId: idOf(iso),
    isoTags: iso.getScopeData().tags,
    curId: idOf(cur),
    curTags: cur.getScopeData().tags,
  };
}
