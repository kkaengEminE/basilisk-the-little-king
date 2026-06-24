// Enemies. The bestiary the basilisk must survive:
//   • Rooster        — crows expanding sound-wave rings; gaze-immune.
//   • Mirror-bearer   — carries a mobile mirror that reflects the gaze.
//   • Hunter          — keeps distance and looses arrows.
//   • Knight          — armored melee; tanky, partly resists the gaze.
//   • Priest          — hangs back and heals nearby foes.
//   • Rooster-handler — hangs back and summons roosters.
// Humans are vulnerable to the Petrifying Gaze (it turns them to stone),
// except the knight's armor (gazeResist) and anything shielded by a mirror.

import type { World, Enemy } from "./types";
import { newId } from "./types";
import { angleOf, vecFromAngle, dist } from "../core/math";
import { addBurst, sfx } from "../systems/fx";
import { addWorldXp } from "../systems/leveling";
import { spawnArrow } from "../systems/projectiles";
import { COLORS } from "../render/palette";

const ROOSTER = {
  radius: 16,
  hp: 55,
  speed: 46,
  contactDamage: 10,
  xpValue: 18,
  crowInterval: 3.1,
  waveDamage: 9,
  waveSpeed: 160,
  waveMaxRadius: 185,
};

const MIRROR_BEARER = {
  radius: 14,
  hp: 70,
  speed: 40,
  contactDamage: 12,
  xpValue: 22,
  mirrorRadius: 22,
  mirrorReflect: 0.7, // softened from 0.9 — full reflect killed too fast (see docs)
};

const HUNTER = {
  radius: 13,
  hp: 28,
  speed: 72,
  contactDamage: 6,
  xpValue: 16,
  keep: 285, // preferred standoff distance
  shootInterval: 2.2,
  arrowSpeed: 250,
  arrowDamage: 11,
};

const KNIGHT = {
  radius: 16,
  hp: 120,
  speed: 62,
  contactDamage: 18,
  xpValue: 28,
  gazeResist: 0.6, // armor turns much of the stare
};

const PRIEST = {
  radius: 13,
  hp: 48,
  speed: 52,
  contactDamage: 6,
  xpValue: 22,
  keep: 230,
  healInterval: 2.4,
  healAmount: 16,
  healRadius: 170,
};

const HANDLER = {
  radius: 14,
  hp: 52,
  speed: 46,
  contactDamage: 8,
  xpValue: 24,
  keep: 250,
  summonInterval: 5.5,
  summonCap: 3, // won't summon past this many roosters total
};

const WEASEL = {
  radius: 18,
  hp: 420,
  speed: 96, // prowls; lunges much faster
  lungeSpeed: 320,
  contactDamage: 24,
  xpValue: 120,
  lungeInterval: 2.4,
  lungeTime: 0.45, // seconds of a lunge burst
};

function base(world: World, kind: Enemy["kind"], x: number, y: number): Enemy {
  return {
    id: newId(world),
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 50,
    maxHp: 50,
    speed: 50,
    attackTimer: 0,
    contactDamage: 8,
    gazeImmune: false,
    xpValue: 18,
    alive: true,
  };
}

export function spawnRooster(world: World, x: number, y: number): Enemy {
  const e = base(world, "rooster", x, y);
  Object.assign(e, {
    radius: ROOSTER.radius,
    hp: ROOSTER.hp,
    maxHp: ROOSTER.hp,
    speed: ROOSTER.speed,
    attackTimer: world.rng.range(1.2, ROOSTER.crowInterval),
    contactDamage: ROOSTER.contactDamage,
    gazeImmune: true,
    xpValue: ROOSTER.xpValue,
  });
  world.enemies.push(e);
  return e;
}

/**
 * A robed human carrying a mirror. The mirror is a hazard linked to the
 * bearer (ownerId), so the gaze reflects off it — best dealt with by poison
 * or a tail slam. Not gaze-immune: you *can* stare it down, but eat the bounce.
 */
export function spawnMirrorBearer(world: World, x: number, y: number): Enemy {
  const e = base(world, "mirrorBearer", x, y);
  Object.assign(e, {
    radius: MIRROR_BEARER.radius,
    hp: MIRROR_BEARER.hp,
    maxHp: MIRROR_BEARER.hp,
    speed: MIRROR_BEARER.speed,
    contactDamage: MIRROR_BEARER.contactDamage,
    xpValue: MIRROR_BEARER.xpValue,
  });
  world.enemies.push(e);
  world.hazards.push({
    id: newId(world),
    kind: "mirror",
    x,
    y,
    radius: MIRROR_BEARER.mirrorRadius,
    reflect: MIRROR_BEARER.mirrorReflect,
    disabledTime: 0,
    ownerId: e.id,
  });
  return e;
}

