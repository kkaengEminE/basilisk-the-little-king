// Petrifying Gaze: a cone in the basilisk's facing direction. Weak prey
// (max-hp <= petrify threshold) turn instantly to stone; tougher prey take
// damage and petrify when it runs out. Roosters are gaze-immune. Fires on a
// cooldown regardless of targets (auto-attack), flashing the cone.

import type { World } from "../entities/types";
import { pointInCone } from "../core/math";
import { petrify } from "../entities/prey";
import { addBurst } from "../systems/fx";
import { COLORS } from "../render/palette";

export interface GazeResult {
  petrified: number;
  damaged: number;
  hitEnemies: number;
  /** Self-damage bounced back by mirrors/water in the cone (pre-resistance). */
  reflectedDamage: number;
}

export function fireGaze(world: World): GazeResult {
  const b = world.basilisk;
  const s = world.stats;
  const apex = { x: b.x, y: b.y };
  let petrified = 0;
  let damaged = 0;
  let hitEnemies = 0;

  const petrifyThresh = s.gazeEvolved ? Infinity : s.petrifyThreshold;
  for (const p of world.prey) {
    if (p.petrified > 0) continue;
    if (!pointInCone(p, apex, b.facing, s.gazeHalfAngle, s.gazeRange)) continue;
    if (p.maxHp <= petrifyThresh) {
      petrify(p);
      petrified++;
      addBurst(world, p.x, p.y, COLORS.petrify, 6, 60, 2);
    } else {
      p.hp -= s.gazeDamage;
      damaged++;
      if (p.hp <= 0) {
        petrify(p);
        petrified++;
        addBurst(world, p.x, p.y, COLORS.petrify, 6, 60, 2);
      }
    }
  }

  for (const e of world.enemies) {
    if (e.gazeImmune) continue;
    if (pointInCone(e, apex, b.facing, s.gazeHalfAngle, s.gazeRange)) {
      e.hp -= s.gazeDamage * (1 - (e.gazeResist ?? 0)); // knight armor turns the stare
      hitEnemies++;
    }
  }

  // Mirrors & water in the cone bounce the gaze back as self-damage. Tail
  // Slam can muddy/cover them (disabledTime > 0) to neutralise this.
  let reflectedDamage = 0;
  for (const h of world.hazards) {
    if (h.disabledTime > 0) continue;
    if (pointInCone(h, apex, b.facing, s.gazeHalfAngle, s.gazeRange)) {
      reflectedDamage += s.gazeDamage * h.reflect;
    }
  }

  world.gazeTimer = s.gazeCooldown;
  world.gazeFlash = 1;
  return { petrified, damaged, hitEnemies, reflectedDamage };
}
