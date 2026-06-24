// Map / biome definitions. Phase 1 fully implements the Forest; the later
// biomes are sketched here (theme + pacing) so the stage progression in
// later phases can slot in without restructuring. Each map is a "survive the
// timeline" stage: endure `duration` seconds of escalating spawns to clear it.

import type { PreyKind } from "../entities/types";
import type { ParchmentTheme } from "../render/parchment";
import { COLORS } from "../render/palette";

export interface PreyWeight {
  kind: PreyKind;
  weight: number;
}

export type HumanKind = "hunter" | "knight" | "priest" | "roosterHandler";

export interface HumanWeight {
  kind: HumanKind;
  weight: number;
}

export interface MapDef {
  name: string;
  seed: number;
  theme: ParchmentTheme;
  duration: number; // seconds to survive for a stage clear
  preyCap: number; // target simultaneous prey
  preyInterval: number; // seconds between prey spawn attempts
  preyWeights: PreyWeight[];
  roosterFirst: number; // seconds before the first rooster
  roosterEvery: number; // base seconds between rooster spawns
  roosterCapBase: number; // starting concurrent rooster cap
  waterCount: number; // static reflective ponds scattered at stage start
  mirrorBearerFirst: number; // seconds before the first mirror-bearer
  mirrorBearerEvery: number; // seconds between mirror-bearer spawns
  mirrorBearerCap: number; // concurrent mirror-bearer cap
  humanFirst: number; // seconds before the first human (hunter/knight/...)
  humanEvery: number; // seconds between human spawns
  humanCap: number; // concurrent human cap
  humanWeights: HumanWeight[]; // which humans this biome fields
}

const FOREST_THEME: ParchmentTheme = {
  base: COLORS.parchment,
  light: COLORS.parchmentLight,
  dark: COLORS.parchmentDark,
  tint: COLORS.verdigris,
  tintAlpha: 0.07,
};

const FARM_THEME: ParchmentTheme = {
  base: "#dcc189",
  light: "#ecd6a4",
  dark: "#c2a263",
  tint: COLORS.gold,
  tintAlpha: 0.08,
};

const MONASTERY_THEME: ParchmentTheme = {
  base: "#d6cdb4",
  light: "#e8e1cc",
  dark: "#bcae8e",
  tint: COLORS.lapis,
  tintAlpha: 0.06,
};

const CASTLE_THEME: ParchmentTheme = {
  base: "#cdbfa1",
  light: "#ddd0b4",
  dark: "#a99372",
  tint: COLORS.inkSoft,
  tintAlpha: 0.07,
};

const KINGDOM_THEME: ParchmentTheme = {
  base: "#d9c39a",
  light: "#ece0bd",
  dark: "#bfa473",
  tint: COLORS.vermilion,
  tintAlpha: 0.06,
};

export const MAPS: MapDef[] = [
  {
    name: "The Forest",
    seed: 1337,
    theme: FOREST_THEME,
    duration: 150,
    preyCap: 24,
    preyInterval: 0.7,
    preyWeights: [
      { kind: "mouse", weight: 5 },
      { kind: "rabbit", weight: 4 },
      { kind: "frog", weight: 3 },
      { kind: "boar", weight: 1 },
    ],
    roosterFirst: 18,
    roosterEvery: 10,
    roosterCapBase: 2,
    waterCount: 4,
    mirrorBearerFirst: 45,
    mirrorBearerEvery: 14,
    mirrorBearerCap: 2,
    humanFirst: 30,
    humanEvery: 12,
    humanCap: 3,
    humanWeights: [{ kind: "hunter", weight: 5 }],
  },
  // — Later phases (theme + pacing scaffolded) —
  {
    name: "The Farm",
    seed: 2024,
    theme: FARM_THEME,
    duration: 165,
    preyCap: 26,
    preyInterval: 0.65,
    preyWeights: [
      { kind: "mouse", weight: 4 },
      { kind: "rabbit", weight: 5 },
      { kind: "boar", weight: 2 },
    ],
    roosterFirst: 6,
    roosterEvery: 6,
    roosterCapBase: 4,
    waterCount: 3,
    mirrorBearerFirst: 50,
    mirrorBearerEvery: 16,
    mirrorBearerCap: 2,
    humanFirst: 25,
    humanEvery: 11,
    humanCap: 4,
    humanWeights: [
      { kind: "hunter", weight: 4 },
      { kind: "roosterHandler", weight: 3 },
    ],
  },
  {
    name: "The Monastery",
    seed: 4040,
    theme: MONASTERY_THEME,
    duration: 180,
    preyCap: 24,
    preyInterval: 0.7,
    preyWeights: [
      { kind: "mouse", weight: 4 },
      { kind: "frog", weight: 4 },
      { kind: "rabbit", weight: 3 },
    ],
    roosterFirst: 10,
    roosterEvery: 8,
    roosterCapBase: 3,
    waterCount: 5,
    mirrorBearerFirst: 20,
    mirrorBearerEvery: 10,
    mirrorBearerCap: 4,
    humanFirst: 20,
    humanEvery: 10,
    humanCap: 4,
    humanWeights: [
      { kind: "priest", weight: 4 },
      { kind: "hunter", weight: 3 },
    ],
  },
  {
    name: "The Castle",
    seed: 5151,
    theme: CASTLE_THEME,
    duration: 195,
    preyCap: 22,
    preyInterval: 0.75,
    preyWeights: [
      { kind: "rabbit", weight: 4 },
      { kind: "boar", weight: 3 },
      { kind: "mouse", weight: 3 },
    ],
    roosterFirst: 8,
    roosterEvery: 7,
    roosterCapBase: 4,
    waterCount: 4,
    mirrorBearerFirst: 30,
    mirrorBearerEvery: 12,
    mirrorBearerCap: 3,
    humanFirst: 15,
    humanEvery: 9,
    humanCap: 5,
    humanWeights: [
      { kind: "knight", weight: 4 },
      { kind: "hunter", weight: 3 },
      { kind: "priest", weight: 2 },
    ],
  },
  {
    name: "The Kingdom",
    seed: 9999,
    theme: KINGDOM_THEME,
    duration: 210,
    preyCap: 24,
    preyInterval: 0.7,
    preyWeights: [
      { kind: "rabbit", weight: 4 },
      { kind: "boar", weight: 4 },
      { kind: "frog", weight: 2 },
    ],
    roosterFirst: 5,
    roosterEvery: 5,
    roosterCapBase: 6,
    waterCount: 6,
    mirrorBearerFirst: 18,
    mirrorBearerEvery: 9,
    mirrorBearerCap: 5,
    humanFirst: 12,
    humanEvery: 8,
    humanCap: 6,
    humanWeights: [
      { kind: "knight", weight: 3 },
      { kind: "hunter", weight: 3 },
      { kind: "priest", weight: 2 },
      { kind: "roosterHandler", weight: 2 },
    ],
  },
];
