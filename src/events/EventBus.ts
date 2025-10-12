// ──────────────────────
// Pattern : Observer : 
// ──────────────────────

import type { GameEvent } from "./GameEvents";

export interface Observer {
  update(event: GameEvent): void;
}

export class EventBus {
  private static instance: EventBus;
  private observers: Set<Observer> = new Set();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  //#region Event
  public subscribe(obs: Observer): void { this.observers.add(obs); }
  public unsubscribe(obs: Observer): void { this.observers.delete(obs); }

  public emit(event: GameEvent): void {
    for (const obs of this.observers) obs.update(event);
  }
  //#endregion
}

export const eventBus = EventBus.getInstance();
