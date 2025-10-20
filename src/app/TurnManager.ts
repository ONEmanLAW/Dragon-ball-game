import { eventBus } from "../events/EventBus";
import type { TurnChangedEvent, BattleStartedEvent } from "../events/GameEvents";
import type { Warrior } from "../domain/Warrior";

export class TurnManager {
  //#region Fields
  private readonly fighters: [Warrior, Warrior];
  private turnNumber = 1;   // round partagé P1/P2
  private activeIndex = 0;  // 0 = P1, 1 = P2
  //#endregion

  //#region Ctor
  constructor(fighterA: Warrior, fighterB: Warrior) {
    this.fighters = [fighterA, fighterB];

    const start: BattleStartedEvent = {
      kind: "BattleStarted",
      timestamp: Date.now(),
      p1: fighterA.name,
      p2: fighterB.name,
    };
    eventBus.emit(start);
  }
  //#endregion

  //#region Getters
  public getActive(): Warrior { return this.fighters[this.activeIndex]; }
  public getOpponent(): Warrior { return this.fighters[1 - this.activeIndex]; }
  public getTurnNumber(): number { return this.turnNumber; }
  //#endregion

  //#region Advance
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
