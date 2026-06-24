// The game: a small state machine (title → playing → levelUp → gameOver/win)
// that owns the World, runs the simulation systems in order each fixed tick,
// and renders the world + UI each frame. This is the integration point; the
// systems and entities it calls are each independently testable.

import { GameLoop } from "./GameLoop";
import { Input } from "./Input";
import { Camera } from "./Camera";
import { createRng, randomSeed } from "./rng";
import {
  loadBest,
  saveBest,
  isBetter,
  loadSettings,
  saveSettings,
  loadMeta,
  saveMeta,
  type BestRecord,
  type Meta,
} from "./storage";
import { applyMeta } from "../progression/meta";
import { Renderer } from "../render/Renderer";
import { AudioEngine } from "../audio/AudioEngine";
import { COLORS, withAlpha } from "../render/palette";

import type { World } from "../entities/types";
import { createStats } from "../progression/stats";
import { createBasilisk } from "../entities/Basilisk";
import { xpForLevel } from "../systems/leveling";
import { MAPS } from "../world/maps";

import { updateMovement } from "../systems/movement";
import { updatePrey } from "../entities/prey";
import { updateEnemies, updateWaves } from "../entities/enemies";
import { updateProjectiles } from "../systems/projectiles";
import { updateCombat } from "../systems/combat";
import { updateCollisions } from "../systems/collision";
import { updateEffects } from "../systems/fx";
import { createSpawnState, updateSpawning, scatterWater, type SpawnState } from "../systems/spawn";

import { offerUpgrades, takeUpgrade, type Upgrade } from "../progression/upgrades";

import {
  drawBasilisk,
  drawPrey,
  drawRooster,
  drawMirrorBearer,
  drawHunter,
  drawKnight,
  drawPriest,
  drawRoosterHandler,
  drawWeasel,
  drawArrow,
  drawSoundWave,
  drawPoisonCloud,
  drawHazard,
  drawTailSlam,
  drawParticle,
  drawFloatText,
  drawGazeCone,
} from "../render/sprites";
import { drawHud } from "../render/ui/hud";
import { drawLevelUp, levelUpCardRects } from "../render/ui/levelup";
import { drawTitle, drawGameOver, drawWin, drawStageClear, drawPause, pauseButtonRects } from "../render/ui/screens";
import { pointInRect, type Rect } from "../render/ui/ui-kit";

type Phase = "title" | "playing" | "paused" | "levelUp" | "stageClear" | "gameOver" | "win";

export class Game {
  private readonly renderer: Renderer;
  private readonly input: Input;
  private readonly camera = new Camera();
  private readonly loop: GameLoop;

