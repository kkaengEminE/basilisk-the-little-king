// Level-up screen: pick one of three upgrade cards. Layout is shared between
// drawing and hit-testing so the clickable regions always match the visuals.

import type { Upgrade, UpgradeCategory } from "../../progression/upgrades";
import { COLORS, withAlpha } from "../palette";
import { panel, text, dimScreen, type Rect } from "./ui-kit";

type Ctx = CanvasRenderingContext2D;

const CARD_W = 224;
const CARD_H = 286;
const GAP = 26;

const ACCENTS: Record<UpgradeCategory, string> = {
  gaze: COLORS.gold,
  poison: COLORS.verdigris,
  tail: COLORS.vermilionDeep,
  defense: COLORS.vermilion,
  move: COLORS.lapis,
  utility: COLORS.inkSoft,
};

const CATEGORY_LABEL: Record<UpgradeCategory, string> = {
  gaze: "Petrifying Gaze",
  poison: "Poison Breath",
  tail: "Tail Slam",
  defense: "Ward",
  move: "Movement",
  utility: "Cunning",
};

export function levelUpCardRects(vw: number, vh: number, n: number): Rect[] {
  const totalW = n * CARD_W + (n - 1) * GAP;
  const startX = (vw - totalW) / 2;
  const y = vh / 2 - CARD_H / 2 + 20;
  const rects: Rect[] = [];
  for (let i = 0; i < n; i++) {
    rects.push({ x: startX + i * (CARD_W + GAP), y, w: CARD_W, h: CARD_H });
  }
  return rects;
}

export function drawLevelUp(
  ctx: Ctx,
  offers: Upgrade[],
  rects: Rect[],
  hover: number,
  vw: number,
  vh: number,
): void {
  dimScreen(ctx, vw, vh, 0.6);

  text(ctx, "THE LITTLE KING GROWS", vw / 2, vh / 2 - CARD_H / 2 - 36, {
    size: 30,
    color: COLORS.parchmentLight,
    align: "center",
    weight: "bold",
  });
  text(ctx, "Choose a boon", vw / 2, vh / 2 - CARD_H / 2 - 10, {
    size: 15,
    color: withAlpha(COLORS.parchmentLight, 0.8),
    align: "center",
  });

  offers.forEach((u, i) => {
    const r = rects[i];
    const accent = ACCENTS[u.category];
    const isHover = i === hover;
    const lift = isHover ? 6 : 0;
    const rr: Rect = { x: r.x, y: r.y - lift, w: r.w, h: r.h };
    panel(ctx, rr, { accent, fill: isHover ? COLORS.parchmentLight : COLORS.parchment });

    // Category banner.
    ctx.fillStyle = withAlpha(accent, 0.9);
    ctx.fillRect(rr.x + 10, rr.y + 14, rr.w - 20, 26);
    text(ctx, CATEGORY_LABEL[u.category].toUpperCase(), rr.x + rr.w / 2, rr.y + 32, {
      size: 12,
      color: COLORS.parchmentLight,
      align: "center",
      weight: "bold",
    });

    // Emblem circle.
    const ex = rr.x + rr.w / 2;
    const ey = rr.y + 96;
    ctx.fillStyle = withAlpha(accent, 0.18);
    ctx.beginPath();
    ctx.arc(ex, ey, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    text(ctx, glyphFor(u.category), ex, ey + 11, { size: 34, color: accent, align: "center" });

    // Name + description.
    text(ctx, u.name, rr.x + rr.w / 2, rr.y + 158, {
      size: 18,
      color: COLORS.ink,
      align: "center",
      weight: "bold",
    });
    wrapText(ctx, u.desc, rr.x + rr.w / 2, rr.y + 186, rr.w - 36, 18, {
      size: 14,
      color: COLORS.inkSoft,
    });

    // Hotkey hint.
    text(ctx, `[${i + 1}]`, rr.x + rr.w / 2, rr.y + rr.h - 18, {
      size: 14,
      color: withAlpha(accent, 0.9),
      align: "center",
      weight: "bold",
    });
  });
}

function glyphFor(c: UpgradeCategory): string {
  switch (c) {
    case "gaze":
      return "◉";
    case "poison":
      return "☣";
    case "tail":
      return "✺";
    case "defense":
      return "❦";
    case "move":
      return "➤";
    case "utility":
      return "✦";
  }
}

function wrapText(
  ctx: Ctx,
  str: string,
  cx: number,
  y: number,
  maxW: number,
  lineH: number,
  opts: { size: number; color: string },
): void {
  ctx.font = `normal ${opts.size}px "Iowan Old Style", Georgia, serif`;
  ctx.fillStyle = opts.color;
  ctx.textAlign = "center";
  const words = str.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
