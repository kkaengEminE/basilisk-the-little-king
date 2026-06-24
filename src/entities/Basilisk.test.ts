import { describe, it, expect } from "vitest";
import { createBasilisk, bodyPositions, recordPath, SEG_SPACING } from "./Basilisk";

describe("bodyPositions", () => {
  it("returns one point per segment", () => {
    const b = createBasilisk(0, 0);
    b.segments = 5;
    // Lay down a long straight trail behind the head.
    b.path = [];
    for (let i = 0; i <= 40; i++) b.path.push({ x: -i * 5, y: 0 });
    b.x = 0;
    b.y = 0;
    const body = bodyPositions(b);
    expect(body).toHaveLength(5);
  });

  it("spaces segments roughly SEG_SPACING apart along a straight trail", () => {
    const b = createBasilisk(0, 0);
    b.segments = 4;
    b.path = [];
    for (let i = 0; i <= 60; i++) b.path.push({ x: -i, y: 0 });
    const body = bodyPositions(b);
    // first segment ~SEG_SPACING behind the head along -x
    expect(Math.abs(body[0].x)).toBeCloseTo(SEG_SPACING, 0);
    const gap = Math.hypot(body[1].x - body[0].x, body[1].y - body[0].y);
    expect(gap).toBeCloseTo(SEG_SPACING, 0);
  });

  it("recordPath adds a point only after the head moves far enough", () => {
    const b = createBasilisk(0, 0);
    const n0 = b.path.length;
    b.x = 1; // tiny move
    recordPath(b);
    expect(b.path.length).toBe(n0);
    b.x = 50; // big move
    recordPath(b);
    expect(b.path.length).toBe(n0 + 1);
  });
});
