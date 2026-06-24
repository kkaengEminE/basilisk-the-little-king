// Procedural audio — zero asset files, all synthesized with the Web Audio API.
// Short SFX (tones + filtered noise envelopes) plus a sparse, medieval-flavored
// ambient bed (a low drone and an occasional plucked note). The context is
// created lazily on a user gesture (browser autoplay policy), and everything
// no-ops gracefully until then or when muted.

const ROOT = 220; // A3 — the tonal centre

type Wave = OscillatorType;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private droneNodes: OscillatorNode[] = [];
  private melodyTimer: number | null = null;
  muted = false;
  private musicStarted = false;

  get enabled(): boolean {
    return this.ctx !== null;
  }

  /** Create / resume the context. Must be called from a user gesture. */
  ensure(): void {
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  }

  private tone(freq: number, dur: number, type: Wave, vol: number, slideTo?: number, when = 0): void {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  private noise(dur: number, vol: number, lp = 2000, when = 0): void {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + when;
    const n = Math.max(1, Math.floor(dur * this.ctx.sampleRate));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  }

  private arp(semis: number[], step: number, type: Wave, vol: number): void {
    semis.forEach((s, i) => this.tone(ROOT * Math.pow(2, s / 12), step * 1.7, type, vol, undefined, i * step));
  }

  /** Play a sound by event tag (see systems' sfx() calls). */
  play(tag: string): void {
    if (!this.ctx || this.muted) return;
    switch (tag) {
      case "eat": this.tone(320, 0.09, "square", 0.16, 520); break;
      case "gaze": this.tone(660, 0.13, "sine", 0.09, 210); break;
      case "poison": this.noise(0.22, 0.1, 900); this.tone(180, 0.2, "sine", 0.05, 120); break;
      case "tail": this.noise(0.18, 0.22, 520); this.tone(110, 0.18, "sine", 0.18, 70); break;
      case "hit": this.tone(200, 0.16, "square", 0.2, 70); this.noise(0.12, 0.12, 1200); break;
      case "reflect": this.tone(900, 0.12, "triangle", 0.16, 1320); break;
      case "arrow": this.noise(0.06, 0.09, 3200); break;
      case "crow": this.tone(520, 0.07, "square", 0.15, 720); this.tone(700, 0.08, "square", 0.13, 420, 0.07); break;
      case "summon": this.tone(150, 0.12, "square", 0.15, 260); break;
      case "levelUp": this.arp([0, 4, 7, 12], 0.09, "triangle", 0.17); break;
      case "evolve": this.arp([0, 3, 7, 10, 12], 0.11, "sawtooth", 0.15); this.tone(440, 0.5, "sine", 0.07, 660, 0.12); break;
      case "pick": this.tone(660, 0.1, "triangle", 0.15, 990); break;
      case "stageClear": this.arp([0, 4, 7, 12, 16], 0.1, "triangle", 0.17); break;
      case "win": this.arp([0, 4, 7, 12, 7, 12, 16], 0.12, "sawtooth", 0.19); break;
      case "lose": this.arp([12, 10, 7, 3, 0], 0.16, "sawtooth", 0.17); break;
    }
  }

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicStarted) return;
    this.musicStarted = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 620;
    lp.connect(this.musicGain);
    // Low drone: a tonic, a fifth-ish, and a minor third, gently detuned.
    for (const [f, detune] of [
      [110, 0],
      [110, 5],
      [164.81, -4],
    ]) {
      const o = this.ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = 0.16;
      o.connect(g);
      g.connect(lp);
      o.start();
      this.droneNodes.push(o);
    }
    // Sparse plucked melody on a slow tick.
    const notes = [0, 3, 5, 7, 10, 12];
    this.melodyTimer = window.setInterval(() => {
      if (!this.ctx || this.muted) return;
      if (Math.random() < 0.68) {
        const s = notes[Math.floor(Math.random() * notes.length)] + (Math.random() < 0.3 ? 12 : 0);
        this.pluck(ROOT * Math.pow(2, s / 12), 0.55);
      }
    }, 1450);
  }

  /** Stop the ambient bed (drones + melody). */
  stopMusic(): void {
    if (this.melodyTimer !== null) {
      clearInterval(this.melodyTimer);
      this.melodyTimer = null;
    }
    for (const o of this.droneNodes) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.droneNodes = [];
    this.musicStarted = false;
  }

  private pluck(freq: number, dur: number): void {
    if (!this.ctx || !this.musicGain) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.1, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
}
