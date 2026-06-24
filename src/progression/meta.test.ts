import { describe, it, expect } from "vitest";
import { applyMeta, nextUnlock, unlockedCount, META_UNLOCKS } from "./meta";
import { createStats } from "./stats";

describe("meta-progression", () => {
  it("unlocks nothing with zero souls", () => {
    expect(unlockedCount(0)).toBe(0);
    expect(nextUnlock(0)).toBe(META_UNLOCKS[0]);
  });

  it("applies earned unlocks cumulatively", () => {
    const s = createStats();
    const hp0 = s.maxHp;
    const applied = applyMeta(s, 250); // first two unlocks (80, 200)
    expect(applied).toHaveLength(2);
    expect(s.maxHp).toBe(hp0 + 20); // Hardy Hatchling
    expect(s.regen).toBeGreaterThan(createStats().regen); // Quick Blood
  });

  it("nextUnlock advances as souls grow and is null when maxed", () => {
    expect(nextUnlock(100)?.souls).toBe(200);
    const beyond = META_UNLOCKS[META_UNLOCKS.length - 1].souls + 1;
    expect(nextUnlock(beyond)).toBeNull();
    expect(unlockedCount(beyond)).toBe(META_UNLOCKS.length);
  });

  it("Venomous Birth unlock starts poison enabled", () => {
    const s = createStats();
    expect(s.poisonEnabled).toBe(false);
    applyMeta(s, 700);
    expect(s.poisonEnabled).toBe(true);
  });
});
