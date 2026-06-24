// Meta-progression: "souls" (lifetime kills banked across runs) permanently
// unlock small starting bonuses at milestones. Pure functions over a soul
// count, so the unlock ladder and its application are easy to test.

import type { PlayerStats } from "./stats";

export interface MetaUnlock {
  souls: number; // soul threshold to unlock
  name: string;
  desc: string;
  apply: (s: PlayerStats) => void;
}

export const META_UNLOCKS: MetaUnlock[] = [
  { souls: 80, name: "Hardy Hatchling", desc: "+20 starting max vitality", apply: (s) => (s.maxHp += 20) },
  { souls: 200, name: "Quick Blood", desc: "+0.6 starting regeneration", apply: (s) => (s.regen += 0.6) },
  { souls: 400, name: "Swift Coils", desc: "+8% starting movement speed", apply: (s) => (s.moveSpeed *= 1.08) },
  { souls: 700, name: "Venomous Birth", desc: "Start with Poison Breath", apply: (s) => (s.poisonEnabled = true) },
  { souls: 1100, name: "Wider Maw", desc: "+40 starting prey-attraction", apply: (s) => (s.magnet += 40) },
];

/** Apply every unlock the soul count has earned. Returns the ones applied. */
export function applyMeta(stats: PlayerStats, souls: number): MetaUnlock[] {
  const earned = META_UNLOCKS.filter((u) => souls >= u.souls);
  for (const u of earned) u.apply(stats);
  return earned;
}

/** The next unlock not yet earned, or null if all are unlocked. */
export function nextUnlock(souls: number): MetaUnlock | null {
  return META_UNLOCKS.find((u) => souls < u.souls) ?? null;
}

export const unlockedCount = (souls: number): number =>
  META_UNLOCKS.reduce((n, u) => (souls >= u.souls ? n + 1 : n), 0);
