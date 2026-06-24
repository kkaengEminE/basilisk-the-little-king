// Evolution stages. The basilisk grows from an Egg into the Great Basilisk
// as it accumulates body segments (the snake-growth currency). Each stage
// bumps a few stats and enlarges the sprite + crown crest. Stage transitions
// are driven purely by `segments`, so this is fully unit-testable.

import type { PlayerStats } from "./stats";

export interface EvolutionStage {
  name: string;
  /** Minimum body-segment count to be at this stage. */
  segmentsRequired: number;
  /** Head radius multiplier vs. the base. */
  scale: number;
  /** Crest/crown prominence 0..1 (drives how regal the head looks). */
  crest: number;
  /** Stat bonuses applied on reaching the stage (additive, applied once). */
  bonus: Partial<Pick<PlayerStats, "maxHp" | "moveSpeed" | "gazeDamage" | "gazeRange">>;
  /** Flavor line shown on the evolution banner. */
  flavor: string;
}

export const EVOLUTIONS: EvolutionStage[] = [
  {
    name: "Egg",
    segmentsRequired: 0,
    scale: 0.7,
    crest: 0,
    bonus: {},
    flavor: "A speckled egg, warm with malice yet to wake.",
  },
  {
    name: "Young Basilisk",
    segmentsRequired: 6,
    scale: 0.92,
    crest: 0.25,
    bonus: { maxHp: 20, gazeDamage: 6 },
    flavor: "The little king takes its first slithering steps.",
  },
  {
    name: "Lesser King",
    segmentsRequired: 18,
    scale: 1.1,
    crest: 0.55,
    bonus: { maxHp: 40, gazeDamage: 12, gazeRange: 30 },
    flavor: "A crest of crimson rises. Lesser beasts avert their eyes.",
  },
  {
    name: "Calamity King",
    segmentsRequired: 36,
    scale: 1.32,
    crest: 0.8,
    bonus: { maxHp: 80, gazeDamage: 22, gazeRange: 50, moveSpeed: 15 },
    flavor: "Fields wither in its wake. The crown burns gold.",
  },
  {
    name: "Great Basilisk",
    segmentsRequired: 60,
    scale: 1.6,
    crest: 1,
    bonus: { maxHp: 140, gazeDamage: 40, gazeRange: 80, moveSpeed: 25 },
    flavor: "The sovereign of stone. Kingdoms are written as its grave.",
  },
];

/** Highest stage index whose segment requirement is met. */
export function stageForSegments(segments: number): number {
  let idx = 0;
  for (let i = 0; i < EVOLUTIONS.length; i++) {
    if (segments >= EVOLUTIONS[i].segmentsRequired) idx = i;
    else break;
  }
  return idx;
}

/** Apply a stage's one-time stat bonuses into the stats bundle. */
export function applyEvolutionBonus(stats: PlayerStats, stageIndex: number): void {
  const b = EVOLUTIONS[stageIndex].bonus;
  if (b.maxHp) stats.maxHp += b.maxHp;
  if (b.moveSpeed) stats.moveSpeed += b.moveSpeed;
  if (b.gazeDamage) stats.gazeDamage += b.gazeDamage;
  if (b.gazeRange) stats.gazeRange += b.gazeRange;
}
