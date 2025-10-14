// TurnManager - alternance stricte P1 <=> P2
// Le tour affiché = n° de round (n'augmente qu'au retour sur P1).

import { eventBus } from "../events/EventBus";
import type { TurnChangedEvent, BattleStartedEvent } from "../events/GameEvents";
import type { Warrior } from "../domain/Warrior";

export class TurnManager {
  //#region State
  private readonly fighters: [Warrior, Warrior];
  private turnNumber = 1; // round partagé par P1 et P2
  private activeIndex = 0; // 0 = P1, 1 = P2
  //#endregion

  constructor(a: Warrior, b: Warrior) {
    this.fighters = [a, b];

    // début de combat (reset de certains états côté domaine)
    const start: BattleStartedEvent = {
      kind: "BattleStarted",
      timestamp: Date.now(),
      p1: a.name,
      p2: b.name,
    };
    eventBus.emit(start);
  }

  //#region Getters
  public getActive(): Warrior   { return this.fighters[this.activeIndex]; }
  public getOpponent(): Warrior { return this.fighters[1 - this.activeIndex]; }
  public getTurnNumber(): number { return this.turnNumber; }
  //#endregion

  //#region Advance
  // Passe à l'autre joueur ; +1 round quand on revient à P1
  public nextTurn(): void {
    this.activeIndex = 1 - this.activeIndex;
    if (this.activeIndex === 0) this.turnNumber += 1;

    const evt: TurnChangedEvent = {
      kind: "TurnChanged",
      timestamp: Date.now(),
      turnNumber: this.turnNumber,
      active: this.getActive().name,
      opponent: this.getOpponent().name,
    };
    eventBus.emit(evt);
  }
  //#endregion
}
