// src/events/GameEvents.ts
//#region Types Evenements
export type GameEvent =
  | AttackExecutedEvent
  | StateChangedEvent
  | TurnChangedEvent;

export type EventKind = "AttackExecuted" | "StateChanged" | "TurnChanged";

export interface BaseEvent {
  kind: EventKind;
  timestamp: number;
}

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
  turnNumber: number;
  active: string;
  opponent: string;
}

//#endregion
