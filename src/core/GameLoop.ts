// Fixed-timestep game loop with an accumulator. Simulation advances in
// constant FIXED_DT steps (stable physics/feel regardless of display rate);
// rendering happens once per animation frame with an interpolation alpha.

export const FIXED_DT = 1 / 60; // seconds per simulation step
const MAX_FRAME = 0.25; // clamp huge gaps (tab was backgrounded)

export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly update: UpdateFn,
    private readonly render: RenderFn,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > MAX_FRAME) frameTime = MAX_FRAME;

    this.accumulator += frameTime;
    let steps = 0;
    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
      // Hard cap to avoid a spiral of death on a slow machine.
      if (++steps > 6) {
        this.accumulator = 0;
        break;
      }
    }

    this.render(this.accumulator / FIXED_DT);
  };
}
