// Balance : source de vérité (coûts, multiplicateurs, durées, labels, stats)

import type { WarriorType, WarriorStats } from "./Warrior";

//#region Rounds / règles
export const SPECIAL_UNLOCK_TURN   = 3 as const; // Spéciale à partir de ce round
export const EFFECT_DEFAULT_ROUNDS = 2 as const; // Durée standard des effets
//#endregion

//#region Attaques
export const NORMAL_ATTACK_KI_COST        = 5 as const;
export const NORMAL_STRENGTH_MULTIPLIER   = 1.0 as const;
export const NORMAL_ATTACK_NAME           = "Basic Attack" as const;

export const KI_ENERGY_ATTACK_KI_COST     = 20 as const;
export const KI_ENERGY_STRENGTH_MULTIPLIER = 1.5 as const;

// Label UI par race pour l'attaque Ki/Energy (affichage only)
export const KI_ENERGY_ATTACK_NAME_BY_RACE: Record<WarriorType, string> = {
  Saiyan:   "KI Energy (KAMEHAMEHA / FINAL FLASH)",
  Namekian: "KI Energy (MAKANKOSAPPO)",
  Android:  "KI Energy (LASER SHOT)",
};

export const SPECIAL_ATTACK_KI_COST = 0 as const;
// Label UI de la Spéciale par race
export const SPECIAL_LABEL_BY_RACE: Record<WarriorType, string> = {
  Saiyan:   "Super Saiyan",
  Namekian: "Regeneration",
  Android:  "Energy Leech",
};

export const SPECIAL_REQUIRED_KI       = 30 as const;   // Ki minimal pour transformer
export const SPECIAL_LOW_HEALTH_RATIO  = 0.25 as const; // ou PV ≤ 25% autorise aussi
//#endregion

export const KI_CHOICES_BY_RACE: Record<WarriorType, string[]> = {
  Saiyan:   ["Kamehameha", "Final Flash"],
  Namekian: ["Makankōsappō"],
  Android:  ["Laser Shot"],
};

//#region Effets spéciaux
export const SSJ_STR_MULTIPLIER = 1.3 as const; // +20% STR/SPD
export const SSJ_SPD_MULTIPLIER = 1.2 as const; // +20% STR/SPD

export const REGEN_KI_PER_TICK  = 12 as const; // +KI par action
export const REGEN_VIT_PER_TICK = 12 as const; // +VIT par action

export const LEECH_KI_PER_TICK  = 12 as const; // -KI sur la cible par action
//#endregion

//#region State principal
export const STATE_NORMAL_DAMAGE_MULT     = 1.0 as const;
export const STATE_NORMAL_KI_COST_MULT    = 1.0 as const;

export const STATE_INJURED_DAMAGE_MULT    = 0.8 as const; // -20% dmg
export const STATE_INJURED_KI_COST_MULT   = 1.0 as const;

export const STATE_EXHAUSTED_DAMAGE_MULT  = 0.9 as const; // -10% dmg
export const STATE_EXHAUSTED_KI_COST_MULT = 1.2 as const; // +20% cost
//#endregion

//#region Stats de base par race
export const DEFAULT_STATS_BY_RACE: Record<WarriorType, WarriorStats> = {
  Saiyan:   { strength: 20, ki: 100,  speed: 20, vitality: 120 },
  Namekian: { strength: 18, ki: 110,  speed: 18, vitality: 130 },
  Android:  { strength: 16, ki: 9999, speed: 16, vitality: 100 },
};
//#endregion
