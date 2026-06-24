// Procedurally generates an aged-parchment background tile and renders it
// (with biome tint, stains, ink flecks and a vignette) into an offscreen
// canvas that is cached and re-blitted each frame. The world floor is this
// tile repeated; a subtle ruled-manuscript grid hints at a page.

import { createRng } from "../core/rng";
import { COLORS, withAlpha } from "./palette";

export interface ParchmentTheme {
  base: string;
  light: string;
  dark: string;
  /** Tint multiplied over the base for biome flavour. */
  tint: string;
  tintAlpha: number;
}

export const FOREST_THEME: ParchmentTheme = {
  base: COLORS.parchment,
  light: COLORS.parchmentLight,
  dark: COLORS.parchmentDark,
  tint: COLORS.verdigris,
  tintAlpha: 0.06,
};

const TILE = 512;

/** Build a seamless-ish parchment tile as an offscreen canvas. */
export function makeParchmentTile(theme: ParchmentTheme, seed = 1): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const ctx = c.getContext("2d")!;
  const rng = createRng(seed);

  // Base wash with a soft radial gradient for uneven lighting.
  ctx.fillStyle = theme.base;
  ctx.fillRect(0, 0, TILE, TILE);
  const grad = ctx.createRadialGradient(TILE * 0.4, TILE * 0.35, 40, TILE / 2, TILE / 2, TILE * 0.8);
  grad.addColorStop(0, theme.light);
  grad.addColorStop(1, theme.dark);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.globalAlpha = 1;

  // Biome tint.
  ctx.fillStyle = withAlpha(theme.tint, theme.tintAlpha);
  ctx.fillRect(0, 0, TILE, TILE);

  // Mottled stains — overlapping translucent blobs.
  for (let i = 0; i < 60; i++) {
    const x = rng.range(0, TILE);
    const y = rng.range(0, TILE);
    const r = rng.range(8, 60);
    ctx.fillStyle = withAlpha(rng.chance(0.5) ? COLORS.stain : COLORS.stainDark, rng.range(0.02, 0.07));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ink flecks / foxing specks.
  for (let i = 0; i < 220; i++) {
    const x = rng.range(0, TILE);
    const y = rng.range(0, TILE);
    ctx.fillStyle = withAlpha(COLORS.inkFaint, rng.range(0.04, 0.14));
    ctx.fillRect(x, y, rng.range(0.5, 1.8), rng.range(0.5, 1.8));
  }

  // Faint ruled lines, like a manuscript page.
  ctx.strokeStyle = withAlpha(COLORS.inkFaint, 0.05);
  ctx.lineWidth = 1;
  for (let y = 32; y < TILE; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TILE, y);
    ctx.stroke();
  }

  return c;
}

/**
 * Fill the visible viewport with the repeated parchment tile, offset by the
 * camera so it scrolls with the world. Drawn in screen space.
 */
export function drawParchmentFloor(
  ctx: CanvasRenderingContext2D,
  tile: CanvasPattern,
  camX: number,
  camY: number,
  zoom: number,
  width: number,
  height: number,
): void {
  ctx.save();
  // Translate the pattern origin so it tracks world space.
  ctx.translate(-((camX * zoom) % TILE), -((camY * zoom) % TILE));
  ctx.fillStyle = tile;
  ctx.fillRect(-TILE, -TILE, width + TILE * 2, height + TILE * 2);
  ctx.restore();
}
