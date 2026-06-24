// Small, dependency-free math toolkit shared across simulation systems.
// Everything here is pure so it can be unit-tested in isolation.

export const TAU = Math.PI * 2;

export interface Vec2 {
  x: number;
  y: number;
}

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const lenSq = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);

export const distSq = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
export const dist = (a: Vec2, b: Vec2): number => Math.sqrt(distSq(a, b));

export function normalize(a: Vec2): Vec2 {
  const l = len(a);
  if (l === 0) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Linear interpolation toward a target, framerate-independent-ish smoothing. */
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

export const angleOf = (v: Vec2): number => Math.atan2(v.y, v.x);

export const vecFromAngle = (angle: number, mag = 1): Vec2 => ({
  x: Math.cos(angle) * mag,
  y: Math.sin(angle) * mag,
});

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDiff(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d < -Math.PI) d += TAU;
  if (d > Math.PI) d -= TAU;
  return d;
}

/** Rotate `from` toward `to` by at most `maxStep` radians. */
export function rotateToward(from: number, to: number, maxStep: number): number {
  const d = angleDiff(from, to);
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}

/**
 * Is `point` inside the circular sector (cone) whose apex is at `apex`,
 * centred on `dirAngle`, spanning `halfAngle` to each side, out to `range`?
 * Used by the Petrifying Gaze hit test.
 */
export function pointInCone(
  point: Vec2,
  apex: Vec2,
  dirAngle: number,
  halfAngle: number,
  range: number,
): boolean {
  const dx = point.x - apex.x;
  const dy = point.y - apex.y;
  const dSq = dx * dx + dy * dy;
  if (dSq > range * range) return false;
  if (dSq === 0) return true;
  const a = Math.atan2(dy, dx);
  return Math.abs(angleDiff(dirAngle, a)) <= halfAngle;
}

/** Circle vs circle overlap test (cheap, squared-distance based). */
export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}
