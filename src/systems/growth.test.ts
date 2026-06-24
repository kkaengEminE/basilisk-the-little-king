import { describe, it, expect } from "vitest";
import { consumePrey, MAX_SEGMENTS } from "./growth";
import { makeWorld, makePrey } from "../testkit";

describe("consumePrey", () => {
  it("marks prey dead, grows the body, and counts the kill", () => {
    const w = makeWorld();
    const p = makePrey({ growth: 2, xpValue: 2 });
    const r = consumePrey(w, p);
    expect(p.alive).toBe(false);
    expect(w.kills).toBe(1);
    expect(w.basilisk.segments).toBe(5); // started at 3
    expect(r.segmentsAdded).toBe(2);
    expect(r.xpGained).toBe(2);
  });

  it("awards bonus growth for petrified prey", () => {
    const w = makeWorld();
    const r = consumePrey(w, makePrey({ growth: 1, petrified: 0.5 }));
    expect(r.segmentsAdded).toBe(2); // 1 + petrify bonus
  });

  it("caps the body at MAX_SEGMENTS", () => {
    const w = makeWorld();
    w.basilisk.segments = MAX_SEGMENTS - 1;
    const r = consumePrey(w, makePrey({ growth: 5 }));
    expect(w.basilisk.segments).toBe(MAX_SEGMENTS);
    expect(r.segmentsAdded).toBe(1);
  });

  it("reports an evolution when crossing a segment threshold", () => {
    const w = makeWorld();
    w.basilisk.segments = 5; // Young Basilisk needs 6
    const r = consumePrey(w, makePrey({ growth: 1 }));
    expect(r.evolvedTo).toBe(1);
  });

  it("reports no evolution when staying within a stage", () => {
    const w = makeWorld();
    w.basilisk.segments = 3;
    const r = consumePrey(w, makePrey({ growth: 1 }));
    expect(r.evolvedTo).toBe(-1);
  });
});
