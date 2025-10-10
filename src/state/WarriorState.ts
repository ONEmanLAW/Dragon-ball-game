// src/state/WarriorState.ts
/*
 * Pattern : STATE
 * ------------------------------------------------------------------
 * Rôle :
 *  - Chaque état modifie le coût en Ki et/ou les dégâts sortants.
 *  - Les transitions d’état NE SONT PAS gérées ici, mais par Warrior.recomputeState()
 *    (ex: Injured si PV ≤ 10%, Exhausted si Ki ≤ 10%).
 *
 * Notes d’implémentation :
 *  - On centralise les coefficients dans des constantes pour clarifier et
 *    faciliter les ajustements sans toucher à la logique des classes.
 *  - Aucun console.log ici : ce module ne produit pas de sortie.
 */

//#region State types
export type WarriorStateName = "Normal" | "Injured" | "Exhausted";

export interface WarriorState {
  readonly name: WarriorStateName;

  // -- Ajuste les dégâts -- //
  adjustOutgoingDamage(baseDamage: number): number;

  // -- Ajuste le cout -- //
  adjustKiCost(baseCost: number): number;
}

//#endregion

//#region State constants
/*
  =========================
   === State constants ===
  =========================
  Coefficients applicables par état :
  - Normal    : neutre
  - Injured   : dégâts -20%
  - Exhausted : dégâts -10%, coût Ki +20%
*/
const NORMAL_DAMAGE_MULTIPLIER = 1.0 as const;
const NORMAL_KI_COST_MULTIPLIER = 1.0 as const;

const INJURED_DAMAGE_MULTIPLIER = 0.8 as const;  // -20%
const INJURED_KI_COST_MULTIPLIER = 1.0 as const;

const EXHAUSTED_DAMAGE_MULTIPLIER = 0.9 as const; // -10%
const EXHAUSTED_KI_COST_MULTIPLIER = 1.2 as const; // +20%

/** Règle d'arrondi */
function roundDownInt(value: number): number {
  return Math.floor(value);
}

//#endregion

//#region Concrete states

// -- Normal State -- //
export class NormalState implements WarriorState {
  public readonly name = "Normal";

  adjustOutgoingDamage(base: number): number {
    return roundDownInt(base * NORMAL_DAMAGE_MULTIPLIER);
  }
  adjustKiCost(base: number): number {
    return roundDownInt(base * NORMAL_KI_COST_MULTIPLIER);
  }
}

// -- Injured: damage -20% -- //
export class InjuredState implements WarriorState {
  public readonly name = "Injured";

  adjustOutgoingDamage(base: number): number {
    return roundDownInt(base * INJURED_DAMAGE_MULTIPLIER);
  }
  adjustKiCost(base: number): number {
    return roundDownInt(base * INJURED_KI_COST_MULTIPLIER);
  }
}

// -- Exhausted: damage -10%, cout en Ki +20% -- //
export class ExhaustedState implements WarriorState {
  public readonly name = "Exhausted";

  adjustOutgoingDamage(base: number): number {
    return roundDownInt(base * EXHAUSTED_DAMAGE_MULTIPLIER);
  }
  adjustKiCost(base: number): number {
    return roundDownInt(base * EXHAUSTED_KI_COST_MULTIPLIER);
  }
}

//#endregion








/*
 * Extension future :
 * - Ajouter un nouvel état (ex: "SuperSaiyan") :
 *     export class SuperSaiyanState implements WarriorState { ... }
 * - Garder la transition d’état dans Warrior.recomputeState()
 *   pour respecter le Pattern STATE et éviter les dépendances circulaires.
 */
