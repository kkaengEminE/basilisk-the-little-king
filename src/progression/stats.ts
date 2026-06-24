// The mutable bundle of player stats. Upgrades and evolutions modify these
// numbers; weapons and systems read them. Starting values define the Egg /
// freshly-hatched Young Basilisk baseline (tuned for a forgiving early game).

export interface PlayerStats {
  maxHp: number;
  regen: number; // hp per second
  moveSpeed: number; // world units / second
  turnRate: number; // radians / second

  // Petrifying Gaze
  gazeRange: number;
  gazeHalfAngle: number; // radians, each side of facing
  gazeCooldown: number; // seconds
  gazeDamage: number;
  petrifyThreshold: number; // enemies at/under this max-hp are instantly petrified
  gazeEvolved: boolean; // "Medusa's Regard": petrifies any prey, regardless of hp

  // Poison Breath
  poisonEnabled: boolean;
  poisonRange: number;
  poisonHalfAngle: number;
  poisonCooldown: number;
  poisonDps: number;
  poisonDuration: number; // cloud lifetime

  // Tail Slam (radial knockback; muddies water / covers mirrors)
  tailEnabled: boolean;
  tailRadius: number;
  tailCooldown: number;
  tailKnockback: number;
  tailDamage: number;

  // Resistances (0..1 fraction of damage removed)
  reflectResist: number;
  roosterResist: number;
  armor: number; // 0..1 flat fraction off ALL incoming damage

  // Utility
  magnet: number; // radius within which prey drift toward the basilisk
  fearAura: number; // radius within which enemies slow / flee
  xpGain: number; // multiplier on XP gained
  pickupRange: number; // bonus to eat radius
  lifesteal: number; // HP restored per enemy slain
}

export function createStats(): PlayerStats {
  return {
    maxHp: 100,
    regen: 0.8,
    moveSpeed: 155,
    turnRate: Math.PI * 2.5,

    gazeRange: 190,
    gazeHalfAngle: Math.PI / 7, // ~25 degrees each side
    gazeCooldown: 1.1,
    gazeDamage: 26,
    petrifyThreshold: 18,
    gazeEvolved: false,

    poisonEnabled: false,
    poisonRange: 150,
    poisonHalfAngle: Math.PI / 9,
    poisonCooldown: 1.6,
    poisonDps: 22,
    poisonDuration: 2.2,

    tailEnabled: false,
    tailRadius: 130,
    tailCooldown: 2.6,
    tailKnockback: 260,
    tailDamage: 18,

    reflectResist: 0,
    roosterResist: 0,
    armor: 0,

    // Innate "devouring pull": prey within this radius drift into the maw,
    // so the eat-to-grow loop is forgiving (Vampire-Survivors-style pickup).
    magnet: 115,
    fearAura: 0,
    xpGain: 1,
    pickupRange: 7,
    lifesteal: 0,
  };
}
