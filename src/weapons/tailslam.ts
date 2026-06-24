// Tail Slam: a radial shockwave around the basilisk. Damages and knocks back
// enemies (and shoves prey), and — crucially — muddies water and covers
// mirrors within range, suppressing their gaze reflection for a while. Also
// houses hazard upkeep (disable timers + mobile-mirror tracking).

import type { World } from "../entities/types";
import { circlesOverlap, angleOf, vecFromAngle } from "../core/math";
import { addBurst, addShake } from "../systems/fx";
import { COLORS } from "../render/palette";

const MUDDY_DURATION = 6; // seconds water stays muddied (no reflection)
const COVER_DURATION = 5; // seconds a mirror stays covered

export function fireTailSlam(world: World): void {
  const b = world.basilisk;
  const s = world.stats;
  const R = s.tailRadius;

  // Damage + knock back enemies in range.
  for (const e of world.enemies) {
    if (circlesOverlap(b.x, b.y, R, e.x, e.y, e.radius)) {
      e.hp -= s.tailDamage;
      const a = angleOf({ x: e.x - b.x, y: e.y - b.y });
      const kb = vecFromAngle(a, s.tailKnockback);
      e.vx += kb.x;
      e.vy += kb.y;
    }
  }

  // Shove non-petrified prey (no damage — they are food, not threats).
  for (const p of world.prey) {
    if (p.petrified > 0) continue;
    if (circlesOverlap(b.x, b.y, R, p.x, p.y, p.radius)) {
      const a = angleOf({ x: p.x - b.x, y: p.y - b.y });
      const kb = vecFromAngle(a, s.tailKnockback * 0.8);
      p.vx += kb.x;
      p.vy += kb.y;
    }
  }

  // Muddy water / cover mirrors in range → reflection suppressed.
  for (const h of world.hazards) {
    if (circlesOverlap(b.x, b.y, R, h.x, h.y, h.radius)) {
      const dur = h.kind === "water" ? MUDDY_DURATION : COVER_DURATION;
      h.disabledTime = Math.max(h.disabledTime, dur);
    }
  }

  world.tailFlash = 1;
  world.tailTimer = s.tailCooldown;
  addShake(world, 5);
  addBurst(world, b.x, b.y, COLORS.parchmentShadow, 14, 150, 3);
}

/** Per-tick hazard upkeep: count down disable timers, track mobile mirrors. */
export function updateHazards(world: World, dt: number): void {
  for (let i = world.hazards.length - 1; i >= 0; i--) {
    const h = world.hazards[i];
    if (h.disabledTime > 0) h.disabledTime -= dt;
    if (h.ownerId !== undefined) {
      const owner = world.enemies.find((e) => e.id === h.ownerId);
      if (!owner) {
        world.hazards.splice(i, 1); // bearer slain → mirror is gone
        continue;
      }
      h.x = owner.x;
      h.y = owner.y;
    }
  }
}
