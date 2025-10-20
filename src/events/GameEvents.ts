// Patterns: Observer (pub/sub contracts)

//#region Base
export type EventKind =
  | "AttackExecuted"
  | "AttackDodged"
  | "StateChanged"
  | "TurnChanged"
  | "BattleStarted"
  | "BattleEnded"
  | "EffectStarted"
  | "EffectTick"
  | "EffectEnded";

export interface BaseEvent {
  kind: EventKind;
  timestamp: number; // ms since epoch
}
//#endregion

//#region Effects (Decorator)
export type EffectKind = "SuperSaiyan" | "Regeneration" | "EnergyLeech";

export interface EffectStartedEvent extends BaseEvent {
  kind: "EffectStarted";
  who: string; // carrier
  effect: EffectKind;
  totalRounds: number;
}

export interface EffectTickEvent extends BaseEvent {
  kind: "EffectTick";
  who: string;
  effect: EffectKind;
  remainingRounds: number;
}

export interface EffectEndedEvent extends BaseEvent {
  kind: "EffectEnded";
  who: string;
  effect: EffectKind;
}
//#endregion

//#region Combat
export interface AttackExecutedEvent extends BaseEvent {
  kind: "AttackExecuted";
  attacker: string;
  defender: string;
  attackName: string;
  kiSpent: number;
  damage: number;
  defenderRemainingVitality: number;
  attackerRemainingKi: number;
}

export interface AttackDodgedEvent extends BaseEvent {
  kind: "AttackDodged";
  attacker: string;
  defender: string;
  attackName: string;
}

export interface StateChangedEvent extends BaseEvent {
  kind: "StateChanged";
  warrior: string;
  from: string;
  to: string;
}

export interface TurnChangedEvent extends BaseEvent {
  kind: "TurnChanged";
  turnNumber: number; // shared round (P1/P2)
  active: string;
  opponent: string;
}

export interface BattleStartedEvent extends BaseEvent {
  kind: "BattleStarted";
  p1: string;
  p2: string;
}

export interface BattleEndedEvent extends BaseEvent {
  kind: "BattleEnded";
  winner: string;
  loser: string;
}
//#endregion

//#region Union
export type GameEvent =
  | AttackExecutedEvent
  | AttackDodgedEvent
  | StateChangedEvent
  | TurnChangedEvent
  | BattleStartedEvent
  | BattleEndedEvent
  | EffectStartedEvent
  | EffectTickEvent
  | EffectEndedEvent;
//#endregion
