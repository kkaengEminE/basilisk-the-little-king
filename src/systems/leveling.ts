// XP curve + level-up bookkeeping. Pure with respect to a small slice of the
// World (xp/level/xpToNext), so the curve and roll-over are easy to test.

import type { World } from "../entities/types";

/** XP required to advance FROM `level` to `level + 1` (level starts at 1). */
export function xpForLevel(level: number): number {
  const l = Math.max(1, level) - 1;
  return Math.floor(8 + l * 6 + Math.pow(l, 1.55) * 2.2);
}

export interface XpSlice {
  level: number;
  xp: number;
  xpToNext: number;
  stats: { xpGain: number };
}

/**
 * Add (xpGain-scaled) XP, rolling over as many levels as the amount allows.
 * Returns the number of level-ups gained (0+). Caller queues that many
 * upgrade picks.
 */
export function addXp(state: XpSlice, amount: number): number {
  state.xp += amount * state.stats.xpGain;
  let levelUps = 0;
  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = xpForLevel(state.level);
    levelUps += 1;
  }
  return levelUps;
}

/** Convenience for the live game (World satisfies XpSlice structurally). */
export const addWorldXp = (world: World, amount: number): number => addXp(world, amount);
