// Procedural "hand-drawn manuscript" art. Every creature is built from canvas
// vector primitives with thick iron-gall ink outlines and flat pigment fills,
// echoing an illuminated bestiary. No image assets. All functions draw in
// WORLD space (the Renderer has already applied the camera transform).

import type { World, Prey, Enemy, SoundWave, PoisonCloud, Particle, FloatText, Hazard } from "../entities/types";
import { bodyPositions } from "../entities/Basilisk";
import { EVOLUTIONS } from "../progression/evolution";
import { COLORS, withAlpha } from "./palette";
import { lerp } from "../core/math";

type Ctx = CanvasRenderingContext2D;

const INK = COLORS.ink;

// ─────────────────────────────────────────────────────────────────────────
//  The Basilisk
// ─────────────────────────────────────────────────────────────────────────

export function drawBasilisk(ctx: Ctx, world: World, time: number): void {
  const b = world.basilisk;
  const stage = EVOLUTIONS[world.evolution];
  const body = bodyPositions(b);
  const points = [{ x: b.x, y: b.y }, ...body];
  const headR = b.radius;
  const segR = headR * 0.82;

  // Tail-to-head taper radii.
  const radii = points.map((_, i) => {
    const t = points.length <= 1 ? 0 : i / (points.length - 1);
    return Math.max(2.5, lerp(segR, segR * 0.32, t));
  });

  // Pass 1: ink silhouette (union of slightly larger circles).
  ctx.fillStyle = INK;
  for (let i = points.length - 1; i >= 0; i--) blob(ctx, points[i].x, points[i].y, radii[i] + 2.4);

  // Pass 2: body fill.
  ctx.fillStyle = COLORS.basilisk;
  for (let i = points.length - 1; i >= 0; i--) blob(ctx, points[i].x, points[i].y, radii[i]);

  // Pass 3: belly sheen + dorsal scale dots.
  ctx.fillStyle = withAlpha(COLORS.basiliskBelly, 0.55);
  for (let i = points.length - 1; i >= 0; i--) blob(ctx, points[i].x, points[i].y - radii[i] * 0.3, radii[i] * 0.5);
  ctx.fillStyle = withAlpha(COLORS.basiliskDark, 0.6);
  for (let i = points.length - 1; i >= 1; i -= 2) blob(ctx, points[i].x, points[i].y, radii[i] * 0.22);

  // Little lizard legs along the front third.
  drawLegs(ctx, points, radii, time);

  // Small wings just behind the head.
  if (points.length > 1) drawWings(ctx, points[Math.min(2, points.length - 1)], b.facing, headR, time, stage.crest);

  // Rooster head with crown crest.
  drawHead(ctx, b.x, b.y, b.facing, headR, stage.crest, time);
}

function drawLegs(ctx: Ctx, pts: { x: number; y: number }[], radii: number[], time: number): void {
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  const flap = Math.sin(time * 9) * 0.5;
  const legAt = [2, 5];
  for (const idx of legAt) {
    if (idx >= pts.length - 1) continue;
    const a = pts[idx];
    const next = pts[idx + 1] ?? a;
    const dx = a.x - next.x;
    const dy = a.y - next.y;
    const perp = Math.atan2(dy, dx) + Math.PI / 2;
    const r = radii[idx];
    ctx.lineWidth = Math.max(2, r * 0.32);
    for (const side of [-1, 1]) {
      const ang = perp * side + flap * side;
      const ox = Math.cos(ang) * r * 0.7;
      const oy = Math.sin(ang) * r * 0.7;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + ox, a.y + oy + r * 0.5);
      ctx.stroke();
    }
  }
}

