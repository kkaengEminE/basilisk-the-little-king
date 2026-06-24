// Medieval manuscript pigment palette. Colors are drawn from the kinds of
// inks and paints used in illuminated bestiaries: iron-gall ink, vermilion,
// gold leaf, verdigris, lapis, and aged parchment. Biomes can tint the
// parchment base while keeping the ink language consistent.

export const COLORS = {
  // Parchment / vellum tones
  parchment: "#d9c39a",
  parchmentLight: "#e7d6b0",
  parchmentDark: "#c2a877",
  parchmentShadow: "#a98f5f",
  stain: "#b59866",
  stainDark: "#8f7647",

  // Inks & outlines
  ink: "#2a1c0f",
  inkSoft: "#4a361f",
  inkFaint: "#6b5436",

  // Pigments
  vermilion: "#b3402a", // reds — danger, roosters, blood
  vermilionDeep: "#7d2618",
  gold: "#c9a227", // crowns, XP, evolution
  goldLight: "#e6c84e",
  verdigris: "#4f7a5b", // greens — poison, forest
  verdigrisDeep: "#33503b",
  lapis: "#33518a", // blues — water, priests, mirrors
  lapisLight: "#5b7fb8",
  bone: "#efe6cf", // highlights, bone-white prey
  petrify: "#9a9486", // stone-grey for petrified enemies

  // Basilisk body
  basilisk: "#5d7d3a",
  basiliskDark: "#3c5224",
  basiliskBelly: "#b7b06a",
  crest: "#b3402a",
} as const;

export type ColorName = keyof typeof COLORS;

/** Convert "#rrggbb" + alpha to an rgba() string. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
