import { describe, it, expect } from "vitest";
import { offerUpgrades, takeUpgrade, getUpgrade, isAvailable, UPGRADES } from "./upgrades";
import { createStats } from "./stats";
import { createRng } from "../core/rng";

describe("upgrade catalog", () => {
  it("has unique ids", () => {
    const ids = new Set(UPGRADES.map((u) => u.id));
    expect(ids.size).toBe(UPGRADES.length);
  });
});

describe("offerUpgrades", () => {
  it("offers 3 distinct available upgrades", () => {
    const rng = createRng(123);
    const stats = createStats();
    const offer = offerUpgrades(rng, stats, {}, 3);
    expect(offer).toHaveLength(3);
    const ids = offer.map((u) => u.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("never offers poison sub-upgrades before Poison Breath is unlocked", () => {
    const rng = createRng(7);
    const stats = createStats(); // poisonEnabled = false
    for (let i = 0; i < 50; i++) {
      const offer = offerUpgrades(rng, stats, {}, 3);
      for (const u of offer) {
        expect(["poison_power", "poison_width", "poison_duration"]).not.toContain(u.id);
      }
    }
  });

  it("stops offering poison_unlock once taken", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const unlock = getUpgrade("poison_unlock")!;
    takeUpgrade(unlock, stats, owned);
    expect(stats.poisonEnabled).toBe(true);
    expect(isAvailable(unlock, stats, owned)).toBe(false);
  });

  it("never offers tail sub-upgrades before Tail Slam is unlocked", () => {
    const rng = createRng(11);
    const stats = createStats(); // tailEnabled = false
    for (let i = 0; i < 50; i++) {
      for (const u of offerUpgrades(rng, stats, {}, 3)) {
        expect(["tail_radius", "tail_power", "tail_cooldown"]).not.toContain(u.id);
      }
    }
  });

  it("gates tail sub-upgrades behind tail_unlock", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    expect(isAvailable(getUpgrade("tail_radius")!, stats, owned)).toBe(false);
    takeUpgrade(getUpgrade("tail_unlock")!, stats, owned);
    expect(stats.tailEnabled).toBe(true);
    expect(isAvailable(getUpgrade("tail_radius")!, stats, owned)).toBe(true);
    expect(isAvailable(getUpgrade("tail_unlock")!, stats, owned)).toBe(false);
  });

  it("respects stack caps", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const u = getUpgrade("reflect_resist")!;
    for (let i = 0; i < u.max; i++) takeUpgrade(u, stats, owned);
    expect(isAvailable(u, stats, owned)).toBe(false);
    expect(stats.reflectResist).toBeCloseTo(0.8); // capped
  });
});

describe("weapon evolutions", () => {
  it("offers gaze evolution only after gaze_power is fully maxed", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const evo = getUpgrade("gaze_evo")!;
    const power = getUpgrade("gaze_power")!;
    expect(isAvailable(evo, stats, owned)).toBe(false);
    for (let i = 0; i < power.max; i++) takeUpgrade(power, stats, owned);
    expect(isAvailable(evo, stats, owned)).toBe(true);
  });

  it("gaze evolution makes the gaze petrify anything and is one-shot", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const evo = getUpgrade("gaze_evo")!;
    takeUpgrade(evo, stats, owned);
    expect(stats.gazeEvolved).toBe(true);
    expect(isAvailable(evo, stats, owned)).toBe(false); // max 1
  });

  it("poison evolution requires poison unlocked AND poison_power maxed", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const evo = getUpgrade("poison_evo")!;
    const power = getUpgrade("poison_power")!;
    // Maxing power is impossible before unlock (it's gated), so unlock first.
    takeUpgrade(getUpgrade("poison_unlock")!, stats, owned);
    for (let i = 0; i < power.max; i++) takeUpgrade(power, stats, owned);
    expect(isAvailable(evo, stats, owned)).toBe(true);
  });
});

describe("new defensive upgrades", () => {
  it("Stone Skin stacks armor and caps at 0.6", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const u = getUpgrade("armor")!;
    for (let i = 0; i < u.max; i++) takeUpgrade(u, stats, owned);
    expect(stats.armor).toBeCloseTo(Math.min(0.6, 0.12 * u.max));
    expect(stats.armor).toBeLessThanOrEqual(0.6);
  });

  it("Carrion Feast raises lifesteal", () => {
    const stats = createStats();
    expect(stats.lifesteal).toBe(0);
    takeUpgrade(getUpgrade("lifesteal")!, stats, {});
    expect(stats.lifesteal).toBe(4);
  });
});

describe("takeUpgrade", () => {
  it("applies effects and increments the owned count", () => {
    const stats = createStats();
    const owned: Record<string, number> = {};
    const speed0 = stats.moveSpeed;
    const u = getUpgrade("move_speed")!;
    takeUpgrade(u, stats, owned);
    expect(stats.moveSpeed).toBeGreaterThan(speed0);
    expect(owned["move_speed"]).toBe(1);
  });
});
