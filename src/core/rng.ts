// Seeded pseudo-random generator (Mulberry32). Deterministic for a given
// seed so runs can be reproduced / replayed and tests are stable.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with probability p (0..1). */
  chance(p: number): boolean;
  /** Random element of a non-empty array. */
  pick<T>(arr: readonly T[]): T;
  /** A random unit-ish angle in [0, 2PI). */
  angle(): number;
  readonly seed: number;
}

export function createRng(seed: number): Rng {
  // Keep the running state as a 32-bit unsigned integer.
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range = (min: number, max: number): number => min + next() * (max - min);
  const int = (min: number, max: number): number => Math.floor(min + next() * (max - min + 1));
  const chance = (p: number): boolean => next() < p;
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)];
  const angle = (): number => next() * Math.PI * 2;

  return { next, range, int, chance, pick, angle, seed };
}

/** A reasonable seed when determinism is not required. */
export const randomSeed = (): number => (Math.random() * 0xffffffff) >>> 0;
