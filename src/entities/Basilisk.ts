// The basilisk's body is a snake: the head records a trail of points and the
// body segments sample that trail at fixed arc-length spacing. Growing = more
// segments = a longer body. Sampling is pure (path in, points out) and is used
// by both rendering and tail collision.

import type { Basilisk, Segment } from "./types";

export const SEG_SPACING = 13; // world units between body segments
const PATH_POINT_MIN = 4; // min head travel before recording a new path point
const STARTING_SEGMENTS = 3;

export function createBasilisk(x: number, y: number): Basilisk {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2, // facing "up" on spawn
    path: [{ x, y }],
    segments: STARTING_SEGMENTS,
    radius: 13,
  };
}

/** Record the current head position onto the trail when it has moved enough. */
export function recordPath(b: Basilisk): void {
  const head = b.path[0];
  const dx = b.x - head.x;
  const dy = b.y - head.y;
  if (dx * dx + dy * dy >= PATH_POINT_MIN * PATH_POINT_MIN) {
    b.path.unshift({ x: b.x, y: b.y });
  }
  // Keep the trail just long enough to place every segment, plus slack.
  const maxPoints = Math.ceil(((b.segments + 2) * SEG_SPACING) / PATH_POINT_MIN) + 8;
  if (b.path.length > maxPoints) b.path.length = maxPoints;
}

/**
 * Positions of the body segments behind the head, sampled along the recorded
 * path at `spacing` intervals. Returns `b.segments` points (or fewer if the
 * trail is still short on spawn).
 */
export function bodyPositions(b: Basilisk, spacing = SEG_SPACING): Segment[] {
  const out: Segment[] = [];
  const path = b.path;
  if (path.length === 0) return out;

  let target = spacing; // arc-length of the next segment from the head
  let acc = 0;
  let prev = { x: b.x, y: b.y };

  for (let i = 0; i < path.length && out.length < b.segments; i++) {
    const cur = path[i];
    let segLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    while (segLen > 0 && acc + segLen >= target && out.length < b.segments) {
      const t = (target - acc) / segLen;
      out.push({ x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t });
      target += spacing;
    }
    acc += segLen;
    prev = cur;
  }

  // If the trail is too short (just spawned), stack remaining segments at the tail.
  while (out.length < b.segments) {
    const last = out.length > 0 ? out[out.length - 1] : { x: b.x, y: b.y };
    out.push({ x: last.x, y: last.y });
  }
  return out;
}
