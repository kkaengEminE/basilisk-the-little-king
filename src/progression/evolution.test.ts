import { describe, it, expect } from "vitest";
import { EVOLUTIONS, stageForSegments, applyEvolutionBonus } from "./evolution";
import { createStats } from "./stats";

describe("stageForSegments", () => {
  it("starts at Egg", () => {
    expect(stageForSegments(0)).toBe(0);
    expect(EVOLUTIONS[0].name).toBe("Egg");
  });

  it("advances at each threshold and not before", () => {
    expect(stageForSegments(5)).toBe(0);
    expect(stageForSegments(6)).toBe(1);
    expect(stageForSegments(17)).toBe(1);
    expect(stageForSegments(18)).toBe(2);
    expect(stageForSegments(36)).toBe(3);
    expect(stageForSegments(60)).toBe(4);
  });

  it("clamps to the final stage for huge bodies", () => {
    expect(stageForSegments(99999)).toBe(EVOLUTIONS.length - 1);
  });

  it("thresholds are monotonically increasing", () => {
    for (let i = 1; i < EVOLUTIONS.length; i++) {
      expect(EVOLUTIONS[i].segmentsRequired).toBeGreaterThan(EVOLUTIONS[i - 1].segmentsRequired);
    }
  });
});

describe("applyEvolutionBonus", () => {
  it("adds the stage's stat bonuses", () => {
    const s = createStats();
    const hp0 = s.maxHp;
    const dmg0 = s.gazeDamage;
    applyEvolutionBonus(s, 1); // Young Basilisk: +20 hp, +6 dmg
    expect(s.maxHp).toBe(hp0 + 20);
    expect(s.gazeDamage).toBe(dmg0 + 6);
  });

  it("Egg grants nothing", () => {
    const s = createStats();
    const snapshot = { ...s };
    applyEvolutionBonus(s, 0);
    expect(s).toEqual(snapshot);
  });
});
