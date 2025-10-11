// src/core/TurnManager.ts
/*
 * TurnManager (tour par tour, alternance stricte)
 * ------------------------------------------------------------------
 * - Ne gère AUCUNE logique d'attaque : seulement qui joue, quel tour.
 * - Ordre : A → B → A → B etc...
 */

import { Warrior } from "../models/Warrior";

export class TurnManager {
  private readonly fighters: [Warrior, Warrior];
  private turnNumber  = 1;
  private activeIndex = 0; // -- 0 = P1 /// 1 = P2 -- //

  constructor (a: Warrior, b: Warrior) {
    this.fighters = [a, b];
  }

  //#region API

  public getActive(): Warrior {
    return this.fighters[this.activeIndex];
  }

  public getOpponent(): Warrior {
    return this.fighters[1 - this.activeIndex];
  }

  public getTurnNumber(): number {
    return this.turnNumber;
  }

  public nextTurn(): void {
    this.activeIndex = 1 - this.activeIndex;
    this.turnNumber += 1;
  }

  //#endregion
}


