// Shared data model. Entities are plain objects (no classes / no inheritance)
// so systems can iterate them cheaply and tests can construct them by hand.

import type { Rng } from "../core/rng";
import type { PlayerStats } from "../progression/stats";

export interface Segment {
  x: number;
  y: number;
}

/** The player. Head kinematics + a recorded trail the body samples (snake). */
export interface Basilisk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number; // radians; aim direction for gaze/poison
  /** Recorded head path, newest first; body segments sample this by arc length. */
  path: Segment[];
  /** Number of body segments — grows by eating. Drives "length = power". */
  segments: number;
  radius: number; // head radius (scales with evolution)
}

export type PreyKind = "mouse" | "rabbit" | "frog" | "boar";

export interface Prey {
  id: number;
  kind: PreyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  xpValue: number;
  growth: number; // segments gained when eaten
  wanderAngle: number;
  /** >0 while petrified (stone, immobile); shatters to dead at 0. */
  petrified: number;
  alive: boolean;
}

export type EnemyKind =
  | "rooster"
  | "mirrorBearer"
  | "hunter" // ranged: fires arrows, keeps distance
  | "knight" // armored melee: tanky, partial gaze resistance
  | "priest" // support: heals nearby enemies
  | "roosterHandler"; // summons roosters

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackTimer: number; // generic cadence: crow / shoot / heal / summon
  contactDamage: number;
  gazeImmune: boolean; // fully immune to the Petrifying Gaze (roosters)
  gazeResist?: number; // 0..1 partial gaze mitigation (knights' armor)
  xpValue: number;
  alive: boolean;
}

/** A flying projectile — currently the hunter's arrow. Damages on contact. */
export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number; // seconds before it expires
  alive: boolean;
}

/**
 * Reflective ground/feature hazards. The Petrifying Gaze bounces off them
 * back at the basilisk (self-damage). Water is a weaker mirror. Tail Slam
 * muddies water / covers mirrors, setting `disabledTime > 0` to suppress
 * reflection. A mirror carried by a mirror-bearer tracks its owner.
 */
export type HazardKind = "mirror" | "water";

export interface Hazard {
  id: number;
  kind: HazardKind;
  x: number;
  y: number;
  radius: number;
  reflect: number; // 0..1 fraction of gaze damage reflected back
  disabledTime: number; // >0 = muddied/covered → no reflection
  ownerId?: number; // if set, follows the enemy with this id (mobile mirror)
}

/** Expanding ring emitted by a crowing rooster — the signature hazard. */
export interface SoundWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  damage: number;
  thickness: number;
  hasHit: boolean; // damages the basilisk at most once as it passes
  alive: boolean;
}

/** Lingering poison field left by Poison Breath; deals DPS to overlapping foes. */
export interface PoisonCloud {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  dps: number;
  alive: boolean;
}

export interface FloatText {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/** The whole simulation state for one run. Systems read/mutate this. */
export interface World {
  rng: Rng;
  basilisk: Basilisk;
  stats: PlayerStats;

  prey: Prey[];
  enemies: Enemy[];
  waves: SoundWave[];
  clouds: PoisonCloud[];
  hazards: Hazard[];
  projectiles: Projectile[];
  texts: FloatText[];
  particles: Particle[];

  hp: number;
  invuln: number; // i-frames after taking damage (s)

  time: number; // elapsed run time (s)
  kills: number;
  level: number;
  xp: number;
  xpToNext: number;
  evolution: number; // index into EVOLUTIONS
  /** Number of pending level-up choices the player still owes. */
  pendingLevels: number;
  /** Stacks taken per upgrade id (gates availability + caps). */
  upgrades: Record<string, number>

  // weapon cooldown timers
  gazeTimer: number;
  poisonTimer: number;
  tailTimer: number;
  // transient visual feedback
  shake: number;
  gazeFlash: number; // brief render flash after a gaze fires
  tailFlash: number; // 0..1 expanding shock ring after a tail slam
  hurtFlash: number; // 0..1 red screen flash when the basilisk is hit
  /** Sound-event tags pushed by systems this tick; drained by the audio layer. */
  sounds: string[];
  bannerText: string; // big centered announcement (e.g. evolution); "" = none
  bannerSub: string;
  bannerTime: number; // seconds remaining on the banner

  // map / stage
  mapIndex: number;
  mapTime: number; // time elapsed within current stage
  mapDuration: number; // survive this long to clear the stage

  nextId: number;
}

export const newId = (world: World): number => world.nextId++;
