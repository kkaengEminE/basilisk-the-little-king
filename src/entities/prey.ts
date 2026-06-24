// Prey: the food that drives snake growth. Each kind trades size/speed against
// XP and growth value. AI is simple: wander, flee from the basilisk, or drift
// toward it when the magnet upgrade is active. Petrified prey freeze into stone
// and shatter if not eaten in time.

import type { World, Prey, PreyKind } from "./types";
import { newId } from "./types";
import { angleOf, vecFromAngle, dist } from "../core/math";
import { addBurst } from "../systems/fx";
import { COLORS } from "../render/palette";

interface PreyTemplate {
  radius: number;
  hp: number;
  speed: number;
  xpValue: number;
  growth: number;
}

export const PREY_TEMPLATES: Record<PreyKind, PreyTemplate> = {
  mouse: { radius: 6, hp: 6, speed: 70, xpValue: 3, growth: 1 },
  rabbit: { radius: 9, hp: 12, speed: 95, xpValue: 5, growth: 1 },
  frog: { radius: 8, hp: 10, speed: 55, xpValue: 4, growth: 1 },
  boar: { radius: 15, hp: 38, speed: 48, xpValue: 12, growth: 2 },
};

const FLEE_RADIUS = 115;
const PETRIFY_DURATION = 4.5; // seconds a stone prey lingers before shattering

export function spawnPrey(world: World, kind: PreyKind, x: number, y: number): Prey {
  const t = PREY_TEMPLATES[kind];
  const prey: Prey = {
    id: newId(world),
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: t.radius,
    hp: t.hp,
    maxHp: t.hp,
    speed: t.speed,
    xpValue: t.xpValue,
    growth: t.growth,
    wanderAngle: world.rng.angle(),
    petrified: 0,
    alive: true,
  };
  world.prey.push(prey);
  return prey;
}

/** Turn a prey to stone (immobile, edible, will shatter). Used by all kills. */
export function petrify(prey: Prey): void {
  if (prey.petrified <= 0) prey.petrified = PETRIFY_DURATION;
  prey.hp = 0;
  prey.vx = 0;
  prey.vy = 0;
}

export function updatePrey(world: World, dt: number): void {
  const b = world.basilisk;
  const fearR = world.stats.fearAura;
  const magnetR = world.stats.magnet;
  const list = world.prey;

  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];

    const d = dist(p, b);

    if (p.petrified > 0) {
      p.petrified -= dt;
      if (p.petrified <= 0) {
        p.alive = false;
        addBurst(world, p.x, p.y, COLORS.petrify, 8, 70, 2.5);
      } else if (magnetR > 0 && d < magnetR) {
        // Even stone is dragged into the maw by the devouring pull.
        const a = angleOf({ x: b.x - p.x, y: b.y - p.y });
        const pull = (1 - d / magnetR) * 220;
        p.x += Math.cos(a) * pull * dt;
        p.y += Math.sin(a) * pull * dt;
      }
    } else {
      let ax: number;
      let ay: number;
      if (magnetR > 0 && d < magnetR) {
        // Drawn helplessly toward the maw (stronger the closer it gets).
        const a = angleOf({ x: b.x - p.x, y: b.y - p.y });
        const speed = Math.max(p.speed, 90) * (0.7 + (1 - d / magnetR) * 0.9);
        const v = vecFromAngle(a, speed);
        ax = v.x;
        ay = v.y;
      } else if (d < FLEE_RADIUS) {
        const a = angleOf({ x: p.x - b.x, y: p.y - b.y });
        const slow = fearR > 0 && d < fearR ? 0.45 : 1;
        const v = vecFromAngle(a, p.speed * slow);
        ax = v.x;
        ay = v.y;
      } else {
        // Idle wander.
        p.wanderAngle += world.rng.range(-1.5, 1.5) * dt;
        const v = vecFromAngle(p.wanderAngle, p.speed * 0.4);
        ax = v.x;
        ay = v.y;
      }
      p.vx += (ax - p.vx) * Math.min(1, dt * 6);
      p.vy += (ay - p.vy) * Math.min(1, dt * 6);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    if (!p.alive) list.splice(i, 1);
  }
}
