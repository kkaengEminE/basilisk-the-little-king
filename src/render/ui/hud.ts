// In-run heads-up display: vitality + experience bars, evolution stage and
// stage timer, kill count, and the centred evolution banner. Screen space.

import type { World } from "../../entities/types";
import { EVOLUTIONS } from "../../progression/evolution";
import { MAPS } from "../../world/maps";
import { COLORS, withAlpha } from "../palette";
import { bar, text, formatTime, panel } from "./ui-kit";

type Ctx = CanvasRenderingContext2D;

export function drawHud(ctx: Ctx, world: World, vw: number, _vh: number, muted = false): void {
  const pad = 16;

  // — Vitality + XP (top-left) —
  const barW = Math.min(280, vw * 0.32);
  bar(ctx, { x: pad, y: pad, w: barW, h: 20 }, world.hp / world.stats.maxHp, COLORS.vermilion, {
    label: `${Math.ceil(world.hp)} / ${world.stats.maxHp}`,
  });
  bar(ctx, { x: pad, y: pad + 26, w: barW, h: 14 }, world.xp / world.xpToNext, COLORS.gold, {});
  text(ctx, `Level ${world.level}`, pad + 4, pad + 26 + 11, { size: 11, color: COLORS.ink, weight: "bold" });

  // — Stage + evolution (top-center) —
  const stage = EVOLUTIONS[world.evolution];
  const map = MAPS[world.mapIndex] ?? MAPS[0];
  const cx = vw / 2;
  text(ctx, map.name, cx, pad + 6, { size: 20, color: COLORS.ink, align: "center", weight: "bold", baseline: "top" });
  text(ctx, stage.name, cx, pad + 30, { size: 13, color: COLORS.vermilionDeep, align: "center", baseline: "top" });
  const remain = Math.max(0, world.mapDuration - world.mapTime);
  text(ctx, `Realm ${world.mapIndex + 1}/${MAPS.length}  ·  Survive ${formatTime(remain)}`, cx, pad + 48, {
    size: 13,
    color: COLORS.inkSoft,
    align: "center",
    baseline: "top",
  });

  // — Length + kills (top-right) —
  text(ctx, `Length ${world.basilisk.segments}`, vw - pad, pad + 4, {
    size: 14,
    color: COLORS.ink,
    align: "right",
    baseline: "top",
    weight: "bold",
  });
  text(ctx, `Slain ${world.kills}`, vw - pad, pad + 24, {
    size: 13,
    color: COLORS.inkSoft,
    align: "right",
    baseline: "top",
  });
  text(ctx, muted ? "♪ off  [M]" : "♪ on  [M]", vw - pad, pad + 44, {
    size: 11,
    color: withAlpha(COLORS.inkSoft, muted ? 0.5 : 0.8),
    align: "right",
    baseline: "top",
  });

  // — Evolution banner —
  if (world.bannerTime > 0 && world.bannerText) {
    const t = Math.min(1, world.bannerTime / 0.4) * Math.min(1, (3.2 - world.bannerTime) / 0.3 + 1);
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.bannerTime);
    const w = Math.min(560, vw * 0.8);
    const h = 96;
    panel(ctx, { x: cx - w / 2, y: 120, w, h }, { accent: COLORS.gold, fill: COLORS.parchment });
    text(ctx, "✦ EVOLUTION ✦", cx, 120 + 24, { size: 14, color: COLORS.gold, align: "center", weight: "bold" });
    text(ctx, world.bannerText, cx, 120 + 52, { size: 28, color: COLORS.ink, align: "center", weight: "bold" });
    text(ctx, world.bannerSub, cx, 120 + 78, { size: 13, color: withAlpha(COLORS.inkSoft, 0.9), align: "center" });
    ctx.restore();
    void t;
  }

  // — Subtle controls hint early in the run —
  if (world.time < 8) {
    text(ctx, "Move with WASD / Arrows · your gaze and breath strike on their own", cx, _vh - 24, {
      size: 13,
      color: withAlpha(COLORS.ink, 0.6),
      align: "center",
    });
  }
}
