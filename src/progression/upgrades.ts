// Level-up upgrade catalog. Each upgrade mutates the PlayerStats bundle.
// Offers are a weighted random draw of distinct, currently-available upgrades,
// respecting per-upgrade stack caps and gating (e.g. poison sub-upgrades only
// appear once Poison Breath is unlocked).

import type { Rng } from "../core/rng";
import { clamp } from "../core/math";
import type { PlayerStats } from "./stats";

export type UpgradeCategory = "gaze" | "poison" | "tail" | "defense" | "move" | "utility";

export interface Upgrade {
  id: string;
  name: string;
  desc: string;
  category: UpgradeCategory;
  max: number; // maximum stacks
  weight: number; // relative draw weight
  apply: (s: PlayerStats) => void;
  /** Optional extra gate beyond stack count (receives current ownership). */
  available?: (s: PlayerStats, owned: Record<string, number>) => boolean;
}

const maxed = (owned: Record<string, number>, id: string, n: number): boolean => (owned[id] ?? 0) >= n;

const GAZE_CD_MIN = 0.4;
const RESIST_CAP = 0.8;

export const UPGRADES: Upgrade[] = [
  // — Petrifying Gaze —
  {
    id: "gaze_range",
    name: "Withering Stare",
    desc: "+22% gaze range",
    category: "gaze",
    max: 5,
    weight: 10,
    apply: (s) => (s.gazeRange *= 1.22),
  },
  {
    id: "gaze_angle",
    name: "Wide Gaze",
    desc: "+30% gaze cone angle",
    category: "gaze",
    max: 4,
    weight: 9,
    apply: (s) => (s.gazeHalfAngle = clamp(s.gazeHalfAngle * 1.3, 0, Math.PI / 2)),
  },
  {
    id: "gaze_power",
    name: "Eyes of Stone",
    desc: "+10 gaze damage, petrify tougher prey",
    category: "gaze",
    max: 6,
    weight: 10,
    apply: (s) => {
      s.gazeDamage += 10;
      s.petrifyThreshold += 10;
    },
  },
  {
    id: "gaze_cd",
    name: "Unblinking",
    desc: "-18% gaze cooldown",
    category: "gaze",
    max: 4,
    weight: 8,
    apply: (s) => (s.gazeCooldown = Math.max(GAZE_CD_MIN, s.gazeCooldown * 0.82)),
  },

  // — Poison Breath —
  {
    id: "poison_unlock",
    name: "Venom Breath",
    desc: "Unlock Poison Breath: a lingering toxic cloud",
    category: "poison",
    max: 1,
    weight: 12,
    apply: (s) => (s.poisonEnabled = true),
    available: (s) => !s.poisonEnabled,
  },
  {
    id: "poison_power",
    name: "Bilious Fume",
    desc: "+40% poison damage",
    category: "poison",
    max: 5,
    weight: 9,
    apply: (s) => (s.poisonDps *= 1.4),
    available: (s) => s.poisonEnabled,
  },
  {
    id: "poison_width",
    name: "Choking Spread",
    desc: "+28% poison width & range",
    category: "poison",
    max: 4,
    weight: 8,
    apply: (s) => {
      s.poisonHalfAngle = clamp(s.poisonHalfAngle * 1.28, 0, Math.PI / 2);
      s.poisonRange *= 1.18;
    },
    available: (s) => s.poisonEnabled,
  },
  {
    id: "poison_duration",
    name: "Lingering Miasma",
    desc: "+40% poison cloud duration",
    category: "poison",
    max: 3,
    weight: 7,
    apply: (s) => (s.poisonDuration *= 1.4),
    available: (s) => s.poisonEnabled,
  },

  // — Tail Slam —
  {
    id: "tail_unlock",
    name: "Tail Slam",
    desc: "Unlock Tail Slam: a shockwave that muddies water & covers mirrors",
    category: "tail",
    max: 1,
    weight: 11,
    apply: (s) => (s.tailEnabled = true),
    available: (s) => !s.tailEnabled,
  },
  {
    id: "tail_radius",
    name: "Sweeping Coil",
    desc: "+25% tail slam radius",
    category: "tail",
    max: 4,
    weight: 8,
    apply: (s) => (s.tailRadius *= 1.25),
    available: (s) => s.tailEnabled,
  },
  {
    id: "tail_power",
    name: "Crushing Blow",
    desc: "+50% tail slam damage & knockback",
    category: "tail",
    max: 5,
    weight: 8,
    apply: (s) => {
      s.tailDamage *= 1.5;
      s.tailKnockback *= 1.3;
    },
    available: (s) => s.tailEnabled,
  },
  {
    id: "tail_cooldown",
    name: "Restless Tail",
    desc: "-18% tail slam cooldown",
    category: "tail",
    max: 4,
    weight: 7,
    apply: (s) => (s.tailCooldown = Math.max(0.8, s.tailCooldown * 0.82)),
    available: (s) => s.tailEnabled,
  },

  // — Weapon evolutions (appear once the core upgrade is fully maxed) —
  {
    id: "gaze_evo",
    name: "★ Medusa's Regard",
    desc: "EVOLUTION: your gaze petrifies ANY prey + heavy damage",
    category: "gaze",
    max: 1,
    weight: 30,
    apply: (s) => {
      s.gazeEvolved = true;
      s.gazeDamage += 30;
      s.gazeRange *= 1.2;
    },
    available: (_s, owned) => maxed(owned, "gaze_power", 6),
  },
  {
    id: "poison_evo",
    name: "★ Plague Wind",
    desc: "EVOLUTION: vast, long-lasting, far deadlier toxic clouds",
    category: "poison",
    max: 1,
    weight: 30,
    apply: (s) => {
      s.poisonDps *= 1.8;
      s.poisonDuration *= 1.6;
      s.poisonHalfAngle = clamp(s.poisonHalfAngle * 1.3, 0, Math.PI / 2);
      s.poisonRange *= 1.2;
    },
    available: (s, owned) => s.poisonEnabled && maxed(owned, "poison_power", 5),
  },
  {
    id: "tail_evo",
    name: "★ Worldquake",
    desc: "EVOLUTION: a sweeping, bone-breaking shockwave",
    category: "tail",
    max: 1,
    weight: 30,
    apply: (s) => {
      s.tailDamage *= 1.8;
      s.tailRadius *= 1.3;
      s.tailKnockback *= 1.4;
      s.tailCooldown = Math.max(0.6, s.tailCooldown * 0.8);
    },
    available: (s, owned) => s.tailEnabled && maxed(owned, "tail_power", 5),
  },

  // — Defense / resistances —
  {
    id: "reflect_resist",
    name: "Veiled Eyes",
    desc: "+20% reflection resistance (mirrors & water)",
    category: "defense",
    max: 4,
    weight: 7,
    apply: (s) => (s.reflectResist = clamp(s.reflectResist + 0.2, 0, RESIST_CAP)),
  },
  {
    id: "rooster_resist",
    name: "Deaf to the Cock-Crow",
    desc: "+20% rooster-cry resistance",
    category: "defense",
    max: 4,
    weight: 9,
    apply: (s) => (s.roosterResist = clamp(s.roosterResist + 0.2, 0, RESIST_CAP)),
  },
  {
    id: "max_hp",
    name: "Scaled Hide",
    desc: "+25 max vitality (and heal)",
    category: "defense",
    max: 8,
    weight: 10,
    apply: (s) => (s.maxHp += 25),
  },
  {
    id: "regen",
    name: "Serpent's Mend",
    desc: "+1.0 health regeneration / s",
    category: "defense",
    max: 5,
    weight: 7,
    apply: (s) => (s.regen += 1.0),
  },
  {
    id: "armor",
    name: "Stone Skin",
    desc: "+12% reduction to all incoming damage",
    category: "defense",
    max: 4,
    weight: 8,
    apply: (s) => (s.armor = clamp(s.armor + 0.12, 0, 0.6)),
  },
  {
    id: "lifesteal",
    name: "Carrion Feast",
    desc: "Heal +4 each time a foe is slain",
    category: "defense",
    max: 4,
    weight: 7,
    apply: (s) => (s.lifesteal += 4),
  },

  // — Movement —
  {
    id: "move_speed",
    name: "Quickening Coils",
    desc: "+12% movement speed",
    category: "move",
    max: 5,
    weight: 9,
    apply: (s) => (s.moveSpeed *= 1.12),
  },
  {
    id: "turn_rate",
    name: "Sinuous Grace",
    desc: "+20% turning speed",
    category: "move",
    max: 4,
    weight: 6,
    apply: (s) => (s.turnRate *= 1.2),
  },

  // — Utility —
  {
    id: "magnet",
    name: "Hunger's Pull",
    desc: "+60 prey-attraction radius",
    category: "utility",
    max: 4,
    weight: 7,
    apply: (s) => (s.magnet += 60),
  },
  {
    id: "fear_aura",
    name: "Dread Aura",
    desc: "+70 radius that slows nearby foes",
    category: "utility",
    max: 3,
    weight: 6,
    apply: (s) => (s.fearAura += 70),
  },
  {
    id: "xp_gain",
    name: "Devourer's Wisdom",
    desc: "+20% experience gained",
    category: "utility",
    max: 4,
    weight: 6,
    apply: (s) => (s.xpGain += 0.2),
  },
];

const BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));

export const getUpgrade = (id: string): Upgrade | undefined => BY_ID.get(id);

/** Is this upgrade currently offerable given stats and how many are owned? */
export function isAvailable(u: Upgrade, stats: PlayerStats, owned: Record<string, number>): boolean {
  if ((owned[u.id] ?? 0) >= u.max) return false;
  if (u.available && !u.available(stats, owned)) return false;
  return true;
}

/** Draw up to `n` distinct available upgrades by weight. */
export function offerUpgrades(
  rng: Rng,
  stats: PlayerStats,
  owned: Record<string, number>,
  n = 3,
): Upgrade[] {
  const pool = UPGRADES.filter((u) => isAvailable(u, stats, owned));
  const chosen: Upgrade[] = [];
  const remaining = [...pool];
  while (chosen.length < n && remaining.length > 0) {
    const total = remaining.reduce((acc, u) => acc + u.weight, 0);
    let roll = rng.next() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      roll -= remaining[i].weight;
      if (roll <= 0) {
        idx = i;
        break;
      }
    }
    chosen.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return chosen;
}

/** Record a taken upgrade and apply its effect to stats. */
export function takeUpgrade(u: Upgrade, stats: PlayerStats, owned: Record<string, number>): void {
  owned[u.id] = (owned[u.id] ?? 0) + 1;
  u.apply(stats);
}
