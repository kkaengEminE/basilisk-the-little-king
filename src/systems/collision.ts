// Resolves contact between the basilisk and the world: eating prey (the growth
// loop), taking damage from rooster sound-wave rings and direct contact, and
// announcing evolutions. Damage honours i-frames and the rooster resistance.

import type { World } from "../entities/types";
import { circlesOverlap, clamp } from "../core/math";
import { consumePrey } from "./growth";
import { addText, addBurst, addShake, sfx } from "./fx";
import { applyEvolutionBonus, EVOLUTIONS } from "../progression/evolution";
import { COLORS } from "../render/palette";

const HIT_INVULN = 0.7; // i-frames after a hit (s)

/** Apply damage to the basilisk, mitigated by a 0..1 resistance + i-frames. */
export function damageBasilisk(world: World, amount: number, resist = 0): void {
  if (world.invuln > 0) return;
  // Source-specific resistance, then the flat Stone-Skin armor on top.
  const dealt = amount * (1 - resist) * (1 - world.stats.armor);
  if (dealt <= 0) return;
  world.hp = clamp(world.hp - dealt, 0, world.stats.maxHp);
  world.invuln = HIT_INVULN;
  world.hurtFlash = 1;
  addShake(world, 6);
  addText(world, world.basilisk.x, world.basilisk.y - world.basilisk.radius, `-${Math.round(dealt)}`, COLORS.vermilion, 14);
  addBurst(world, world.basilisk.x, world.basilisk.y, COLORS.vermilionDeep, 8, 80, 2.5);
  sfx(world, "hit");
}

function evolve(world: World, stageIndex: number): void {
  world.evolution = stageIndex;
  applyEvolutionBonus(world.stats, stageIndex);
  const stage = EVOLUTIONS[stageIndex];
  world.basilisk.radius = 13 * stage.scale;
  world.hp = world.stats.maxHp; // full heal on evolution
  world.bannerText = stage.name;
  world.bannerSub = stage.flavor;
  world.bannerTime = 3.2;
  addShake(world, 10);
  addBurst(world, world.basilisk.x, world.basilisk.y, COLORS.gold, 28, 160, 4);
  world.goldFlash = 1;
  sfx(world, "evolve");
}

export function updateCollisions(world: World): void {
  const b = world.basilisk;
  const eatR = b.radius + 6 + world.stats.pickupRange;

  // — Eat prey (head overlap) —
  for (let i = world.prey.length - 1; i >= 0; i--) {
    const p = world.prey[i];
    if (circlesOverlap(b.x, b.y, eatR, p.x, p.y, p.radius)) {
      const res = consumePrey(world, p);
      world.prey.splice(i, 1);
      world.pendingLevels += res.levelUps;
      addText(world, p.x, p.y, `+${res.xpGained}`, COLORS.gold, 12);
      addBurst(world, p.x, p.y, COLORS.bone, 7, 70, 2);
      sfx(world, "eat");
      if (res.evolvedTo >= 0) evolve(world, res.evolvedTo);
    }
  }

  // — Rooster sound-wave rings (leading edge) —
  for (const w of world.waves) {
    if (w.hasHit) continue;
    const d = Math.hypot(b.x - w.x, b.y - w.y);
    // The damaging band is the ring's leading edge.
    if (d >= w.radius - w.thickness - b.radius && d <= w.radius + b.radius) {
      w.hasHit = true;
      damageBasilisk(world, w.damage, world.stats.roosterResist);
    }
  }

  // — Direct enemy contact (roosters & humans) —
  for (const e of world.enemies) {
    if (e.contactDamage > 0 && circlesOverlap(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
      const resist = e.kind === "rooster" ? world.stats.roosterResist : 0;
      damageBasilisk(world, e.contactDamage, resist);
    }
  }

  // — Hunter arrows —
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const p = world.projectiles[i];
    if (circlesOverlap(b.x, b.y, b.radius, p.x, p.y, p.radius)) {
      damageBasilisk(world, p.damage);
      world.projectiles.splice(i, 1);
    }
  }
}
