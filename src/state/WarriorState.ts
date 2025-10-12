// ────────────────────────────────────────────────────────────
// Pattern : State : variations de damage/cost par state
// Note : Les transitions sont dans Warrior.recomputeState()
// ────────────────────────────────────────────────────────────

//#region Types
export type WarriorStateName = "Normal" | "Injured" | "Exhausted";

export interface WarriorState {
  readonly name: WarriorStateName;
  adjustOutgoingDamage(baseDamage: number): number;
  adjustKiCost(baseCost: number): number;
}
//#endregion

//#region Coefficients
const NORMAL_DAMAGE_MULTIPLIER   = 1.0 as const;
const NORMAL_KI_COST_MULTIPLIER  = 1.0 as const;

const INJURED_DAMAGE_MULTIPLIER  = 0.8 as const;  // -20%
const INJURED_KI_COST_MULTIPLIER = 1.0 as const;

const EXHAUSTED_DAMAGE_MULTIPLIER  = 0.9 as const; // -10%
const EXHAUSTED_KI_COST_MULTIPLIER = 1.2 as const; // +20%

function roundDownInt(value: number): number { return Math.floor(value); }
//#endregion

//#region States
export class NormalState implements WarriorState {
  public readonly name = "Normal";

  adjustOutgoingDamage(base: number): number { 
    return roundDownInt(base * NORMAL_DAMAGE_MULTIPLIER); 
  }
  
  adjustKiCost(base: number): number { 
    return roundDownInt(base * NORMAL_KI_COST_MULTIPLIER); 
  }
}

export class InjuredState implements WarriorState {
  public readonly name = "Injured";

  adjustOutgoingDamage(base: number): number { 
    return roundDownInt(base * INJURED_DAMAGE_MULTIPLIER); 
  }

  adjustKiCost(base: number): number { 
    return roundDownInt(base * INJURED_KI_COST_MULTIPLIER); 
  }
}

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

/* Extension :
   - add new state SuperSaiyan en implémentant WarriorState
   - Garder les transitions dans Warrior.recomputeState()
*/
