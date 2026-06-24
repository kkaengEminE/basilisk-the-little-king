import { describe, it, expect } from "vitest";
import {
  vec,
  add,
  sub,
  scale,
  len,
  dist,
  normalize,
  clamp,
  lerp,
  angleDiff,
  rotateToward,
  vecFromAngle,
  pointInCone,
  circlesOverlap,
  TAU,
} from "./math";

describe("vector ops", () => {
  it("adds, subtracts, scales", () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual({ x: 4, y: 6 });
    expect(sub(vec(3, 4), vec(1, 2))).toEqual({ x: 2, y: 2 });
    expect(scale(vec(2, -3), 2)).toEqual({ x: 4, y: -6 });
  });

  it("computes length and distance", () => {
    expect(len(vec(3, 4))).toBe(5);
    expect(dist(vec(0, 0), vec(0, 5))).toBe(5);
  });

  it("normalizes, and handles the zero vector safely", () => {
    const n = normalize(vec(0, 10));
    expect(n.x).toBeCloseTo(0);
    expect(n.y).toBeCloseTo(1);
    expect(normalize(vec(0, 0))).toEqual({ x: 0, y: 0 });
  });
});

describe("scalar helpers", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it("lerps", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0)).toBe(10);
  });
});

describe("angles", () => {
  it("returns smallest signed difference and wraps", () => {
    expect(angleDiff(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    // 350deg vs 10deg should be a +20deg step, not -340.
    const a = (350 / 180) * Math.PI;
    const b = (10 / 180) * Math.PI;
    expect(angleDiff(a, b)).toBeCloseTo((20 / 180) * Math.PI);
  });

  it("rotateToward clamps step and snaps when within range", () => {
    expect(rotateToward(0, Math.PI, 0.1)).toBeCloseTo(0.1);
    expect(rotateToward(0, 0.05, 0.1)).toBeCloseTo(0.05);
  });

  it("vecFromAngle round-trips magnitude", () => {
    const v = vecFromAngle(TAU / 8, 10);
    expect(len(v)).toBeCloseTo(10);
  });
});

describe("pointInCone (Petrifying Gaze)", () => {
  const apex = vec(0, 0);
  it("includes points dead ahead within range", () => {
    expect(pointInCone(vec(5, 0), apex, 0, Math.PI / 6, 10)).toBe(true);
  });
  it("excludes points beyond range", () => {
    expect(pointInCone(vec(50, 0), apex, 0, Math.PI / 6, 10)).toBe(false);
  });
  it("excludes points outside the angular spread", () => {
    // straight up (90deg) when facing right with a 30deg half-angle
    expect(pointInCone(vec(0, 5), apex, 0, Math.PI / 6, 10)).toBe(false);
  });
  it("includes a point at the cone edge", () => {
    const edge = vecFromAngle(Math.PI / 6, 5);
    expect(pointInCone(edge, apex, 0, Math.PI / 6 + 1e-6, 10)).toBe(true);
  });
});

describe("circlesOverlap", () => {
  it("detects overlap and separation", () => {
    expect(circlesOverlap(0, 0, 5, 8, 0, 5)).toBe(true);
    expect(circlesOverlap(0, 0, 5, 20, 0, 5)).toBe(false);
  });
});
