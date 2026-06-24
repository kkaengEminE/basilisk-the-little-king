import { describe, it, expect } from "vitest";
import { fireTailSlam, updateHazards } from "./tailslam";
import { makeWorld, makeEnemy, makeHazard } from "../testkit";

describe("fireTailSlam", () => {
  it("damages and knocks back an enemy in range", () => {
    const w = makeWorld();
    w.stats.tailEnabled = true;
    const e = makeEnemy({ x: 40, y: 0, hp: 55, vx: 0, vy: 0 });
    w.enemies.push(e);
    fireTailSlam(w);
    expect(e.hp).toBeLessThan(55);
    expect(e.vx).toBeGreaterThan(0); // pushed away (to the right of the basilisk)
  });

  it("ignores enemies outside the radius", () => {
    const w = makeWorld();
    const e = makeEnemy({ x: 9999, y: 0, hp: 55 });
    w.enemies.push(e);
    fireTailSlam(w);
    expect(e.hp).toBe(55);
  });

  it("muddies water within range (disables reflection)", () => {
    const w = makeWorld();
    const water = makeHazard({ kind: "water", x: 30, y: 0, reflect: 0.35 });
    w.hazards.push(water);
    fireTailSlam(w);
    expect(water.disabledTime).toBeGreaterThan(0);
  });

  it("covers mirrors within range", () => {
    const w = makeWorld();
    const mirror = makeHazard({ kind: "mirror", x: 30, y: 0 });
    w.hazards.push(mirror);
    fireTailSlam(w);
    expect(mirror.disabledTime).toBeGreaterThan(0);
  });

  it("leaves distant hazards untouched", () => {
    const w = makeWorld();
    const far = makeHazard({ kind: "mirror", x: 9999, y: 0 });
    w.hazards.push(far);
    fireTailSlam(w);
    expect(far.disabledTime).toBe(0);
  });

  it("sets the cooldown and shock flash", () => {
    const w = makeWorld();
    fireTailSlam(w);
    expect(w.tailTimer).toBeCloseTo(w.stats.tailCooldown);
    expect(w.tailFlash).toBe(1);
  });
});

describe("updateHazards", () => {
  it("counts down a disable timer", () => {
    const w = makeWorld();
    const h = makeHazard({ disabledTime: 1 });
    w.hazards.push(h);
    updateHazards(w, 0.5);
    expect(h.disabledTime).toBeCloseTo(0.5);
  });

  it("keeps a mobile mirror on its owner and culls it when the owner dies", () => {
    const w = makeWorld();
    const bearer = makeEnemy({ id: 42, kind: "mirrorBearer", x: 100, y: 50 });
    w.enemies.push(bearer);
    w.hazards.push(makeHazard({ kind: "mirror", x: 0, y: 0, ownerId: 42 }));
    updateHazards(w, 0.1);
    expect(w.hazards[0].x).toBe(100);
    expect(w.hazards[0].y).toBe(50);

    // Owner removed → mirror is culled.
    w.enemies.length = 0;
    updateHazards(w, 0.1);
    expect(w.hazards).toHaveLength(0);
  });
});
