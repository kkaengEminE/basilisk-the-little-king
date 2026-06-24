// Full-screen states: title, defeat, and victory. Each is a centred parchment
// proclamation. Screen space; drawn over a dimmed or parchment backdrop.

import type { World } from "../../entities/types";
import type { BestRecord } from "../../core/storage";
import { EVOLUTIONS } from "../../progression/evolution";
import { COLORS, withAlpha } from "../palette";
import { panel, text, dimScreen, formatTime, type Rect } from "./ui-kit";

type Ctx = CanvasRenderingContext2D;

function bestLine(ctx: Ctx, best: BestRecord | null, cx: number, y: number): void {
  if (!best) return;
  text(ctx, `✦ Best — Realm ${best.realm}/5 · ${formatTime(best.time)} · ${best.kills} slain ✦`, cx, y, {
    size: 13,
    color: withAlpha(COLORS.gold, 0.95),
    align: "center",
    weight: "bold",
  });
}

/** A small heraldic basilisk emblem (decorative, static-ish). */
function emblem(ctx: Ctx, cx: number, cy: number, r: number, time: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Coiled serpent ring.
  ctx.strokeStyle = COLORS.basiliskDark;
  ctx.lineWidth = r * 0.34;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0.4, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = COLORS.basilisk;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0.4, Math.PI * 1.9);
  ctx.stroke();
  // Crown.
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.55);
  ctx.lineTo(-r * 0.5, -r * 0.95);
  ctx.lineTo(-r * 0.25, -r * 0.7);
  ctx.lineTo(0, -r * 1.05);
  ctx.lineTo(r * 0.25, -r * 0.7);
  ctx.lineTo(r * 0.5, -r * 0.95);
  ctx.lineTo(r * 0.5, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // The eye.
  const glow = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = withAlpha(COLORS.vermilion, 0.3 + 0.3 * glow);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.goldLight;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.05, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTitle(ctx: Ctx, vw: number, vh: number, time: number, best: BestRecord | null = null): void {
  const cx = vw / 2;
  const w = Math.min(560, vw * 0.86);
  const h = 420;
  const r: Rect = { x: cx - w / 2, y: vh / 2 - h / 2, w, h };
  panel(ctx, r, { accent: COLORS.gold, fill: COLORS.parchment });

  emblem(ctx, cx, r.y + 96, 56, time);

  text(ctx, "BASILISK", cx, r.y + 196, { size: 52, color: COLORS.ink, align: "center", weight: "bold" });
  text(ctx, "The Little King", cx, r.y + 230, { size: 22, color: COLORS.vermilionDeep, align: "center" });
  text(ctx, "Hatch. Devour. Grow. Wear the crown of stone.", cx, r.y + 268, {
    size: 14,
    color: COLORS.inkSoft,
    align: "center",
  });

  text(ctx, "Move:  WASD  /  Arrow Keys", cx, r.y + 312, { size: 14, color: COLORS.ink, align: "center" });
  text(ctx, "Your gaze petrifies and your breath rots — they strike on their own.", cx, r.y + 334, {
    size: 13,
    color: withAlpha(COLORS.inkSoft, 0.85),
    align: "center",
  });
  text(ctx, "Beware the cock-crow.", cx, r.y + 354, {
    size: 13,
    color: COLORS.vermilion,
    align: "center",
  });
  bestLine(ctx, best, cx, r.y + 378);

  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, "— Press any key to hatch —", cx, r.y + h - 26, {
    size: 16,
    color: withAlpha(COLORS.ink, pulse),
    align: "center",
    weight: "bold",
  });
}

function statsBlock(ctx: Ctx, world: World, cx: number, y: number): void {
  const stage = EVOLUTIONS[world.evolution];
  const lines = [
    `Endured  ${formatTime(world.time)}`,
    `Final form  ${stage.name}`,
    `Length  ${world.basilisk.segments}    ·    Level  ${world.level}`,
    `Souls devoured  ${world.kills}`,
  ];
  lines.forEach((l, i) => {
    text(ctx, l, cx, y + i * 26, { size: 16, color: COLORS.ink, align: "center" });
  });
}

export function drawGameOver(ctx: Ctx, world: World, vw: number, vh: number, time: number, best: BestRecord | null = null): void {
  dimScreen(ctx, vw, vh, 0.5);
  const cx = vw / 2;
  const w = Math.min(480, vw * 0.86);
  const h = 340;
  const r: Rect = { x: cx - w / 2, y: vh / 2 - h / 2, w, h };
  panel(ctx, r, { accent: COLORS.vermilion, fill: COLORS.parchment });

  text(ctx, "THE LITTLE KING FALLS", cx, r.y + 56, { size: 30, color: COLORS.vermilionDeep, align: "center", weight: "bold" });
  text(ctx, "Its legend ends, half-written, upon the page.", cx, r.y + 86, {
    size: 14,
    color: COLORS.inkSoft,
    align: "center",
  });
  statsBlock(ctx, world, cx, r.y + 138);
  bestLine(ctx, best, cx, r.y + 250);

  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, "— Click to rise again —", cx, r.y + h - 26, {
    size: 16,
    color: withAlpha(COLORS.ink, pulse),
    align: "center",
    weight: "bold",
  });
}

export function drawStageClear(
  ctx: Ctx,
  fromName: string,
  toName: string,
  vw: number,
  vh: number,
  time: number,
): void {
  dimScreen(ctx, vw, vh, 0.5);
  const cx = vw / 2;
  const w = Math.min(520, vw * 0.86);
  const h = 250;
  const r: Rect = { x: cx - w / 2, y: vh / 2 - h / 2, w, h };
  panel(ctx, r, { accent: COLORS.gold, fill: COLORS.parchment });

  text(ctx, `${fromName} cleared`.toUpperCase(), cx, r.y + 64, {
    size: 26,
    color: COLORS.verdigrisDeep,
    align: "center",
    weight: "bold",
  });
  text(ctx, "The realm is yours. A greater one beckons.", cx, r.y + 96, {
    size: 14,
    color: COLORS.inkSoft,
    align: "center",
  });
  text(ctx, `Onward to ${toName}`, cx, r.y + 146, {
    size: 20,
    color: COLORS.ink,
    align: "center",
    weight: "bold",
  });

  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, "— Press any key to advance —", cx, r.y + h - 26, {
    size: 15,
    color: withAlpha(COLORS.ink, pulse),
    align: "center",
    weight: "bold",
  });
}

export function drawWin(ctx: Ctx, world: World, vw: number, vh: number, time: number, best: BestRecord | null = null): void {
  dimScreen(ctx, vw, vh, 0.45);
  const cx = vw / 2;
  const w = Math.min(520, vw * 0.86);
  const h = 380;
  const r: Rect = { x: cx - w / 2, y: vh / 2 - h / 2, w, h };
  panel(ctx, r, { accent: COLORS.gold, fill: COLORS.parchment });

  emblem(ctx, cx, r.y + 70, 40, time);
  text(ctx, "LONG LIVE THE BASILISK", cx, r.y + 150, { size: 28, color: COLORS.ink, align: "center", weight: "bold" });
  text(ctx, "The five realms have fallen. The little king is King no longer — but Calamity itself.", cx, r.y + 180, {
    size: 13,
    color: COLORS.verdigrisDeep,
    align: "center",
  });
  statsBlock(ctx, world, cx, r.y + 224);
  bestLine(ctx, best, cx, r.y + 336);

  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, "— Click to reign anew —", cx, r.y + h - 26, {
    size: 16,
    color: withAlpha(COLORS.ink, pulse),
    align: "center",
    weight: "bold",
  });
}
