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

export interface Meta {
  souls: number; // lifetime kills banked across all runs
}

const META_KEY = "basilisk.meta.v1";

export function loadMeta(): Meta {
  try {
    const r = JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
    return { souls: Math.max(0, r.souls | 0) };
  } catch {
    return { souls: 0 };
  }
}

export function saveMeta(m: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export interface Settings {
  muted: boolean;
  reducedMotion: boolean;
}

const SETTINGS_KEY = "basilisk.settings.v1";

export function loadSettings(): Settings {
  try {
    const r = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return { muted: !!r.muted, reducedMotion: !!r.reducedMotion };
  } catch {
    return { muted: false, reducedMotion: false };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