export function spawnHunter(world: World, x: number, y: number): Enemy {
  const e = base(world, "hunter", x, y);
  Object.assign(e, {
    radius: HUNTER.radius,
    hp: HUNTER.hp,
    maxHp: HUNTER.hp,
    speed: HUNTER.speed,
    attackTimer: world.rng.range(0.6, HUNTER.shootInterval),
    contactDamage: HUNTER.contactDamage,
    xpValue: HUNTER.xpValue,
  });
  world.enemies.push(e);
  return e;
}

export function spawnKnight(world: World, x: number, y: number): Enemy {
  const e = base(world, "knight", x, y);
  Object.assign(e, {
    radius: KNIGHT.radius,
    hp: KNIGHT.hp,
    maxHp: KNIGHT.hp,
    speed: KNIGHT.speed,
    contactDamage: KNIGHT.contactDamage,
    gazeResist: KNIGHT.gazeResist,
    xpValue: KNIGHT.xpValue,
  });
  world.enemies.push(e);
  return e;
}

export function spawnPriest(world: World, x: number, y: number): Enemy {
  const e = base(world, "priest", x, y);
  Object.assign(e, {
    radius: PRIEST.radius,
    hp: PRIEST.hp,
    maxHp: PRIEST.hp,
    speed: PRIEST.speed,
    attackTimer: world.rng.range(1, PRIEST.healInterval),
    contactDamage: PRIEST.contactDamage,
    xpValue: PRIEST.xpValue,
  });
  world.enemies.push(e);
  return e;
}

export function spawnRoosterHandler(world: World, x: number, y: number): Enemy {
  const e = base(world, "roosterHandler", x, y);
  Object.assign(e, {
    radius: HANDLER.radius,
    hp: HANDLER.hp,
    maxHp: HANDLER.hp,
    speed: HANDLER.speed,
    attackTimer: world.rng.range(2, HANDLER.summonInterval),
    contactDamage: HANDLER.contactDamage,
    xpValue: HANDLER.xpValue,
  });
  world.enemies.push(e);
  return e;
}

/**
 * The Weasel — the basilisk's mythological bane. A fast, tanky boss that prowls
 * and periodically lunges. Gaze-immune (the weasel is unaffected by the stare),
 * so it must be poisoned, tail-slammed, and dodged. One per stage.
 */
export function spawnWeasel(world: World, x: number, y: number): Enemy {
  const e = base(world, "weasel", x, y);
  Object.assign(e, {
    radius: WEASEL.radius,
    hp: WEASEL.hp,
    maxHp: WEASEL.hp,
    speed: WEASEL.speed,
    attackTimer: WEASEL.lungeInterval,
    contactDamage: WEASEL.contactDamage,
    gazeImmune: true,
    xpValue: WEASEL.xpValue,
  });
  world.enemies.push(e);
  world.bannerText = "THE WEASEL STIRS";
  world.bannerSub = "The basilisk's ancient bane has caught your scent.";
  world.bannerTime = 3;
  return e;
}

function crow(world: World, e: Enemy): void {
  world.waves.push({
    x: e.x,
    y: e.y,
    radius: e.radius,
    maxRadius: ROOSTER.waveMaxRadius,
    speed: ROOSTER.waveSpeed,
    damage: ROOSTER.waveDamage,
    thickness: 10,
    hasHit: false,
    alive: true,
  });
}

const countRoosters = (world: World): number =>
  world.enemies.reduce((n, e) => (e.kind === "rooster" ? n + 1 : n), 0);

/** Move an enemy toward a desired velocity, then integrate position. */
function steer(e: Enemy, wantX: number, wantY: number, dt: number, rate = 3): void {
  e.vx += (wantX - e.vx) * Math.min(1, dt * rate);
  e.vy += (wantY - e.vy) * Math.min(1, dt * rate);
  e.x += e.vx * dt;
  e.y += e.vy * dt;
}

/** Desired velocity that holds a standoff distance `keep` from the basilisk. */
function kite(e: Enemy, bx: number, by: number, d: number, keep: number, speed: number): { x: number; y: number } {
  if (d < keep * 0.85) {
    const a = angleOf({ x: e.x - bx, y: e.y - by }); // back away
    return vecFromAngle(a, speed);
  }
  if (d > keep * 1.25) {
    const a = angleOf({ x: bx - e.x, y: by - e.y }); // close in
    return vecFromAngle(a, speed * 0.9);
  }
  return { x: e.vx * 0.6, y: e.vy * 0.6 }; // hold the line
}

