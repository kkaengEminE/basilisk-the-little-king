// Shared manuscript-style UI primitives: parchment panels with ink borders and
// corner flourishes, text helpers, and a labelled bar. All draw in SCREEN space.

import { COLORS, withAlpha } from "../palette";

type Ctx = CanvasRenderingContext2D;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const pointInRect = (px: number, py: number, r: Rect): boolean =>
  px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

export const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

export function panel(ctx: Ctx, r: Rect, opts: { fill?: string; accent?: string; alpha?: number } = {}): void {
  const fill = opts.fill ?? COLORS.parchmentLight;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;

  // Drop shadow.
  ctx.fillStyle = withAlpha(COLORS.ink, 0.3);
  roundRect(ctx, r.x + 4, r.y + 5, r.w, r.h, 8);
  ctx.fill();

  // Parchment body.
  ctx.fillStyle = fill;
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();

  // Double ink frame.
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(opts.accent ?? COLORS.inkSoft, 0.8);
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 5);
  ctx.stroke();

  // Corner flourishes.
  ctx.fillStyle = opts.accent ?? COLORS.gold;
  for (const [cx, cy] of [
    [r.x + 9, r.y + 9],
    [r.x + r.w - 9, r.y + 9],
    [r.x + 9, r.y + r.h - 9],
    [r.x + r.w - 9, r.y + r.h - 9],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  opts: { size?: number; color?: string; align?: CanvasTextAlign; weight?: string; baseline?: CanvasTextBaseline } = {},
): void {
  ctx.fillStyle = opts.color ?? COLORS.ink;
  ctx.font = `${opts.weight ?? "normal"} ${opts.size ?? 16}px ${SERIF}`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = opts.baseline ?? "alphabetic";
  ctx.fillText(str, x, y);
  ctx.textBaseline = "alphabetic";
}

export function bar(
  ctx: Ctx,
  r: Rect,
  ratio: number,
  fill: string,
  opts: { label?: string; back?: string } = {},
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = opts.back ?? withAlpha(COLORS.ink, 0.25);
  roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
  ctx.fill();
  if (clamped > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, r.x, r.y, r.w * clamped, r.h, r.h / 2);
    ctx.fill();
  }
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
  ctx.stroke();
  if (opts.label) {
    text(ctx, opts.label, r.x + r.w / 2, r.y + r.h - 3, {
      size: r.h - 5,
      color: COLORS.parchmentLight,
      align: "center",
      weight: "bold",
    });
  }
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Dim the whole screen (used behind modal screens). */
export function dimScreen(ctx: Ctx, w: number, h: number, alpha = 0.55): void {
  ctx.fillStyle = withAlpha(COLORS.ink, alpha);
  ctx.fillRect(0, 0, w, h);
}

/** Format seconds as M:SS. */
export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
