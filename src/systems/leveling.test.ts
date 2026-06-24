import { describe, it, expect } from "vitest";
import { xpForLevel, addXp, type XpSlice } from "./leveling";

const slice = (over: Partial<XpSlice> = {}): XpSlice => ({
  level: 1,
  xp: 0,
  xpToNext: xpForLevel(1),
  stats: { xpGain: 1 },
  ...over,
});

describe("xpForLevel", () => {
  it("is strictly increasing", () => {
    for (let l = 1; l < 30; l++) {
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
  });
});

describe("addXp", () => {
  it("accumulates without leveling below the threshold", () => {
    const s = slice();
    expect(addXp(s, xpForLevel(1) - 1)).toBe(0);
    expect(s.level).toBe(1);
  });

  it("levels up exactly once when the threshold is met", () => {
    const s = slice();
    const need = s.xpToNext;
    expect(addXp(s, need)).toBe(1);
    expect(s.level).toBe(2);
    expect(s.xp).toBe(0);
    expect(s.xpToNext).toBe(xpForLevel(2));
  });

  it("rolls over multiple levels from a single large gain", () => {
    const s = slice();
    const big = xpForLevel(1) + xpForLevel(2) + xpForLevel(3);
    expect(addXp(s, big)).toBe(3);
    expect(s.level).toBe(4);
  });

  it("applies the xpGain multiplier", () => {
    const s = slice({ stats: { xpGain: 2 } });
    const half = Math.ceil(s.xpToNext / 2);
    expect(addXp(s, half)).toBe(1); // doubled clears the bar
  });
});
