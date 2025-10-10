// src/state/WarriorState.ts
/*
* Pattern : STATE
* ------------------------------------------------------------------
* - Chaque état modifie le coût en Ki et/ou les dégâts sortants.
* - Les transitions d’état sont gérées par le Warrior (en fonction PV/Ki).
*/

export type WarriorStateName = "Normal" | "Injured" | "Exhausted";

export interface WarriorState {
  readonly name: WarriorStateName;
  adjustOutgoingDamage(baseDamage: number): number;
  adjustKiCost(baseCost: number): number;
}

/** Normal: pas de modif */
export class NormalState implements WarriorState {
  public readonly name = "Normal";
  adjustOutgoingDamage(base: number): number { return Math.floor(base); }
  adjustKiCost(base: number): number { return Math.floor(base); }
}

/** Injured: damage -20% */
export class InjuredState implements WarriorState {
  public readonly name = "Injured";
  adjustOutgoingDamage(base: number): number { return Math.floor(base * 0.8); }
  adjustKiCost(base: number): number { return Math.floor(base); }
}

/** Exhausted: damage -10%, cout en Ki +20% */
export class ExhaustedState implements WarriorState {
  public readonly name = "Exhausted";
  adjustOutgoingDamage(base: number): number { return Math.floor(base * 0.9); }
  adjustKiCost(base: number): number { return Math.floor(base * 1.2); }
}