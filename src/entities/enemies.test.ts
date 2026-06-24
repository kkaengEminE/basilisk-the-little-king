import { describe, it, expect } from "vitest";
import { spawnHunter, spawnPriest, spawnRoosterHandler, updateEnemies } from "./enemies";
import { makeWorld, makeEnemy } from "../testkit";

describe("hunter", () => {
  it("looses an arrow at the basilisk when in range and ready", () => {
    const w = makeWorld(); // basilisk at origin
    const h = spawnHunter(w, 200, 0);
    h.attackTimer = 0;
    updateEnemies(w, 0.05);
    expect(w.projectiles.length).toBeGreaterThan(0);
  });
});

describe("rooster-handler", () => {
  it("summons a rooster on its cadence", () => {
    const w = makeWorld();
    const handler = spawnRoosterHandler(w, 300, 0);
    handler.attackTimer = 0;
    updateEnemies(w, 0.05);
    expect(w.enemies.some((e) => e.kind === "rooster")).toBe(true);
  });
});

describe("priest", () => {
  it("heals a wounded nearby ally", () => {
    const w = makeWorld();
    const priest = spawnPriest(w, 250, 0);
    priest.attackTimer = 0;
    const ally = makeEnemy({ id: 77, x: 250, y: 0, hp: 10, maxHp: 55 });
    w.enemies.push(ally);
    updateEnemies(w, 0.05);
    expect(ally.hp).toBeGreaterThan(10);
  });
});

describe("enemy death", () => {
  it("grants xp and removes the enemy", () => {
    const w = makeWorld();
    w.enemies.push(makeEnemy({ hp: 0, xpValue: 18, x: 300, y: 300 }));
    const xp0 = w.xp;
    updateEnemies(w, 0.05);
    expect(w.enemies).toHaveLength(0);
    expect(w.xp).toBeGreaterThan(xp0);
  });
});
