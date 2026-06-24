// Camera that follows a world-space target with smooth damping and
// converts between world and screen coordinates. The renderer translates
// by the camera before drawing world entities.

import { damp, type Vec2 } from "./math";

export class Camera {
  x = 0;
  y = 0;
  /** Logical viewport size in CSS pixels (set on resize). */
  width = 0;
  height = 0;
  /** Uniform zoom; >1 zooms in. */
  zoom = 1;

  setViewport(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Smoothly track a world point so it sits at the screen centre. */
  follow(target: Vec2, dt: number, rate = 8): void {
    this.x = damp(this.x, target.x, rate, dt);
    this.y = damp(this.y, target.y, rate, dt);
  }

  /** Snap immediately (used on spawn / map transition). */
  snapTo(target: Vec2): void {
    this.x = target.x;
    this.y = target.y;
  }

  worldToScreen(wx: number, wy: number): Vec2 {
    return {
      x: (wx - this.x) * this.zoom + this.width / 2,
      y: (wy - this.y) * this.zoom + this.height / 2,
    };
  }

  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: (sx - this.width / 2) / this.zoom + this.x,
      y: (sy - this.height / 2) / this.zoom + this.y,
    };
  }

  /** Half-extents of the visible world area, plus a margin for culling. */
  viewBounds(margin = 64): { minX: number; minY: number; maxX: number; maxY: number } {
    const hw = this.width / 2 / this.zoom + margin;
    const hh = this.height / 2 / this.zoom + margin;
    return { minX: this.x - hw, minY: this.y - hh, maxX: this.x + hw, maxY: this.y + hh };
  }
}
