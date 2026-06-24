// Shared fixtures for unit tests: a fully-populated World and entity builders.
// Not imported by the game bundle (test-only), so it does not ship.

import { createStats } from "./progression/stats";
import { createRng } from "./core/rng";
import { xpForLevel } from "./systems/leveling";
import type { World, Prey, Enemy, Hazard, Projectile } from "./entities/types";

export function makeWorld(over: Partial<World> = {}): World {
  const stats = createStats();
  return {
    rng: createRng(1),
    basilisk: { x: 0, y: 0, vx: 0, vy: 0, facing: 0, path: [{ x: 0, y: 0 }], segments: 3, radius: 13 },
    stats,
    prey: [],
    enemies: [],
    waves: [],
    clouds: [],
    hazards: [],
    projectiles: [],
    texts: [],
    particles: [],
    hp: stats.maxHp,
    invuln: 0,
    time: 0,
    kills: 0,
    level: 1,
    xp: 0,
    xpToNext: xpForLevel(1),
    evolution: 0,
    pendingLevels: 0,
    upgrades: {},
    gazeTimer: 0,
    poisonTimer: 0,
    tailTimer: 0,
    shake: 0,
    gazeFlash: 0,
    tailFlash: 0,
    hurtFlash: 0,
    sounds: [],
    bannerText: "",
    bannerSub: "",
    bannerTime: 0,
    mapIndex: 0,
    mapTime: 0,
    mapDuration: 120,
    nextId: 1,
    ...over,
  };
}

export function makePrey(over: Partial<Prey> = {}): Prey {
  return {
    id: 1,
    kind: "mouse",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 6,
    hp: 5,
    maxHp: 5,
    speed: 40,
    xpValue: 3,
    growth: 1,
    wanderAngle: 0,
    petrified: 0,
    alive: true,
    ...over,
  };
}

export function makeEnemy(over: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    kind: "rooster",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 16,
    hp: 55,
    maxHp: 55,
    speed: 50,
    attackTimer: 1,
    contactDamage: 16,
    gazeImmune: true,
    xpValue: 18,
    alive: true,
    ...over,
  };
}

export function makeHazard(over: Partial<Hazard> = {}): Hazard {
  return {
    id: 1,
    kind: "mirror",
    x: 0,
    y: 0,
    radius: 18,
    reflect: 0.9,
    disabledTime: 0,
    ...over,
  };
}

export function makeProjectile(over: Partial<Projectile> = {}): Projectile {
  return {
    id: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 5,
    damage: 10,
    life: 3,
    alive: true,
    ...over,
  };
}
