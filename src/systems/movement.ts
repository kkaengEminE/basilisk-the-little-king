// Head steering. Movement is the player's only control: the input vector sets
// a desired heading; the basilisk turns toward it at turnRate and glides at
// moveSpeed. The body trail follows automatically (see Basilisk.recordPath).

import type { Input } from "../core/Input";
import type { World } from "../entities/types";
import { recordPath } from "../entities/Basilisk";
import { angleOf, rotateToward, vecFromAngle, damp, clamp } from "../core/math";

export const WORLD_RADIUS = 1800; // soft circular arena bound

export function updateMovement(world: World, input: Input, dt: number): void {
  const b = world.basilisk;
  const mv = input.moveVector();
  const moving = mv.x !== 0 || mv.y !== 0;

  let targetSpeed = 0;
  if (moving) {
    const targetAngle = angleOf(mv);
    b.facing = rotateToward(b.facing, targetAngle, world.stats.turnRate * dt);
    targetSpeed = world.stats.moveSpeed;
  }

  const curSpeed = Math.hypot(b.vx, b.vy);
  const newSpeed = damp(curSpeed, targetSpeed, 9, dt);
  const dir = vecFromAngle(b.facing, newSpeed);
  b.vx = dir.x;
  b.vy = dir.y;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Keep the head within the arena; nudge back from the rim.
  const r = Math.hypot(b.x, b.y);
  if (r > WORLD_RADIUS) {
    const k = WORLD_RADIUS / r;
    b.x *= k;
    b.y *= k;
  }

  recordPath(b);

  // Passive regeneration.
  world.hp = clamp(world.hp + world.stats.regen * dt, 0, world.stats.maxHp);
  if (world.invuln > 0) world.invuln -= dt;
}
