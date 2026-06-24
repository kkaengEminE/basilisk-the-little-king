// Drives the auto-firing weapons on their cooldowns, applies gaze reflection
// self-damage, ages poison clouds, and updates hazards. All player offense
// flows through here each simulation tick.

import type { World } from "../entities/types";
import { fireGaze } from "../weapons/gaze";
import { firePoison, updateClouds } from "../weapons/poison";
import { fireTailSlam, updateHazards } from "../weapons/tailslam";
import { damageBasilisk } from "./collision";
import { addText, sfx } from "./fx";
import { COLORS } from "../render/palette";

export function updateCombat(world: World, dt: number): void {
  world.gazeTimer -= dt;
  if (world.gazeTimer <= 0) {
    const res = fireGaze(world);
    if (res.petrified + res.damaged + res.hitEnemies > 0) sfx(world, "gaze");
    if (res.reflectedDamage > 0) {
      // The basilisk's own stare bounced back at it.
      damageBasilisk(world, res.reflectedDamage, world.stats.reflectResist);
      addText(
        world,
        world.basilisk.x,
        world.basilisk.y - world.basilisk.radius - 12,
        "REFLECTED!",
        COLORS.lapisLight,
        12,
      );
      sfx(world, "reflect");
    }
  }

  if (world.stats.poisonEnabled) {
    world.poisonTimer -= dt;
    if (world.poisonTimer <= 0) {
      firePoison(world);
      sfx(world, "poison");
    }
  }

  if (world.stats.tailEnabled) {
    world.tailTimer -= dt;
    if (world.tailTimer <= 0) {
      fireTailSlam(world);
      sfx(world, "tail");
    }
  }

  updateClouds(world, dt);
  updateHazards(world, dt);
}
