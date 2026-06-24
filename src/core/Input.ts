// Keyboard + pointer input. Movement is the ONLY gameplay control
// (weapons auto-fire), so this mostly produces a normalized movement
// vector. Pointer state drives menu/level-up screen interaction.

import { normalize, type Vec2 } from "./math";

const LEFT = new Set(["arrowleft", "a"]);
const RIGHT = new Set(["arrowright", "d"]);
const UP = new Set(["arrowup", "w"]);
const DOWN = new Set(["arrowdown", "s"]);

export class Input {
  private down = new Set<string>();
  private pressedThisFrame = new Set<string>();
  /** Pointer position in CSS pixels relative to the canvas. */
  readonly pointer: Vec2 = { x: 0, y: 0 };
  pointerDown = false;
  /** Set on the frame a click is released; consume via takeClick(). */
  private clicked = false;

  constructor(private readonly target: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("blur", this.onBlur);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("pointermove", this.onPointerMove);
    this.target.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("blur", this.onBlur);
  }

  /** Normalized movement direction from WASD / arrow keys ({0,0} if idle). */
  moveVector(): Vec2 {
    let x = 0;
    let y = 0;
    for (const k of this.down) {
      if (LEFT.has(k)) x -= 1;
      else if (RIGHT.has(k)) x += 1;
      else if (UP.has(k)) y -= 1;
      else if (DOWN.has(k)) y += 1;
    }
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    return normalize({ x, y });
  }

  isDown(key: string): boolean {
    return this.down.has(key.toLowerCase());
  }

  /** True only on the frame the key transitioned to down. */
  wasPressed(key: string): boolean {
    return this.pressedThisFrame.has(key.toLowerCase());
  }

  /** True on any frame a key was first pressed (used for "press any key"). */
  anyPressed(): boolean {
    return this.pressedThisFrame.size > 0;
  }

  /** Consume a pending click (true once per release). */
  takeClick(): boolean {
    if (this.clicked) {
      this.clicked = false;
      return true;
    }
    return false;
  }

  /** Call at the end of each frame to clear edge-triggered state. */
  endFrame(): void {
    this.pressedThisFrame.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (!this.down.has(k)) this.pressedThisFrame.add(k);
    this.down.add(k);
    // Stop the page from scrolling on arrows/space.
    if (k.startsWith("arrow") || k === " ") e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.key.toLowerCase());
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.target.getBoundingClientRect();
    this.pointer.x = e.clientX - rect.left;
    this.pointer.y = e.clientY - rect.top;
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDown = true;
    this.onPointerMove(e);
  };

  private onPointerUp = (): void => {
    if (this.pointerDown) this.clicked = true;
    this.pointerDown = false;
  };

  private onBlur = (): void => {
    this.down.clear();
    this.pointerDown = false;
  };
}
