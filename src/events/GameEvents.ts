// ─────────────────────────────────
// Typage des événements de jeu
// ─────────────────────────────────

export type GameEvent = | AttackExecutedEvent | StateChangedEvent | TurnChangedEvent;
export type EventKind = "AttackExecuted" | "StateChanged" | "TurnChanged";

export interface BaseEvent {
  kind: EventKind;
  timestamp: number;
}

//#region AttackExecuted
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
//#endregion

//#region StateChanged
export interface StateChangedEvent extends BaseEvent {
  kind: "StateChanged";
  warrior: string;
  from: string;
  to: string;
}
//#endregion

//#region TurnChanged
export interface TurnChangedEvent extends BaseEvent {
  kind: "TurnChanged";
  turnNumber: number;
  active: string;
  opponent: string;
}
//#endregion