function drawWings(
  ctx: Ctx,
  at: { x: number; y: number },
  facing: number,
  headR: number,
  time: number,
  crest: number,
): void {
  const flap = (Math.sin(time * 7) * 0.5 + 0.5) * 0.6 + 0.2;
  const span = headR * (1.1 + crest * 0.6);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.rotate(facing + (Math.PI / 2) * side);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(span * 0.6, -span * flap, span, -span * 0.2);
    ctx.quadraticCurveTo(span * 0.7, span * 0.2, 0, span * 0.15);
    ctx.closePath();
    ctx.fillStyle = withAlpha(COLORS.basiliskDark, 0.92);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // wing ribs
    ctx.strokeStyle = withAlpha(INK, 0.5);
    ctx.lineWidth = 1;
    for (let r = 0.35; r < 1; r += 0.3) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(span * r, -span * flap * r);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHead(ctx: Ctx, x: number, y: number, facing: number, r: number, crest: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  // Crown-like crest (comb), growing more regal with evolution.
  const combN = 3 + Math.round(crest * 3);
  const combH = r * (0.5 + crest * 1.1);
  ctx.fillStyle = COLORS.crest;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.7);
  for (let i = 0; i <= combN; i++) {
    const t = i / combN;
    const px = lerp(-r * 0.5, r * 0.5, t);
    const peak = i % 1 === 0 ? combH : combH * 0.6;
    ctx.lineTo(px, -r * 0.7 - peak * (0.7 + 0.3 * Math.sin(i)));
    ctx.lineTo(px + r / combN / 2, -r * 0.7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (crest > 0.5) {
    // gold coronet band at the base for kingly stages
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(-r * 0.55, -r * 0.85, r * 1.1, r * 0.22);
    ctx.strokeRect(-r * 0.55, -r * 0.85, r * 1.1, r * 0.22);
  }

  // Head capsule.
  ctx.fillStyle = INK;
  blob(ctx, 0, 0, r + 2);
  ctx.fillStyle = COLORS.basiliskDark;
  blob(ctx, 0, 0, r);

  // Beak (forward triangle).
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.4, -r * 0.28);
  ctx.lineTo(r * 1.5, 0);
  ctx.lineTo(r * 0.4, r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wattle under the beak.
  ctx.fillStyle = COLORS.vermilion;
  blob(ctx, r * 0.55, r * 0.45, r * 0.28);

  // The petrifying eye — golden iris, slit pupil, faint glow.
  const glow = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.fillStyle = withAlpha(COLORS.goldLight, 0.35 * glow);
  blob(ctx, r * 0.15, -r * 0.15, r * 0.7);
  ctx.fillStyle = COLORS.goldLight;
  blob(ctx, r * 0.2, -r * 0.18, r * 0.34);
  ctx.fillStyle = INK;
  ctx.save();
  ctx.translate(r * 0.24, -r * 0.18);
  ctx.scale(0.45, 1);
  blob(ctx, 0, 0, r * 0.2);
  ctx.restore();

  ctx.restore();
}

/** A filled circle (used pervasively for the "inked blob" look). */
function blob(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────
//  Prey
// ─────────────────────────────────────────────────────────────────────────

export function drawPrey(ctx: Ctx, p: Prey): void {
  const petrified = p.petrified > 0;
  const fill = petrified ? COLORS.petrify : preyColor(p.kind);
  ctx.fillStyle = INK;
  blob(ctx, p.x, p.y, p.radius + 2);
  ctx.fillStyle = fill;
  blob(ctx, p.x, p.y, p.radius);

  if (!petrified) {
    // Ears / features per kind.
    ctx.fillStyle = INK;
    if (p.kind === "rabbit") {
      blob(ctx, p.x - p.radius * 0.4, p.y - p.radius, p.radius * 0.3);
      blob(ctx, p.x + p.radius * 0.4, p.y - p.radius, p.radius * 0.3);
    } else if (p.kind === "mouse") {
      blob(ctx, p.x - p.radius * 0.6, p.y - p.radius * 0.6, p.radius * 0.4);
      blob(ctx, p.x + p.radius * 0.6, p.y - p.radius * 0.6, p.radius * 0.4);
    } else if (p.kind === "boar") {
      ctx.fillStyle = COLORS.bone;
      blob(ctx, p.x + p.radius * 0.7, p.y, p.radius * 0.2); // tusk hint
      ctx.fillStyle = COLORS.inkSoft;
      blob(ctx, p.x - p.radius * 0.5, p.y - p.radius * 0.7, p.radius * 0.35); // bristle
    }
    // eye
    ctx.fillStyle = INK;
    blob(ctx, p.x + p.radius * 0.35, p.y - p.radius * 0.2, Math.max(1, p.radius * 0.16));
  } else {
    // Cracks on the stone.
    ctx.strokeStyle = withAlpha(INK, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - p.radius * 0.5, p.y - p.radius * 0.3);
    ctx.lineTo(p.x, p.y);
    ctx.lineTo(p.x + p.radius * 0.4, p.y - p.radius * 0.5);
    ctx.stroke();
  }
}

function preyColor(kind: Prey["kind"]): string {
  switch (kind) {
    case "mouse":
      return "#8a7a5c";
    case "rabbit":
      return "#c9bda0";
    case "frog":
      return COLORS.verdigris;
    case "boar":
      return "#6e5a3e";
  }
}

// ─────────────────────────────────────────────────────────────────────────
//  Rooster (and its sound waves)
// ─────────────────────────────────────────────────────────────────────────

export function drawRooster(ctx: Ctx, e: Enemy, time: number): void {
  const r = e.radius;
  // Tail feathers (behind).
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = COLORS.vermilionDeep;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.rotate(Math.PI * 0.85 + i * 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 1.3, -r * 0.6, r * 1.8, -r * 0.1);
    ctx.quadraticCurveTo(r * 1.2, r * 0.2, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Body.
  ctx.fillStyle = INK;
  blob(ctx, e.x, e.y, r + 2.4);
  ctx.fillStyle = COLORS.vermilion;
  blob(ctx, e.x, e.y, r);
  ctx.fillStyle = withAlpha(COLORS.bone, 0.4);
  blob(ctx, e.x - r * 0.2, e.y - r * 0.3, r * 0.5);

  // Comb + wattle + beak + eye on the head (top-ish).
  const hx = e.x;
  const hy = e.y - r * 0.7;
  ctx.fillStyle = COLORS.vermilionDeep;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) blob(ctx, hx - r * 0.3 + i * r * 0.3, hy - r * 0.5, r * 0.22);
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - r * 0.9, hy + r * 0.1);
  ctx.lineTo(hx, hy + r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  blob(ctx, hx + r * 0.1, hy - r * 0.05, r * 0.12);

  // An agitated wing flap when about to crow.
  const about = e.attackTimer < 0.5;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillStyle = withAlpha(COLORS.bone, 0.5);
  const wf = about ? Math.sin(time * 30) * r * 0.4 : 0;
  ctx.beginPath();
  ctx.ellipse(e.x + r * 0.2, e.y + r * 0.1, r * 0.7, r * 0.45, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  void wf;
}

export function drawSoundWave(ctx: Ctx, w: SoundWave): void {
  const t = 1 - w.radius / w.maxRadius; // fade as it expands
  ctx.strokeStyle = withAlpha(COLORS.vermilion, 0.25 + 0.45 * t);
  ctx.lineWidth = w.thickness;
  ctx.beginPath();
  ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(COLORS.ink, 0.15 + 0.25 * t);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────────────────────
//  Weapon / effect visuals
// ─────────────────────────────────────────────────────────────────────────

export function drawGazeCone(ctx: Ctx, world: World): void {
  if (world.gazeFlash <= 0) return;
  const b = world.basilisk;
  const s = world.stats;
  const a0 = b.facing - s.gazeHalfAngle;
  const a1 = b.facing + s.gazeHalfAngle;
  const grad = ctx.createRadialGradient(b.x, b.y, b.radius, b.x, b.y, s.gazeRange);
  grad.addColorStop(0, withAlpha(COLORS.goldLight, 0.34 * world.gazeFlash));
  grad.addColorStop(1, withAlpha(COLORS.goldLight, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.arc(b.x, b.y, s.gazeRange, a0, a1);
  ctx.closePath();
  ctx.fill();
}

export function drawPoisonCloud(ctx: Ctx, c: PoisonCloud): void {
  const a = Math.min(0.4, (c.life / c.maxLife) * 0.45);
  ctx.fillStyle = withAlpha(COLORS.verdigris, a);
  blob(ctx, c.x, c.y, c.radius);
  ctx.fillStyle = withAlpha(COLORS.verdigrisDeep, a * 0.8);
  blob(ctx, c.x + c.radius * 0.2, c.y - c.radius * 0.15, c.radius * 0.5);
}

// ─────────────────────────────────────────────────────────────────────────
//  Hazards (water, mirrors) + Mirror-bearer + Tail Slam
// ─────────────────────────────────────────────────────────────────────────

export function drawHazard(ctx: Ctx, h: Hazard): void {
  if (h.kind === "water") drawWater(ctx, h);
  else drawMirror(ctx, h);
}

function drawWater(ctx: Ctx, h: Hazard): void {
  const muddy = h.disabledTime > 0;
  ctx.fillStyle = muddy ? withAlpha(COLORS.stainDark, 0.55) : withAlpha(COLORS.lapis, 0.33);
  blob(ctx, h.x, h.y, h.radius);
  ctx.strokeStyle = withAlpha(muddy ? COLORS.stainDark : COLORS.lapisLight, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
  ctx.stroke();
  if (!muddy) {
    // shine + ripple
    ctx.fillStyle = withAlpha(COLORS.bone, 0.16);
    blob(ctx, h.x - h.radius * 0.25, h.y - h.radius * 0.25, h.radius * 0.35);
    ctx.strokeStyle = withAlpha(COLORS.lapisLight, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 0.6, 0.3, 2.2);
    ctx.stroke();
  }
}

function drawMirror(ctx: Ctx, h: Hazard): void {
  const covered = h.disabledTime > 0;
  ctx.save();
  ctx.translate(h.x, h.y);
  // ornate dark frame
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, 0, h.radius * 0.72, h.radius, 0, 0, Math.PI * 2);
  ctx.fill();
  // glass (or covering cloth)
  ctx.fillStyle = covered ? COLORS.stainDark : COLORS.lapisLight;
  ctx.beginPath();
  ctx.ellipse(0, 0, h.radius * 0.58, h.radius * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!covered) {
    ctx.fillStyle = withAlpha(COLORS.bone, 0.6);
    ctx.beginPath();
    ctx.ellipse(-h.radius * 0.15, -h.radius * 0.32, h.radius * 0.12, h.radius * 0.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // gold rim
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, h.radius * 0.65, h.radius * 0.93, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawMirrorBearer(ctx: Ctx, e: Enemy): void {
  const r = e.radius;
  // robe silhouette
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y - r * 1.5);
  ctx.lineTo(e.x - r * 1.1, e.y + r * 1.1);
  ctx.lineTo(e.x + r * 1.1, e.y + r * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.lapis;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y - r * 1.25);
  ctx.lineTo(e.x - r * 0.85, e.y + r * 0.95);
  ctx.lineTo(e.x + r * 0.85, e.y + r * 0.95);
  ctx.closePath();
  ctx.fill();
  // cowl + face
  ctx.fillStyle = COLORS.inkSoft;
  blob(ctx, e.x, e.y - r * 1.2, r * 0.5);
  ctx.fillStyle = COLORS.bone;
  blob(ctx, e.x, e.y - r * 1.12, r * 0.34);
}

// — Humans —

function humanFigure(ctx: Ctx, x: number, y: number, r: number, robe: string, cowl: string): void {
  ctx.fillStyle = INK; // outline silhouette
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.55);
  ctx.lineTo(x - r * 1.15, y + r * 1.15);
  ctx.lineTo(x + r * 1.15, y + r * 1.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.28);
  ctx.lineTo(x - r * 0.88, y + r * 0.98);
  ctx.lineTo(x + r * 0.88, y + r * 0.98);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = cowl;
  blob(ctx, x, y - r * 1.22, r * 0.52);
  ctx.fillStyle = COLORS.bone;
  blob(ctx, x, y - r * 1.14, r * 0.32);
}

export function drawHunter(ctx: Ctx, e: Enemy): void {
  const r = e.radius;
  humanFigure(ctx, e.x, e.y, r, "#5b6b3a", COLORS.inkSoft);
  // a longbow at the side
  ctx.strokeStyle = COLORS.inkSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(e.x + r * 1.0, e.y, r * 1.0, -1.1, 1.1);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(COLORS.bone, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(e.x + r * 1.0 + Math.cos(-1.1) * r, e.y + Math.sin(-1.1) * r);
  ctx.lineTo(e.x + r * 1.0 + Math.cos(1.1) * r, e.y + Math.sin(1.1) * r);
  ctx.stroke();
}

export function drawKnight(ctx: Ctx, e: Enemy): void {
  const r = e.radius;
  humanFigure(ctx, e.x, e.y, r, COLORS.petrify, COLORS.inkSoft);
  // helmet visor
  ctx.fillStyle = COLORS.inkSoft;
  ctx.fillRect(e.x - r * 0.4, e.y - r * 1.4, r * 0.8, r * 0.5);
  // sword
  ctx.strokeStyle = COLORS.bone;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.x + r * 0.9, e.y + r * 0.6);
  ctx.lineTo(e.x + r * 1.1, e.y - r * 1.3);
  ctx.stroke();
  // round shield
  ctx.fillStyle = COLORS.vermilion;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(e.x - r * 0.9, e.y + r * 0.1, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawPriest(ctx: Ctx, e: Enemy): void {
  const r = e.radius;
  humanFigure(ctx, e.x, e.y, r, COLORS.bone, COLORS.lapis);
  // golden halo
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(e.x, e.y - r * 1.2, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  // cross on the chest
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y - r * 0.1);
  ctx.lineTo(e.x, e.y + r * 0.6);
  ctx.moveTo(e.x - r * 0.25, e.y + r * 0.15);
  ctx.lineTo(e.x + r * 0.25, e.y + r * 0.15);
  ctx.stroke();
}

export function drawRoosterHandler(ctx: Ctx, e: Enemy, time: number): void {
  const r = e.radius;
  humanFigure(ctx, e.x, e.y, r, "#6e5a3e", COLORS.inkSoft);
  // a rooster perched on the shoulder
  const px = e.x + r * 0.95;
  const py = e.y - r * 0.7;
  ctx.fillStyle = COLORS.vermilion;
  blob(ctx, px, py, r * 0.4);
  ctx.fillStyle = COLORS.vermilionDeep;
  for (let i = 0; i < 2; i++) blob(ctx, px - r * 0.1 + i * r * 0.18, py - r * 0.35, r * 0.12);
  ctx.fillStyle = COLORS.gold;
  blob(ctx, px + r * 0.32, py + r * 0.02, r * 0.12);
  // a faint summoning glow that pulses near a summon
  if (e.attackTimer < 0.6) {
    ctx.fillStyle = withAlpha(COLORS.vermilion, 0.18 * (0.5 + 0.5 * Math.sin(time * 20)));
    blob(ctx, e.x, e.y, r * 1.8);
  }
}

export function drawWeasel(ctx: Ctx, e: Enemy, time: number): void {
  const r = e.radius;
  const a = Math.atan2(e.vy, e.vx);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(a);
  // Tail.
  ctx.strokeStyle = "#7a5230";
  ctx.lineWidth = r * 0.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 1.5, 0);
  ctx.quadraticCurveTo(-r * 2.6, Math.sin(time * 8) * r * 0.5, -r * 3.3, 0);
  ctx.stroke();
  // Elongated body.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.95, r * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5230";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.78, r * 0.74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha(COLORS.bone, 0.5);
  ctx.beginPath();
  ctx.ellipse(0, r * 0.28, r * 1.3, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Little scurrying legs.
  ctx.strokeStyle = INK;
  ctx.lineWidth = r * 0.22;
  const sw = Math.sin(time * 16) * r * 0.32;
  for (const lx of [-r * 0.8, r * 0.6]) {
    ctx.beginPath();
    ctx.moveTo(lx, r * 0.5);
    ctx.lineTo(lx + sw, r * 1.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, -r * 0.5);
    ctx.lineTo(lx - sw, -r * 1.05);
    ctx.stroke();
  }
  // Head + snout + glaring eyes.
  ctx.fillStyle = "#7a5230";
  blob(ctx, r * 1.65, 0, r * 0.72);
  ctx.fillStyle = "#5a3c22";
  blob(ctx, r * 1.35, -r * 0.5, r * 0.2);
  blob(ctx, r * 1.35, r * 0.5, r * 0.2);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(r * 2.4, 0);
  ctx.lineTo(r * 1.9, -r * 0.3);
  ctx.lineTo(r * 1.9, r * 0.3);
  ctx.closePath();
  ctx.fill();
  const glow = 0.6 + 0.4 * Math.sin(time * 6);
  ctx.fillStyle = withAlpha(COLORS.vermilion, glow);
  blob(ctx, r * 1.7, -r * 0.28, r * 0.15);
  blob(ctx, r * 1.7, r * 0.28, r * 0.15);
  ctx.restore();

  // Boss health bar.
  const w = r * 4;
  const bx = e.x - w / 2;
  const by = e.y - r * 2.6;
  ctx.fillStyle = withAlpha(INK, 0.6);
  ctx.fillRect(bx - 1, by - 1, w + 2, 6);
  ctx.fillStyle = COLORS.vermilion;
  ctx.fillRect(bx, by, w * Math.max(0, e.hp / e.maxHp), 4);
}

export function drawArrow(ctx: Ctx, p: { x: number; y: number; vx: number; vy: number }): void {
  const a = Math.atan2(p.vy, p.vx);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(a);
  ctx.strokeStyle = COLORS.inkSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(2, -3);
  ctx.lineTo(2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.vermilion;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-12, -3);
  ctx.moveTo(-9, 0);
  ctx.lineTo(-12, 3);
  ctx.stroke();
  ctx.restore();
}

export function drawTailSlam(ctx: Ctx, world: World): void {
  if (world.tailFlash <= 0) return;
  const b = world.basilisk;
  const prog = 1 - world.tailFlash; // 0 → 1 as the ring expands
  const r = world.stats.tailRadius * (0.2 + prog * 0.85);
  ctx.strokeStyle = withAlpha(COLORS.parchmentShadow, world.tailFlash * 0.85);
  ctx.lineWidth = 6 * world.tailFlash + 1;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(COLORS.ink, world.tailFlash * 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawParticle(ctx: Ctx, p: Particle): void {
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color;
  blob(ctx, p.x, p.y, p.size);
  ctx.globalAlpha = 1;
}

export function drawFloatText(ctx: Ctx, t: FloatText): void {
  ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
  ctx.fillStyle = t.color;
  ctx.font = `bold ${t.size}px "Iowan Old Style", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText(t.text, t.x, t.y);
  ctx.globalAlpha = 1;
}