  private phase: Phase = "title";
  private world!: World;
  private spawn!: SpawnState;
  private offers: Upgrade[] = [];
  private cardRects: Rect[] = [];
  private nextMapIndex = 0; // pending biome during a stage-clear interstitial
  private renderTime = 0; // wall-clock-ish time for menu animations
  private readonly audio = new AudioEngine();
  private best: BestRecord | null = loadBest();
  private meta: Meta = loadMeta();
  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    window.addEventListener("resize", () => this.onResize());
    this.onResize();
    const settings = loadSettings(); // restore saved sound / motion preferences
    this.audio.muted = settings.muted;
    this.reducedMotion = settings.reducedMotion;
    this.newRun(); // build an initial world so the title can sit over a calm map
    this.phase = "title";
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    );

    // Dev-only inspection hook for smoke tests; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = this;
  }

  /** Read-only snapshot for debugging / automated verification. */
  get debug() {
    const w = this.world;
    return {
      phase: this.phase,
      time: w.time,
      level: w.level,
      segments: w.basilisk.segments,
      evolution: w.evolution,
      kills: w.kills,
      hp: w.hp,
      prey: w.prey.length,
      enemies: w.enemies.length,
      offers: this.offers.map((o) => o.id),
    };
  }

  start(): void {
    this.loop.start();
  }

  private onResize(): void {
    this.renderer.resize();
    this.camera.setViewport(this.renderer.width, this.renderer.height);
  }

  // ── lifecycle ──────────────────────────────────────────────────────────

  private newRun(mapIndex = 0): void {
    const map = MAPS[mapIndex];
    const stats = createStats();
    applyMeta(stats, this.meta.souls); // permanent meta-progression bonuses
    const basilisk = createBasilisk(0, 0);
    this.world = {
      rng: createRng(randomSeed()),
      basilisk,
      stats,
      prey: [],
      enemies: [],
      waves: [],
      clouds: [],
      hazards: [],
      projectiles: [],
      texts: [],
      particles: [],
      hp: stats.maxHp,
      invuln: 0,
      time: 0,
      kills: 0,
      level: 1,
      xp: 0,
      xpToNext: xpForLevel(1),
      evolution: 0,
      pendingLevels: 0,
      upgrades: {},
      gazeTimer: stats.gazeCooldown,
      poisonTimer: stats.poisonCooldown,
      tailTimer: stats.tailCooldown,
      shake: 0,
      gazeFlash: 0,
      tailFlash: 0,
      hurtFlash: 0,
      goldFlash: 0,
      sounds: [],
      bannerText: "",
      bannerSub: "",
      bannerTime: 0,
      mapIndex,
      mapTime: 0,
      mapDuration: map.duration,
      nextId: 1,
    };
    scatterWater(this.world, map);
    this.spawn = createSpawnState();
    this.camera.snapTo(basilisk);
    this.renderer.setTheme(map.theme, map.seed);
  }

  private beginPlaying(): void {
    this.newRun(0);
    this.phase = "playing";
    this.audio.ensure();
    this.audio.startMusic();
  }

  /**
   * Carry the basilisk (length, stats, upgrades, level) into the next biome.
   * Transient combatants/hazards are cleared, the arena re-themed and re-seeded
   * with water, and the basilisk re-centred and fully healed as a reward.
   */
  private advanceStage(toIndex: number): void {
    const w = this.world;
    const map = MAPS[toIndex];
    w.mapIndex = toIndex;
    w.mapTime = 0;
    w.mapDuration = map.duration;

    w.enemies.length = 0;
    w.waves.length = 0;
    w.projectiles.length = 0;
    w.hazards.length = 0;
    w.clouds.length = 0;
    w.prey.length = 0;
    w.texts.length = 0;
    w.particles.length = 0;

    const b = w.basilisk;
    b.x = 0;
    b.y = 0;
    b.vx = 0;
    b.vy = 0;
    b.path = [{ x: 0, y: 0 }];
    w.hp = w.stats.maxHp; // full heal between stages
    w.invuln = 0;
    w.gazeTimer = w.stats.gazeCooldown;
    w.poisonTimer = w.stats.poisonCooldown;
    w.tailTimer = w.stats.tailCooldown;
    w.shake = 0;
    w.hurtFlash = 0;
    w.goldFlash = 0;
    w.sounds.length = 0;

    scatterWater(w, map);
    this.spawn = createSpawnState();
    this.camera.snapTo(b);
    this.renderer.setTheme(map.theme, map.seed);
    w.bannerText = map.name;
    w.bannerSub = "A new realm. The little king presses on.";
    w.bannerTime = 3.2;
  }

  private openLevelUp(): void {
    this.phase = "levelUp";
    this.world.goldFlash = 1;
    this.audio.play("levelUp");
    this.rollOffers();
  }

  private rollOffers(): void {
    const w = this.world;
    this.offers = offerUpgrades(w.rng, w.stats, w.upgrades, 3);
    if (this.offers.length === 0) {
      // Nothing left to offer — just consume the pending level.
      w.pendingLevels = Math.max(0, w.pendingLevels - 1);
      this.phase = w.pendingLevels > 0 ? "levelUp" : "playing";
    }
  }

  private chooseUpgrade(index: number): void {
    const u = this.offers[index];
    if (!u) return;
    const w = this.world;
    const oldMax = w.stats.maxHp;
    takeUpgrade(u, w.stats, w.upgrades);
    this.audio.play("pick");
    // Heal by any max-HP increase so vitality upgrades feel good.
    if (w.stats.maxHp > oldMax) w.hp = Math.min(w.stats.maxHp, w.hp + (w.stats.maxHp - oldMax));
    // Announce weapon evolutions.
    if (u.id.endsWith("_evo")) {
      w.bannerText = u.name.replace("★ ", "");
      w.bannerSub = "Your weapon has evolved!";
      w.bannerTime = 2.8;
      w.goldFlash = 1;
      this.audio.play("evolve");
    }
    w.pendingLevels = Math.max(0, w.pendingLevels - 1);
    if (w.pendingLevels > 0) this.rollOffers();
    else this.phase = "playing";
  }

  // ── update ─────────────────────────────────────────────────────────────

  private update(dt: number): void {
    this.renderTime += dt;
    // Any input is a gesture that lets us start/resume audio; M toggles mute.
    if (this.input.anyPressed() || this.input.pointerDown) this.audio.ensure();
    if (this.input.wasPressed("m")) {
      this.audio.toggleMute();
      saveSettings({ muted: this.audio.muted, reducedMotion: this.reducedMotion });
    }
    switch (this.phase) {
      case "title":
        if (this.input.anyPressed() || this.input.takeClick()) this.beginPlaying();
        break;
      case "playing":
        if (this.input.wasPressed("p") || this.input.wasPressed("escape")) {
          this.phase = "paused";
          break;
        }
        this.updatePlaying(dt);
        break;
      case "paused":
        this.updatePaused();
        break;
      case "levelUp":
        this.updateLevelUp();
        break;
      case "stageClear":
        if (this.input.anyPressed() || this.input.takeClick()) {
          this.advanceStage(this.nextMapIndex);
          this.phase = "playing";
        }
        break;
      case "gameOver":
      case "win":
        if (this.input.takeClick() || this.input.wasPressed("enter") || this.input.wasPressed(" "))
          this.phase = "title";
        break;
    }
    this.input.endFrame();
  }

  private updatePlaying(dt: number): void {
    const w = this.world;
    const map = MAPS[w.mapIndex];
    w.time += dt;
    w.mapTime += dt;

    updateMovement(w, this.input, dt);
    this.camera.follow(w.basilisk, dt);
    updateSpawning(w, map, this.spawn, dt);
    updatePrey(w, dt);
    updateEnemies(w, dt);
    updateWaves(w, dt);
    updateProjectiles(w, dt);
    updateCombat(w, dt);
    updateCollisions(w);
    updateEffects(w, dt);

    // Touch-drag is movement here, so discard any tap so it can't leak into
    // the next menu (where takeClick() is used for buttons).
    this.input.takeClick();

    // Drain queued sound events to the audio layer.
    for (const s of w.sounds) this.audio.play(s);
    w.sounds.length = 0;

    if (w.hp <= 0) {
      this.phase = "gameOver";
      this.audio.play("lose");
      this.recordRun();
    } else if (w.mapTime >= w.mapDuration) {
      // Stage cleared: advance through the biomes; clearing the last one wins.
      if (w.mapIndex >= MAPS.length - 1) {
        this.phase = "win";
        this.audio.play("win");
        this.recordRun();
      } else {
        this.nextMapIndex = w.mapIndex + 1;
        this.phase = "stageClear";
        this.audio.play("stageClear");
      }
    } else if (w.pendingLevels > 0) {
      this.openLevelUp();
    }
  }

  private recordRun(): void {
    const w = this.world;
    const rec: BestRecord = { time: w.time, realm: w.mapIndex + 1, evolution: w.evolution, kills: w.kills };
    if (isBetter(rec, this.best)) {
      this.best = rec;
      saveBest(rec);
    }
    // Bank this run's kills as permanent "souls" toward meta unlocks.
    this.meta.souls += w.kills;
    saveMeta(this.meta);
  }

  private updateLevelUp(): void {
    const vw = this.renderer.width;
    const vh = this.renderer.height;
    this.cardRects = levelUpCardRects(vw, vh, this.offers.length);

    // Keyboard 1..3.
    for (let i = 0; i < this.offers.length; i++) {
      if (this.input.wasPressed(String(i + 1))) {
        this.chooseUpgrade(i);
        return;
      }
    }
    // Click on a card.
    if (this.input.takeClick()) {
      const { x, y } = this.input.pointer;
      for (let i = 0; i < this.cardRects.length; i++) {
        if (pointInRect(x, y, this.cardRects[i])) {
          this.chooseUpgrade(i);
          return;
        }
      }
    }
  }

  private updatePaused(): void {
    if (this.input.wasPressed("p") || this.input.wasPressed("escape")) {
      this.phase = "playing";
      return;
    }
    if (this.input.wasPressed("r")) {
      this.beginPlaying();
      return;
    }
    if (this.input.wasPressed("q")) {
      this.phase = "title";
      return;
    }
    if (this.input.takeClick()) {
      const rects = pauseButtonRects(this.renderer.width, this.renderer.height);
      const { x, y } = this.input.pointer;
      for (let i = 0; i < rects.length; i++) {
        if (pointInRect(x, y, rects[i])) {
          this.pauseAction(i);
          return;
        }
      }
    }
  }

  private pauseAction(i: number): void {
    switch (i) {
      case 0: this.phase = "playing"; break;
      case 1: this.beginPlaying(); break;
      case 2: this.audio.toggleMute(); this.persistSettings(); break;
      case 3: this.reducedMotion = !this.reducedMotion; this.persistSettings(); break;
      case 4: this.phase = "title"; break;
    }
  }

  private persistSettings(): void {
    saveSettings({ muted: this.audio.muted, reducedMotion: this.reducedMotion });
  }

  // ── render ─────────────────────────────────────────────────────────────

  private render(): void {
    const r = this.renderer;
    const w = this.world;
    const vw = r.width;
    const vh = r.height;

    r.beginFrame(this.camera);

    // World (skipped detail on the title screen — show a calm empty map).
    const shake = this.reducedMotion ? 0 : w.shake;
    const sx = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    r.beginWorld(this.camera, sx, sy);
    const ctx = r.ctx;
    if (this.phase !== "title") {
      // Viewport culling: only draw what is on (or near) screen.
      const vb = this.camera.viewBounds(90);
      const vis = (x: number, y: number, pad = 0) =>
        x >= vb.minX - pad && x <= vb.maxX + pad && y >= vb.minY - pad && y <= vb.maxY + pad;

      for (const h of w.hazards) if (vis(h.x, h.y, h.radius)) drawHazard(ctx, h);
      for (const c of w.clouds) if (vis(c.x, c.y, c.radius)) drawPoisonCloud(ctx, c);
      drawGazeCone(ctx, w);
      drawTailSlam(ctx, w);
      for (const p of w.prey) if (vis(p.x, p.y, p.radius)) drawPrey(ctx, p);
      for (const proj of w.projectiles) if (vis(proj.x, proj.y, 12)) drawArrow(ctx, proj);
      for (const e of w.enemies) {
        if (!vis(e.x, e.y, e.radius * 3)) continue; // weasel/tail feathers extend
        switch (e.kind) {
          case "rooster": drawRooster(ctx, e, this.renderTime); break;
          case "mirrorBearer": drawMirrorBearer(ctx, e); break;
          case "hunter": drawHunter(ctx, e); break;
          case "knight": drawKnight(ctx, e); break;
          case "priest": drawPriest(ctx, e); break;
          case "roosterHandler": drawRoosterHandler(ctx, e, this.renderTime); break;
          case "weasel": drawWeasel(ctx, e, this.renderTime); break;
        }
      }
      for (const wave of w.waves) drawSoundWave(ctx, wave);
      drawBasilisk(ctx, w, this.renderTime);
      for (const part of w.particles) if (vis(part.x, part.y, part.size)) drawParticle(ctx, part);
      for (const t of w.texts) if (vis(t.x, t.y, 40)) drawFloatText(ctx, t);
    } else {
      drawBasilisk(ctx, w, this.renderTime);
    }
    r.endWorld();

    r.drawVignette();

    // Screen flashes (suppressed under reduced-motion).
    if (!this.reducedMotion && w.hurtFlash > 0) {
      ctx.fillStyle = withAlpha(COLORS.vermilion, w.hurtFlash * 0.3);
      ctx.fillRect(0, 0, vw, vh);
    }
    if (!this.reducedMotion && w.goldFlash > 0) {
      ctx.fillStyle = withAlpha(COLORS.goldLight, w.goldFlash * 0.22);
      ctx.fillRect(0, 0, vw, vh);
    }

    // Screen-space UI.
    switch (this.phase) {
      case "title":
        drawTitle(ctx, vw, vh, this.renderTime, this.best, this.meta.souls);
        break;
      case "playing":
        drawHud(ctx, w, vw, vh, this.audio.muted);
        break;
      case "paused": {
        drawHud(ctx, w, vw, vh, this.audio.muted);
        const { x, y } = this.input.pointer;
        const prects = pauseButtonRects(vw, vh);
        let hover = -1;
        for (let i = 0; i < prects.length; i++) if (pointInRect(x, y, prects[i])) hover = i;
        drawPause(ctx, vw, vh, this.audio.muted, this.reducedMotion, hover);
        break;
      }
      case "levelUp":
        drawHud(ctx, w, vw, vh, this.audio.muted);
        drawLevelUp(ctx, this.offers, levelUpCardRects(vw, vh, this.offers.length), this.hoverCard(), vw, vh);
        break;
      case "stageClear":
        drawHud(ctx, w, vw, vh, this.audio.muted);
        drawStageClear(ctx, MAPS[w.mapIndex].name, MAPS[this.nextMapIndex].name, vw, vh, this.renderTime);
        break;
      case "gameOver":
        drawGameOver(ctx, w, vw, vh, this.renderTime, this.best);
        break;
      case "win":
        drawWin(ctx, w, vw, vh, this.renderTime, this.best);
        break;
    }

    // Virtual joystick (touch / drag) while playing.
    if (this.phase === "playing" && this.input.pointerDown && this.input.dragOrigin) {
      this.drawJoystick(ctx);
    }
  }

  private drawJoystick(ctx: CanvasRenderingContext2D): void {
    const o = this.input.dragOrigin!;
    const p = this.input.pointer;
    const R = 58;
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const len = Math.hypot(dx, dy) || 1;
    const k = len > R ? R / len : 1;
    const kx = o.x + dx * k;
    const ky = o.y + dy * k;
    ctx.strokeStyle = withAlpha(COLORS.ink, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x, o.y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = withAlpha(COLORS.gold, 0.5);
    ctx.beginPath();
    ctx.arc(kx, ky, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha(COLORS.ink, 0.6);
    ctx.beginPath();
    ctx.arc(kx, ky, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  private hoverCard(): number {
    const { x, y } = this.input.pointer;
    const rects = levelUpCardRects(this.renderer.width, this.renderer.height, this.offers.length);
    for (let i = 0; i < rects.length; i++) if (pointInRect(x, y, rects[i])) return i;
    return -1;
  }
}
