// Transient visual feedback: floating text, particle bursts, screen shake.
// Pure-ish helpers that push lightweight objects onto the world's effect pools.

import type { World } from "../entities/types";

export function addText(world: World, x: number, y: number, text: string, color: string, size = 13): void {
  world.texts.push({ x, y, vy: -28, life: 0.9, maxLife: 0.9, text, color, size });
}

export function addBurst(
  world: World,
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 90,
  size = 2.5,
): void {
  const { rng } = world;
  for (let i = 0; i < count; i++) {
    const a = rng.angle();
    const s = rng.range(speed * 0.3, speed);
    world.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rng.range(0.3, 0.7),
      maxLife: 0.7,
      color,
      size: rng.range(size * 0.6, size),
    });
  }
}

export function addShake(world: World, amount: number): void {
  world.shake = Math.min(16, world.shake + amount);
}

/** Queue a sound-event tag for the audio layer to play (decoupled from sim). */
export function sfx(world: World, tag: string): void {
  // Cap the queue so a runaway frame can't balloon it.
  if (world.sounds.length < 24) world.sounds.push(tag);
}

/** Advance and cull all transient effects. */
export function updateEffects(world: World, dt: number): void {
  const texts = world.texts;
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y += t.vy * dt;
    t.vy *= 0.9;
    t.life -= dt;
    if (t.life <= 0) texts.splice(i, 1);
  }

  const ps = world.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) ps.splice(i, 1);
  }

  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 36);
  if (world.gazeFlash > 0) world.gazeFlash = Math.max(0, world.gazeFlash - dt * 4);
  if (world.tailFlash > 0) world.tailFlash = Math.max(0, world.tailFlash - dt * 2.5);
  if (world.hurtFlash > 0) world.hurtFlash = Math.max(0, world.hurtFlash - dt * 3);
  if (world.bannerTime > 0) {
    world.bannerTime -= dt;
    if (world.bannerTime <= 0) {
      world.bannerText = "";
      world.bannerSub = "";
    }
  }
}
