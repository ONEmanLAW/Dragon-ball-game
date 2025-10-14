// GameEvents : contrats d’événements (pub/sub)


//#region Base
export type EventKind =
  | "AttackExecuted"
  | "StateChanged"
  | "TurnChanged"
  | "BattleStarted"
  | "BattleEnded"
  | "EffectStarted"
  | "EffectTick"
  | "EffectEnded";

export interface BaseEvent {
  kind: EventKind;
  timestamp: number; // Date.now() (ms)
}
//#endregion


//#region Effets (Decorators)
export type EffectKind = "SuperSaiyan" | "Regeneration" | "EnergyLeech";

export interface EffectStartedEvent extends BaseEvent {
  kind: "EffectStarted";
  who: string; // porteur
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

export interface StateChangedEvent extends BaseEvent {
  kind: "StateChanged";
  warrior: string;
  from: string;
  to: string;
}

export interface TurnChangedEvent extends BaseEvent {
  kind: "TurnChanged";
  turnNumber: number; // round courant (partagé P1/P2)
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
  | StateChangedEvent
  | TurnChangedEvent
  | BattleStartedEvent
  | BattleEndedEvent
  | EffectStartedEvent
  | EffectTickEvent
  | EffectEndedEvent;
//#endregion
