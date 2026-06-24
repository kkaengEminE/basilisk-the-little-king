// Persistent best-run record via localStorage. Guarded so a missing/blocked
// storage (private mode, SSR) degrades to "no record" rather than throwing.

export interface BestRecord {
  time: number; // seconds survived
  realm: number; // furthest realm reached (1..5)
  evolution: number; // evolution stage index
  kills: number;
}

const KEY = "basilisk.best.v1";

export function loadBest(): BestRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as BestRecord;
    if (typeof r?.time === "number" && typeof r?.realm === "number") return r;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveBest(r: BestRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
}

/** A run is "better" by furthest realm, then longest time, then most kills. */
export function isBetter(a: BestRecord, b: BestRecord | null): boolean {
  if (!b) return true;
  if (a.realm !== b.realm) return a.realm > b.realm;
  if (a.time !== b.time) return a.time > b.time;
  return a.kills > b.kills;
}
