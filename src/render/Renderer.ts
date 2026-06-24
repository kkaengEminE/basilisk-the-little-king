// Owns the canvas + 2D context, device-pixel-ratio scaling, and the frame
// scaffold: clear → parchment floor → world-space transform → (caller draws
// entities) → screen-space UI → vignette. Keeps all canvas/DPR concerns in
// one place so simulation code never touches the rendering context.

import type { Camera } from "../core/Camera";
import { COLORS, withAlpha } from "./palette";
import { makeParchmentTile, drawParchmentFloor, type ParchmentTheme, FOREST_THEME } from "./parchment";

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  /** Logical (CSS pixel) viewport size. */
  width = 0;
  height = 0;
  private dpr = 1;
  private pattern: CanvasPattern | null = null;
  private theme: ParchmentTheme = FOREST_THEME;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.setTheme(FOREST_THEME, 1);
    this.resize();
  }

  setTheme(theme: ParchmentTheme, seed: number): void {
    this.theme = theme;
    const tile = makeParchmentTile(theme, seed);
    this.pattern = this.ctx.createPattern(tile, "repeat");
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  /** Reset transform to logical pixels and paint the parchment floor. */
  beginFrame(camera: Camera): void {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (this.pattern) {
      drawParchmentFloor(ctx, this.pattern, camera.x, camera.y, camera.zoom, this.width, this.height);
    } else {
      ctx.fillStyle = this.theme.base;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /** Enter world space: subsequent draws use world coordinates. */
  beginWorld(camera: Camera, shakeX = 0, shakeY = 0): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.width / 2 + shakeX, this.height / 2 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  endWorld(): void {
    this.ctx.restore();
  }

  /** Screen-space overlay drawn after the world: a soft page vignette. */
  drawVignette(): void {
    const { ctx, width, height } = this;
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    g.addColorStop(0, withAlpha(COLORS.ink, 0));
    g.addColorStop(1, withAlpha(COLORS.ink, 0.42));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}
