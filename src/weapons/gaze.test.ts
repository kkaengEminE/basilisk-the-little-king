import { describe, it, expect } from "vitest";
import { fireGaze } from "./gaze";
import { makeWorld, makePrey, makeEnemy, makeHazard } from "../testkit";

describe("fireGaze", () => {
  it("petrifies weak prey inside the cone", () => {
    const w = makeWorld(); // facing 0 (right), gazeRange ~190
    const p = makePrey({ x: 80, y: 0, maxHp: 6 });
    w.prey.push(p);
    const r = fireGaze(w);
    expect(r.petrified).toBe(1);
    expect(p.petrified).toBeGreaterThan(0);
  });

  it("leaves prey outside the cone untouched", () => {
    const w = makeWorld();
    const behind = makePrey({ x: -80, y: 0 });
    const tooFar = makePrey({ x: 400, y: 0 });
    w.prey.push(behind, tooFar);
    const r = fireGaze(w);
    expect(r.petrified).toBe(0);
    expect(behind.petrified).toBe(0);
    expect(tooFar.petrified).toBe(0);
  });

  it("damages but does not instantly petrify tough prey", () => {
    const w = makeWorld();
    w.stats.petrifyThreshold = 10;
    w.stats.gazeDamage = 5;
    const boar = makePrey({ x: 70, y: 0, hp: 40, maxHp: 40 });
    w.prey.push(boar);
    const r = fireGaze(w);
    expect(r.damaged).toBe(1);
    expect(boar.petrified).toBe(0);
    expect(boar.hp).toBe(35);
  });

  it("does not affect gaze-immune roosters", () => {
    const w = makeWorld();
    const rooster = makeEnemy({ x: 70, y: 0, gazeImmune: true });
    w.enemies.push(rooster);
    const r = fireGaze(w);
    expect(r.hitEnemies).toBe(0);
    expect(rooster.hp).toBe(rooster.maxHp);
  });

  it("knight armor (gazeResist) reduces gaze damage", () => {
    const w = makeWorld();
    w.stats.gazeDamage = 10;
    const knight = makeEnemy({ x: 70, y: 0, kind: "knight", gazeImmune: false, gazeResist: 0.6, hp: 100, maxHp: 100 });
    w.enemies.push(knight);
    fireGaze(w);
    expect(knight.hp).toBeCloseTo(100 - 10 * 0.4); // 60% turned aside
  });

  it("resets the gaze cooldown after firing", () => {
    const w = makeWorld();
    fireGaze(w);
    expect(w.gazeTimer).toBeCloseTo(w.stats.gazeCooldown);
  });
});

describe("fireGaze — reflection off mirrors & water", () => {
  it("reflects gaze damage back from a mirror in the cone", () => {
    const w = makeWorld(); // facing right, gazeDamage 26
    w.hazards.push(makeHazard({ kind: "mirror", x: 80, y: 0, reflect: 0.9 }));
    const r = fireGaze(w);
    expect(r.reflectedDamage).toBeCloseTo(26 * 0.9);
  });

  it("water reflects strictly less than a mirror", () => {
    const mirror = makeWorld();
    mirror.hazards.push(makeHazard({ kind: "mirror", x: 80, y: 0, reflect: 0.9 }));
    const water = makeWorld();
    water.hazards.push(makeHazard({ kind: "water", x: 80, y: 0, reflect: 0.35 }));
    expect(fireGaze(water).reflectedDamage).toBeLessThan(fireGaze(mirror).reflectedDamage);
  });

  it("a muddied/covered hazard reflects nothing", () => {
    const w = makeWorld();
    w.hazards.push(makeHazard({ kind: "mirror", x: 80, y: 0, reflect: 0.9, disabledTime: 3 }));
    expect(fireGaze(w).reflectedDamage).toBe(0);
  });

  it("a hazard outside the cone reflects nothing", () => {
    const w = makeWorld();
    w.hazards.push(makeHazard({ kind: "mirror", x: -80, y: 0, reflect: 0.9 })); // behind
    expect(fireGaze(w).reflectedDamage).toBe(0);
  });
});
