// Patterns: Observer (pub/sub) + Singleton

import type { GameEvent } from "./GameEvents";

//#region Types
export interface Observer { update(event: GameEvent): void; }
//#endregion

export class EventBus {
  private static instance: EventBus;
  private readonly observers = new Set<Observer>();

  private constructor() {}

  //#region Singleton
  public static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }
  //#endregion

  //#region API
  public subscribe(observer: Observer): void { this.observers.add(observer); }
  public unsubscribe(observer: Observer): void { this.observers.delete(observer); }

  public emit(event: GameEvent): void {
    for (const observer of this.observers) {
      try { observer.update(event); }
      catch (err) { console.warn("[EventBus] Observer error:", err); }
    }
  }
  //#endregion
}

// Instance prête à l'emploi
export const eventBus = EventBus.getInstance();