export function updateEnemies(world: World, dt: number): void {
  const b = world.basilisk;
  const fearR = world.stats.fearAura;
  const list = world.enemies;

  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e.hp <= 0) {
      e.alive = false;
      addWorldXp(world, e.xpValue);
      if (world.stats.lifesteal > 0) {
        world.hp = Math.min(world.stats.maxHp, world.hp + world.stats.lifesteal);
      }
      const big = e.kind === "weasel";
      addBurst(world, e.x, e.y, e.kind === "rooster" ? COLORS.vermilion : COLORS.bone, big ? 40 : 18, big ? 200 : 140, big ? 5 : 3);
      if (big) {
        world.bannerText = "The Weasel is slain";
        world.bannerSub = "The basilisk's bane lies broken.";
        world.bannerTime = 2.6;
      }
      list.splice(i, 1);
      continue;
    }

    const d = dist(e, b);
    const slow = fearR > 0 && d < fearR ? 0.5 : 1;
    const toward = vecFromAngle(angleOf({ x: b.x - e.x, y: b.y - e.y }), e.speed * slow);

    switch (e.kind) {
      case "rooster":
      case "mirrorBearer":
      case "knight": {
        // Press straight in. Knights are the heavy chargers.
        steer(e, toward.x, toward.y, dt, e.kind === "knight" ? 3.5 : 3);
        if (e.kind === "rooster") {
          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            crow(world, e);
            sfx(world, "crow");
            e.attackTimer = ROOSTER.crowInterval;
          }
        }
        break;
      }
      case "hunter": {
        const want = kite(e, b.x, b.y, d, HUNTER.keep, e.speed * slow);
        steer(e, want.x, want.y, dt, 4);
        e.attackTimer -= dt;
        if (e.attackTimer <= 0 && d <= HUNTER.keep * 1.5) {
          spawnArrow(world, e.x, e.y, b.x, b.y, HUNTER.arrowSpeed, HUNTER.arrowDamage);
          sfx(world, "arrow");
          e.attackTimer = HUNTER.shootInterval;
        }
        break;
      }
      case "priest": {
        const want = kite(e, b.x, b.y, d, PRIEST.keep, e.speed * slow);
        steer(e, want.x, want.y, dt, 3.5);
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = PRIEST.healInterval;
          let healed = false;
          for (const ally of list) {
            if (ally === e || ally.hp >= ally.maxHp) continue;
            if (dist(ally, e) <= PRIEST.healRadius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + PRIEST.healAmount);
              healed = true;
            }
          }
          if (healed) addBurst(world, e.x, e.y, COLORS.goldLight, 10, 90, 2.5);
        }
        break;
      }
      case "roosterHandler": {
        const want = kite(e, b.x, b.y, d, HANDLER.keep, e.speed * slow);
        steer(e, want.x, want.y, dt, 3);
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = HANDLER.summonInterval;
          if (countRoosters(world) < HANDLER.summonCap) {
            const a = world.rng.angle();
            const off = vecFromAngle(a, 36);
            spawnRooster(world, e.x + off.x, e.y + off.y);
            addBurst(world, e.x, e.y, COLORS.vermilion, 8, 80, 2);
            sfx(world, "summon");
          }
        }
        break;
      }
      case "weasel": {
        // Prowl, then lunge in fast bursts toward the basilisk.
        e.attackTimer -= dt;
        const lunging = e.attackTimer < WEASEL.lungeTime;
        const spd = (lunging ? WEASEL.lungeSpeed : WEASEL.speed) * slow;
        const dir = vecFromAngle(angleOf({ x: b.x - e.x, y: b.y - e.y }), spd);
        steer(e, dir.x, dir.y, dt, lunging ? 8 : 3);
        if (e.attackTimer <= 0) e.attackTimer = WEASEL.lungeInterval;
        break;
      }
    }
  }
}

/** Advance sound-wave rings and cull spent ones. */
export function updateWaves(world: World, dt: number): void {
  const list = world.waves;
  for (let i = list.length - 1; i >= 0; i--) {
    const w = list[i];
    w.radius += w.speed * dt;
    if (w.radius >= w.maxRadius) {
      w.alive = false;
      list.splice(i, 1);
    }
  }
}
