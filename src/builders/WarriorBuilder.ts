// ────────────────────────────────────────────────────────────
// Pattern : Builder — création d'un custom Warrior
// ────────────────────────────────────────────────────────────

import { WarriorFactory } from "../core/WarriorFactory";
import type { Warrior, WarriorStats, WarriorType } from "../models/Warrior";

//#region Types de choix KI
export type SaiyanKiChoice   = "Kamehameha" | "Final Flash";
export type NamekianKiChoice = "Makankōsappō";
export type AndroidKiChoice  = "Laser Shot";
//#endregion

//#region Default Label
const NORMAL_LABEL = "Basic Attack" as const;
const DEFAULT_KI_LABEL_BY_RACE: Record<WarriorType, string> = {
  Saiyan:   "Kamehameha",
  Namekian: "Makankōsappō",
  Android:  "Laser Shot",
};
//#endregion

export class WarriorBuilder {
  private _race?: WarriorType;
  private _name?: string;
  private _description: string = "Custom warrior";
  private _statsOverride?: Partial<WarriorStats>;
  private _level: number = 1; // le joueur commence toujours LVL 1

  private _kiLabel?: string;

  //#region Étapes
  public ofRace(race: WarriorType): this { this._race = race; return this; }
  public named(name: string): this { this._name = name.trim(); return this; }
  public describedAs(desc: string): this { this._description = desc.trim() || this._description; return this; }
  public withStats(stats: Partial<WarriorStats>): this { this._statsOverride = { ...this._statsOverride, ...stats }; return this; }

  public withSaiyanKi(choice: SaiyanKiChoice): this {
    if (this._race && this._race !== "Saiyan") 
      throw new Error("KI dispo seulement pour Saiyan.");
    this._kiLabel = choice; 
    return this;
  }
  
  public withNamekianKi(choice: NamekianKiChoice = "Makankōsappō"): this {
    if (this._race && this._race !== "Namekian") 
      throw new Error("KI dispo seulement pour Namekian.");
    this._kiLabel = choice; 
    return this;
  }

  public withAndroidKi(choice: AndroidKiChoice = "Laser Shot"): this {
    if (this._race && this._race !== "Android") 
      throw new Error("KI dispo seulement pour Android.");
    this._kiLabel = choice; 
    return this;
  }
  //#endregion

  //#region Build
  public build(): Warrior {
    if (!this._race) throw new Error("Race requise.");
    if (!this._name || this._name.length === 0) throw new Error("Nom requis.");

    const warrior = WarriorFactory.create(this._race, this._name, this._description, this._statsOverride);
    const ki = this._kiLabel ?? DEFAULT_KI_LABEL_BY_RACE[this._race];

    warrior.setAttackLabels({ Normal: NORMAL_LABEL, KiEnergy: ki });
    warrior.setLevel(this._level); // toujours 1
    return warrior;
  }
  //#endregion
}
