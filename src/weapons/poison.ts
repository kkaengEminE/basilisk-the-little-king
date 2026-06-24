// Poison Breath: exhales a lingering toxic cloud ahead of the basilisk that
// deals damage-over-time to everything inside it. Unlike the gaze it harms
// roosters, making it the answer to them. Width/range/dps/duration upgrade.

import type { World } from "../entities/types";
import { vecFromAngle, circlesOverlap } from "../core/math";
import { petrify } from "../entities/prey";

export function firePoison(world: World): void {
  const s = world.stats;
  if (!s.poisonEnabled) return;
  const b = world.basilisk;
  const ahead = vecFromAngle(b.facing, s.poisonRange * 0.55);
  // Cone half-angle + range translated into a circular cloud footprint.
  const radius = Math.tan(s.poisonHalfAngle) * s.poisonRange + 18;
  world.clouds.push({
    x: b.x + ahead.x,
    y: b.y + ahead.y,
    radius,
    life: s.poisonDuration,
    maxLife: s.poisonDuration,
    dps: s.poisonDps,
    alive: true,
  });
  world.poisonTimer = s.poisonCooldown;
}

/** Apply cloud DoT to overlapping foes and age out spent clouds. */
export function updateClouds(world: World, dt: number): void {
  const clouds = world.clouds;
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    const dmg = c.dps * dt;

    for (const p of world.prey) {
      if (p.petrified > 0) continue;
      if (circlesOverlap(c.x, c.y, c.radius, p.x, p.y, p.radius)) {
        p.hp -= dmg;
        if (p.hp <= 0) petrify(p);
      }
    }
    for (const e of world.enemies) {
      if (circlesOverlap(c.x, c.y, c.radius, e.x, e.y, e.radius)) {
        e.hp -= dmg;
      }
    }

    c.life -= dt;
    if (c.life <= 0) {
      c.alive = false;
      clouds.splice(i, 1);
    }
  }
}
