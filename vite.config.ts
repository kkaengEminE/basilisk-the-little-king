import { defineConfig } from "vite";

// Zero runtime dependencies: the game is plain TypeScript + Canvas 2D.
// Vite is dev/build tooling only. Vitest config lives here too.
export default defineConfig({
  base: "./",
  build: {
    target: "es2021",
    outDir: "dist",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
