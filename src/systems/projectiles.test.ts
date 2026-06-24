import { describe, it, expect } from "vitest";
import { spawnArrow, updateProjectiles } from "./projectiles";
import { makeWorld } from "../testkit";

describe("spawnArrow", () => {
  it("aims its velocity toward the target point", () => {
    const w = makeWorld();
    spawnArrow(w, 0, 0, 100, 0, 200, 10);
    const p = w.projectiles[0];
    expect(p.vx).toBeCloseTo(200);
    expect(Math.abs(p.vy)).toBeLessThan(1e-6);
    expect(p.damage).toBe(10);
  });
});

describe("updateProjectiles", () => {
  it("advances by velocity and expires after its lifetime", () => {
    const w = makeWorld();
    spawnArrow(w, 0, 0, 1, 0, 100, 5);
    updateProjectiles(w, 0.5);
    expect(w.projectiles[0].x).toBeCloseTo(50);

    w.projectiles[0].life = 0.1;
    updateProjectiles(w, 0.2);
    expect(w.projectiles).toHaveLength(0);
  });
});
