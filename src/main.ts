// Entry point: wires the canvas to the Game and starts the loop.

import { Game } from "./core/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const boot = document.getElementById("boot");
if (boot) boot.remove();

const game = new Game(canvas);
game.start();
