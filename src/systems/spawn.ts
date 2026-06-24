// Spawn director. Keeps prey near a target population and releases roosters &
// mirror-bearers on escalating cadences, spawning everything just off-screen
// in a ring around the basilisk. Also scatters static water ponds at stage
// start. Difficulty ramps with time-in-stage.

import type { World, PreyKind, EnemyKind } from "../entities/types";
import { newId } from "../entities/types";
import type { MapDef, PreyWeight, HumanKind, HumanWeight } from "../world/maps";
import { spawnPrey } from "../entities/prey";
import {
  spawnRooster,
  spawnMirrorBearer,
  spawnHunter,
  spawnKnight,
  spawnPriest,
  spawnRoosterHandler,
  spawnWeasel,
} from "../entities/enemies";
import { vecFromAngle } from "../core/math";
import { WORLD_RADIUS } from "./movement";

const HUMAN_SPAWNERS: Record<HumanKind, (w: World, x: number, y: number) => void> = {
  hunter: spawnHunter,
  knight: spawnKnight,
  priest: spawnPriest,
  roosterHandler: spawnRoosterHandler,
};

const HUMAN_KINDS: EnemyKind[] = ["hunter", "knight", "priest", "roosterHandler"];

const SPAWN_RING = 540; // distance from the head to spawn at (just past view)
const WATER_REFLECT = 0.35; // water is a weaker mirror

export interface SpawnState {
  preyTimer: number;
  roosterTimer: number;
  mirrorTimer: number;
  humanTimer: number;
  bossSpawned: boolean;
}

export function createSpawnState(): SpawnState {
  return { preyTimer: 0.5, roosterTimer: 0, mirrorTimer: 0, humanTimer: 0, bossSpawned: false };
}

function ringPoint(world: World): { x: number; y: number } {
  const b = world.basilisk;
  const a = world.rng.angle();
  const d = vecFromAngle(a, SPAWN_RING);
  let x = b.x + d.x;
  let y = b.y + d.y;
  // Keep spawns inside the arena (reflect toward centre if outside).
  const r = Math.hypot(x, y);
  if (r > WORLD_RADIUS - 30) {
    const k = (WORLD_RADIUS - 60) / r;
    x *= k;
    y *= k;
  }
  return { x, y };
}

function pickPreyKind(world: World, weights: PreyWeight[]): PreyKind {
  const total = weights.reduce((acc, w) => acc + w.weight, 0);
  let roll = world.rng.next() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.kind;
  }
  return weights[0].kind;
}

function pickHumanKind(world: World, weights: HumanWeight[]): HumanKind {
  const total = weights.reduce((acc, w) => acc + w.weight, 0);
  let roll = world.rng.next() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.kind;
  }
  return weights[0].kind;
}

const countKind = (world: World, kind: EnemyKind): number =>
  world.enemies.reduce((n, e) => (e.kind === kind ? n + 1 : n), 0);

const countHumans = (world: World): number =>
  world.enemies.reduce((n, e) => (HUMAN_KINDS.includes(e.kind) ? n + 1 : n), 0);

/** Scatter the stage's static water ponds across the arena (away from spawn). */
export function scatterWater(world: World, map: MapDef): void {
  for (let i = 0; i < map.waterCount; i++) {
    const a = world.rng.angle();
    const d = world.rng.range(260, WORLD_RADIUS - 300);
    world.hazards.push({
      id: newId(world),
      kind: "water",
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      radius: world.rng.range(34, 62),
      reflect: WATER_REFLECT,
      disabledTime: 0,
    });
  }
}

export function updateSpawning(world: World, map: MapDef, state: SpawnState, dt: number): void {
  const t = world.mapTime;

  // — Prey: maintain population up to a (slightly time-scaled) cap —
  const cap = map.preyCap + Math.floor(t / 40);
  state.preyTimer -= dt;
  if (state.preyTimer <= 0 && world.prey.length < cap) {
    state.preyTimer = map.preyInterval;
    const { x, y } = ringPoint(world);
    spawnPrey(world, pickPreyKind(world, map.preyWeights), x, y);
  }

  // — Roosters: appear after a grace period, then on an accelerating cadence —
  if (t >= map.roosterFirst) {
    const cap2 = map.roosterCapBase + Math.floor(t / 35);
    state.roosterTimer -= dt;
    if (state.roosterTimer <= 0 && countKind(world, "rooster") < cap2) {
      const every = Math.max(3.5, map.roosterEvery - t / 50);
      state.roosterTimer = every;
      const { x, y } = ringPoint(world);
      spawnRooster(world, x, y);
    }
  }

  // — Mirror-bearers: arrive mid-stage, capped (each carries a mobile mirror) —
  if (t >= map.mirrorBearerFirst) {
    state.mirrorTimer -= dt;
    if (state.mirrorTimer <= 0 && countKind(world, "mirrorBearer") < map.mirrorBearerCap) {
      state.mirrorTimer = map.mirrorBearerEvery;
      const { x, y } = ringPoint(world);
      spawnMirrorBearer(world, x, y);
    }
  }

  // — Humans: hunters, knights, priests, handlers per the biome's roster —
  if (t >= map.humanFirst && map.humanWeights.length > 0) {
    state.humanTimer -= dt;
    if (state.humanTimer <= 0 && countHumans(world) < map.humanCap) {
      state.humanTimer = map.humanEvery;
      const { x, y } = ringPoint(world);
      HUMAN_SPAWNERS[pickHumanKind(world, map.humanWeights)](world, x, y);
    }
  }

  // — Boss: the Weasel prowls in once, mid-to-late in the stage —
  if (!state.bossSpawned && t >= map.duration * 0.62) {
    state.bossSpawned = true;
    const { x, y } = ringPoint(world);
    spawnWeasel(world, x, y);
  }
}
