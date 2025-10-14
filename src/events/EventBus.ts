// EventBus : pub/sub global (Singleton)

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
  public subscribe(obs: Observer): void { this.observers.add(obs); }
  public unsubscribe(obs: Observer): void { this.observers.delete(obs); }

  // Diffuse l'évènement à tous les observers (résilient aux erreurs)
  public emit(event: GameEvent): void {
    for (const obs of this.observers) {
      try { obs.update(event); }
      catch (err) { console.warn("[EventBus] Observer error:", err); }
    }
  }
  //#endregion
}

// Instance prête à l'emploi
export const eventBus = EventBus.getInstance();
