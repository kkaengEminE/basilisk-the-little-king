// Projectiles — currently the hunter's arrow. Spawned aimed at a target point,
// they travel in a straight line and expire after a lifetime. Their collision
// with the basilisk is resolved in collision.ts (alongside the other hits).

import type { World } from "../entities/types";
import { newId } from "../entities/types";
import { angleOf, vecFromAngle } from "../core/math";

export function spawnArrow(
  world: World,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  speed: number,
  damage: number,
): void {
  const a = angleOf({ x: targetX - x, y: targetY - y });
  const v = vecFromAngle(a, speed);
  world.projectiles.push({
    id: newId(world),
    x,
    y,
    vx: v.x,
    vy: v.y,
    radius: 5,
    damage,
    life: 4,
    alive: true,
  });
}

/** Advance projectiles and cull expired ones (hits handled in collision.ts). */
export function updateProjectiles(world: World, dt: number): void {
  const list = world.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      p.alive = false;
      list.splice(i, 1);
    }
  }
}
