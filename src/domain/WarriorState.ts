// WarriorState : State (GoF)
// Module dégâts sortants et coût en Ki selon l’état.
// Les transitions sont faites dans Warrior.recomputeState().

import {
  STATE_NORMAL_DAMAGE_MULT,
  STATE_NORMAL_KI_COST_MULT,
  STATE_INJURED_DAMAGE_MULT,
  STATE_INJURED_KI_COST_MULT,
  STATE_EXHAUSTED_DAMAGE_MULT,
  STATE_EXHAUSTED_KI_COST_MULT,
} from "./Balance";

//#region Types
export type WarriorStateName = "Normal" | "Injured" | "Exhausted" | "Dead";

export interface WarriorState {
  readonly name: WarriorStateName;
  adjustOutgoingDamage(baseDamage: number): number; // après calcul de base
  adjustKiCost(baseCost: number): number; // avant dépense
}
//#endregion

//#region Helpers
function roundDownInt(v: number): number { 
  return Math.floor(v); 
}
//#endregion

//#region Concrete states
export class NormalState implements WarriorState {
  public readonly name = "Normal";

  adjustOutgoingDamage(base: number): number { 
    return roundDownInt(base * STATE_NORMAL_DAMAGE_MULT); 
  }

  adjustKiCost(base: number): number        { 
    return roundDownInt(base * STATE_NORMAL_KI_COST_MULT); 
  }
}

export class InjuredState implements WarriorState {
  public readonly name = "Injured";
  adjustOutgoingDamage(base: number): number { 
    return roundDownInt(base * STATE_INJURED_DAMAGE_MULT); 
  }

  adjustKiCost(base: number): number { 
    return roundDownInt(base * STATE_INJURED_KI_COST_MULT); 
  }
}

export class ExhaustedState implements WarriorState {
  public readonly name = "Exhausted";
  adjustOutgoingDamage(base: number): number { 
    return roundDownInt(base * STATE_EXHAUSTED_DAMAGE_MULT); 
  }

  adjustKiCost(base: number): number { 
    return roundDownInt(base * STATE_EXHAUSTED_KI_COST_MULT); 
  }
}

export class DeadState implements WarriorState {
  public readonly name = "Dead";
  adjustOutgoingDamage(_base: number): number { 
    return 0; 
  } // ne fait plus de dégâts
  adjustKiCost(base: number): number { 
    return base; 
  } // aucun bonus de coût
}
//#endregion
