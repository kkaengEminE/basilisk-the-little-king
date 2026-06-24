// The growth loop: eating prey extends the snake body and grants XP, which
// can trigger level-ups and (via segment count) evolution stages.

import type { World, Prey } from "../entities/types";
import { addWorldXp } from "./leveling";
import { stageForSegments } from "../progression/evolution";

export const MAX_SEGMENTS = 80;

/** Petrified prey are worth a little extra growth (reward for using the gaze). */
const PETRIFY_BONUS = 1;

export interface EatResult {
  xpGained: number;
  levelUps: number;
  segmentsAdded: number;
  /** New evolution stage index if the eat pushed past a threshold, else -1. */
  evolvedTo: number;
}

/**
 * Consume a prey: mark it dead, lengthen the body, award XP. Returns what
 * happened so the caller can fire feedback (floating text, evolution banner).
 */
export function consumePrey(world: World, prey: Prey): EatResult {
  prey.alive = false;
  world.kills += 1;

  const grow = prey.growth + (prey.petrified > 0 ? PETRIFY_BONUS : 0);
  const before = world.basilisk.segments;
  world.basilisk.segments = Math.min(MAX_SEGMENTS, before + grow);
  const segmentsAdded = world.basilisk.segments - before;

  const xpGained = prey.xpValue;
  const levelUps = addWorldXp(world, xpGained);

  const newStage = stageForSegments(world.basilisk.segments);
  const evolvedTo = newStage > world.evolution ? newStage : -1;

  return { xpGained, levelUps, segmentsAdded, evolvedTo };
}
